import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VariantImage, ColorSwatch } from '@/types/product'
import type Stripe from 'stripe'

const CheckoutItemSchema = z.object({
  product_id: z.string().min(1),
  size: z.string().optional().default(''),
  color: z.string().optional().default(''),
  quantity: z.number().int().min(1).max(99),
})

const CheckoutSchema = z.object({
  items: z.array(CheckoutItemSchema).min(1),
  shippingAddress: z.record(z.string()).optional(),
  discountCode: z.string().trim().optional(),
  giftCardCode: z.string().trim().optional(),
  paymentMethod: z.enum(['stripe', 'bizum']).optional().default('stripe'),
  notes: z.string().trim().optional(),
})

type CheckoutInput = z.infer<typeof CheckoutSchema>

export async function POST(request: Request) {
  const { userId } = await auth()

  let body: CheckoutInput
  try {
    body = CheckoutSchema.parse(await request.json())
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0]?.message ?? 'Invalid request body' }, { status: 400 })
    }
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { items, shippingAddress } = body
  const discountCode = body.discountCode || undefined
  const giftCardCode = body.giftCardCode || undefined
  const paymentMethod = body.paymentMethod ?? 'stripe'
  const notes = body.notes ?? ''

  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price_cents, images, colors, stock_quantity, track_inventory')
    .in('id', items.map((i) => i.product_id))

  if (error || !products) {
    return NextResponse.json({ error: 'Products not found' }, { status: 404 })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

  // Validar stock antes de crear la sesión de pago
  const needsVariants = items.some((i) => i.size || i.color)
  const variantMap = new Map<string, { stock_quantity: number; track_inventory: boolean }>()
  if (needsVariants) {
    const { data: variants } = await supabase
      .from('product_variants')
      .select('product_id, size, color_slug, stock_quantity, track_inventory')
      .in('product_id', items.map((i) => i.product_id))
    for (const v of variants ?? []) {
      const key = `${v.product_id}::${v.size ?? ''}::${v.color_slug ?? ''}`
      variantMap.set(key, v)
    }
  }

  for (const item of items) {
    const product = productMap.get(item.product_id)
    if (!product) continue
    const hasVariant = Boolean(item.size || item.color)
    if (hasVariant) {
      const key = `${item.product_id}::${item.size ?? ''}::${item.color ?? ''}`
      const variant = variantMap.get(key)
      if (!variant) {
        return NextResponse.json({ error: `La variante seleccionada no existe para ${product.name}.` }, { status: 400 })
      }
      if (variant.track_inventory && (variant.stock_quantity ?? 0) < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${product.name} (${item.size ? 'Talla ' + item.size : ''}${item.color ? ' Color ' + item.color : ''}).` }, { status: 400 })
      }
    } else {
      if (product.track_inventory && (product.stock_quantity ?? 0) < item.quantity) {
        return NextResponse.json({ error: `Stock insuficiente para ${product.name}.` }, { status: 400 })
      }
    }
  }

  const line_items = items.map((item) => {
    const product = productMap.get(item.product_id)
    if (!product) throw new Error(`Product ${item.product_id} not found`)

    const images = (product.images as VariantImage[]) ?? []
    const colorImage = images.find((img) => img.color === item.color)
    const firstImage = colorImage?.url ?? images[0]?.url

    const colors = (product.colors as ColorSwatch[]) ?? []
    const colorName = colors.find((c) => c.slug === item.color)?.name ?? item.color

    const sizeLabel = item.size ? ` / ${item.size}` : ''
    return {
      price_data: {
        currency: 'eur',
        product_data: {
          name: `${product.name} — ${colorName}${sizeLabel}`,
          images: firstImage ? [firstImage] : [],
        },
        unit_amount: product.price_cents,
      },
      quantity: item.quantity,
    }
  })

  const { data: settings } = await supabase.from('settings').select('value').eq('key', 'shipping').single()
  const shippingSettings = (settings?.value ?? {}) as Record<string, unknown>
  const shippingRate = Number(shippingSettings.shipping_rate ?? 10)
  const freeThreshold = Number(shippingSettings.free_shipping_threshold ?? 200)

  const subtotalCents = line_items.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity!, 0)
  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = subtotalCents >= freeThreshold * 100
    ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'eur' }, display_name: 'Free Shipping', delivery_estimate: { minimum: { unit: 'business_day', value: 5 }, maximum: { unit: 'business_day', value: 10 } } } }]
    : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: shippingRate * 100, currency: 'eur' }, display_name: 'Standard Shipping', delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } } } }]

  const now = new Date().toISOString()

  let discountAmountCents = 0
  if (discountCode) {
    const { data: discount } = await supabase
      .from('discounts')
      .select('id, type, value, min_purchase_cents, max_uses, used_count, active, starts_at, expires_at')
      .eq('code', discountCode)
      .maybeSingle()

    if (!discount || discount.active === false) {
      return NextResponse.json({ error: 'El código de descuento no es válido.' }, { status: 400 })
    }
    if (discount.starts_at && discount.starts_at > now) {
      return NextResponse.json({ error: 'Este código de descuento aún no está activo.' }, { status: 400 })
    }
    if (discount.expires_at && discount.expires_at < now) {
      return NextResponse.json({ error: 'Este código de descuento ha expirado.' }, { status: 400 })
    }
    if (discount.min_purchase_cents && subtotalCents < discount.min_purchase_cents) {
      return NextResponse.json({ error: 'Este código requiere un pedido mínimo.' }, { status: 400 })
    }
    if (discount.max_uses != null && (discount.used_count ?? 0) >= discount.max_uses) {
      return NextResponse.json({ error: 'Este código de descuento ya no está disponible.' }, { status: 400 })
    }

    if (discount.type === 'percentage') {
      discountAmountCents = Math.round((subtotalCents * discount.value) / 100)
    } else {
      discountAmountCents = Math.min(discount.value, subtotalCents)
    }
  }

  const remainingAfterDiscount = Math.max(0, subtotalCents - discountAmountCents)

  let giftCardAmountCents = 0
  if (giftCardCode) {
    const { data: giftCard } = await supabase
      .from('gift_cards')
      .select('id, remaining_balance_cents, active, expires_at')
      .eq('code', giftCardCode)
      .maybeSingle()

    if (!giftCard || giftCard.active === false || (giftCard.remaining_balance_cents ?? 0) <= 0) {
      return NextResponse.json({ error: 'La tarjeta regalo no es válida o no tiene saldo.' }, { status: 400 })
    }
    if (giftCard.expires_at && giftCard.expires_at < now) {
      return NextResponse.json({ error: 'Esta tarjeta regalo ha expirado.' }, { status: 400 })
    }

    giftCardAmountCents = Math.min(giftCard.remaining_balance_cents, remainingAfterDiscount)
  }

  const totalDiscountCents = discountAmountCents + giftCardAmountCents
  const subtotalAfterDiscountCents = Math.max(0, subtotalCents - totalDiscountCents)
  const shippingCents = subtotalCents >= freeThreshold * 100 ? 0 : shippingRate * 100
  const finalTotalCents = subtotalAfterDiscountCents + shippingCents

  const orderPayload = {
    user_id: userId || ("guest_" + crypto.randomUUID()),
    status: 'pending' as const,
    total_cents: finalTotalCents,
    payment_method: paymentMethod,
    shipping_address: shippingAddress ?? null,
    discount_code: discountCode ?? null,
    discount_amount_cents: discountAmountCents,
    gift_card_code: giftCardCode ?? null,
    gift_card_amount_cents: giftCardAmountCents,
    notes,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: productMap.get(item.product_id)?.name ?? '',
      quantity: item.quantity,
      price_cents: productMap.get(item.product_id)?.price_cents ?? 0,
      size: item.size,
      color: item.color,
    })),
  }

  if (paymentMethod === 'bizum') {
    const { data: order, error: orderError } = await supabase.from('orders').insert(orderPayload).select('id').single()
    if (orderError || !order) {
      console.error('Order creation error:', orderError)
      return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
    }
    return NextResponse.json({ success: true, orderId: order.id, paymentMethod: 'bizum' })
  }

  const origin = request.headers.get('origin') ?? ''
  const stripe = getStripe()

  let couponId: string | undefined
  if (totalDiscountCents > 0) {
    try {
      const coupon = await stripe.coupons.create({
        amount_off: totalDiscountCents,
        currency: 'eur',
        duration: 'once',
        name: 'Sportbalin descuento',
      })
      couponId = coupon.id
    } catch (couponError: unknown) {
      console.error('Stripe coupon creation error:', couponError)
      return NextResponse.json({ error: 'No se pudo aplicar el descuento. Inténtalo de nuevo.' }, { status: 400 })
    }
  }

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
      ...(couponId ? { discounts: [{ coupon: couponId }] } : {}),
      shipping_options: shippingOptions,
      success_url: `${origin}/orders?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout?canceled=1`,
      shipping_address_collection: {
        allowed_countries: ['US', 'CA', 'GB', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'CH', 'AT', 'PT', 'DK', 'SE', 'NO', 'FI', 'IE', 'AU', 'NZ', 'JP', 'AE', 'MX', 'BR', 'CO'],
      },
      metadata: {
        userId: userId || "guest",
        items: JSON.stringify(items.map((item) => ({
          ...item,
          product_name: productMap.get(item.product_id)?.name ?? "",
          price_cents: productMap.get(item.product_id)?.price_cents ?? 0,
        }))),
        ...(discountCode ? { discount_code: discountCode } : {}),
        ...(giftCardCode ? { gift_card_code: giftCardCode } : {}),
        discount_amount_cents: String(discountAmountCents),
        gift_card_amount_cents: String(giftCardAmountCents),
      },
    })
  } catch (stripeError: unknown) {
    const message = stripeError instanceof Error ? stripeError.message : 'Payment processing failed. Please try again.'
    console.error('Stripe session creation error:', stripeError)
    return NextResponse.json({ error: message }, { status: 400 })
  }

  const { error: orderError } = await supabase.from('orders').insert({
    ...orderPayload,
    stripe_session_id: session.id,
  })

  if (orderError) {
    console.error('Order creation error:', orderError)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
