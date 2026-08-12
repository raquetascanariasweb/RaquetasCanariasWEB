import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VariantImage, ColorSwatch } from '@/types/product'
import type Stripe from 'stripe'

export async function POST(request: Request) {
  const { userId } = await auth()

  const body = await request.json()
  const { items, shippingAddress } = body as {
    items: { product_id: string; size: string; color: string; quantity: number }[]
    shippingAddress?: Record<string, string>
  }

  if (!items?.length) {
    return NextResponse.json({ error: 'Cart is empty' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: products, error } = await supabase
    .from('products')
    .select('id, name, price_cents, images, colors')
    .in('id', items.map((i) => i.product_id))

  if (error || !products) {
    return NextResponse.json({ error: 'Products not found' }, { status: 404 })
  }

  const productMap = new Map(products.map((p) => [p.id, p]))

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
  const shippingSettings = (settings?.value ?? {}) as any
  const shippingRate = shippingSettings.shipping_rate ?? 10
  const freeThreshold = shippingSettings.free_shipping_threshold ?? 200

  const subtotalCents = line_items.reduce((sum, li) => sum + li.price_data.unit_amount * li.quantity!, 0)
  const shippingOptions: Stripe.Checkout.SessionCreateParams.ShippingOption[] = subtotalCents >= freeThreshold * 100
    ? [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: 0, currency: 'eur' }, display_name: 'Free Shipping', delivery_estimate: { minimum: { unit: 'business_day', value: 5 }, maximum: { unit: 'business_day', value: 10 } } } }]
    : [{ shipping_rate_data: { type: 'fixed_amount', fixed_amount: { amount: shippingRate * 100, currency: 'eur' }, display_name: 'Standard Shipping', delivery_estimate: { minimum: { unit: 'business_day', value: 3 }, maximum: { unit: 'business_day', value: 7 } } } }]

  const origin = request.headers.get('origin') ?? ''

  const stripe = getStripe()

  let session: Stripe.Checkout.Session
  try {
    session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items,
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
      },
    })
  } catch (stripeError: any) {
    console.error('Stripe session creation error:', stripeError)
    return NextResponse.json(
      { error: stripeError?.message ?? 'Payment processing failed. Please try again.' },
      { status: 400 }
    )
  }

  const { error: orderError } = await supabase.from('orders').insert({
    user_id: userId || ("guest_" + crypto.randomUUID()),
    status: 'pending',
    total_cents: subtotalCents,
    stripe_session_id: session.id,
    shipping_address: shippingAddress ?? null,
    items: items.map((item) => ({
      product_id: item.product_id,
      product_name: productMap.get(item.product_id)?.name ?? '',
      quantity: item.quantity,
      price_cents: productMap.get(item.product_id)?.price_cents ?? 0,
      size: item.size,
      color: item.color,
    })),
  })

  if (orderError) {
    console.error('Order creation error:', orderError)
    return NextResponse.json({ error: 'Order creation failed' }, { status: 500 })
  }

  return NextResponse.json({ url: session.url })
}
