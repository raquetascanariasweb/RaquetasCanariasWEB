import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { Resend } from "resend"

const FROM = process.env.RESEND_FROM || "Sportbalin <onboarding@resend.dev>"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

async function sendConfirmationEmail(sessionId: string, customerEmail: string, order: any) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey || !customerEmail) return

  const items = (order.items ?? []) as {
    product_name: string
    price_cents: number
    quantity: number
    size: string
    color: string
  }[]

  const itemsHtml = items
    .map(
      (item) =>
        `<tr>
          <td style="padding:8px 0;border-bottom:1px solid #eee">${item.product_name}${item.size ? " / Talla: " + item.size : ""}${item.color ? " / Color: " + item.color : ""}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
          <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.price_cents * item.quantity)}€</td>
        </tr>`
    )
    .join("")

  const total = items.reduce((s, i) => s + i.price_cents * i.quantity, 0)

  const html = `
    <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
      <h1 style="color:#C4E326">¡Gracias por tu pedido!</h1>
      <p>Hemos recibido tu pedido y lo estamos procesando.</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0">
        <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
        <tbody>${itemsHtml}</tbody>
        <tfoot><tr><td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold">Total:</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px">${formatPrice(total)}€</td></tr></tfoot>
      </table>
      <p style="color:#888;font-size:13px">Si tienes alguna duda, contáctanos en sportbalin@gmail.com</p>
    </div>
  `

  try {
    const resend = new Resend(apiKey)
    await resend.emails.send({ from: FROM, to: customerEmail, subject: `Pedido confirmado #${sessionId.slice(-8)}`, html })
  } catch (e) {
    console.error("[verify-payment] Email error:", e)
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get('session_id')

  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from('orders')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .single()

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 })
  }

  if (order.status === 'paid' || order.status === 'processing' || order.status === 'shipped' || order.status === 'delivered') {
    return NextResponse.json({ status: 'paid', already_updated: true })
  }

  try {
    const stripe = getStripe()
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    const sess = session as unknown as Record<string, unknown>
    if (session.payment_status === 'paid') {
      const shipping = sess.shipping_details as Record<string, unknown> | undefined
      const address = shipping?.address as Record<string, string> | undefined
      const updateData: Record<string, unknown> = {
        status: 'paid',
        shipping_address: shipping && address
          ? {
              name: (shipping.name as string) ?? '',
              line1: (address.line1 as string) ?? '',
              line2: (address.line2 as string) ?? '',
              city: (address.city as string) ?? '',
              state: (address.state as string) ?? '',
              postal_code: (address.postal_code as string) ?? '',
              country: (address.country as string) ?? '',
            }
          : undefined,
      }

      if (session.payment_intent) {
        updateData.stripe_payment_intent = session.payment_intent
      }

      const { error: updateError } = await supabase
        .from('orders')
        .update(updateData)
        .eq('stripe_session_id', sessionId)

      if (updateError) {
        console.error('Order update error:', updateError)
        return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
      }

      await sendConfirmationEmail(sessionId, session.customer_details?.email || "", order)

      return NextResponse.json({ status: 'paid' })
    }

    return NextResponse.json({ status: session.payment_status ?? 'pending' })
  } catch (e) {
    console.error('Stripe verification error:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
