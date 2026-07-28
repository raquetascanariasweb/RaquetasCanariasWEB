import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get('stripe-signature')!

  const stripe = getStripe()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const type = (event as any).type as string

  if (type === 'checkout.session.completed') {
    const session = event.data.object as any
    const updateData: Record<string, unknown> = {}

    if (session.payment_status === 'paid') {
      updateData.status = 'paid'
    } else {
      updateData.status = 'pending'
    }

    if (session.payment_intent) {
      updateData.stripe_payment_intent = session.payment_intent
    }

    if (session.shipping_details?.address) {
      updateData.shipping_address = {
        name: session.shipping_details.name ?? '',
        line1: session.shipping_details.address.line1 ?? '',
        line2: session.shipping_details.address.line2 ?? '',
        city: session.shipping_details.address.city ?? '',
        state: session.shipping_details.address.state ?? '',
        postal_code: session.shipping_details.address.postal_code ?? '',
        country: session.shipping_details.address.country ?? '',
      }
    }

    if (Object.keys(updateData).length > 0) {
      await supabase.from('orders').update(updateData).eq('stripe_session_id', session.id)
    }
  } else if (type === 'checkout.session.async_payment_succeeded') {
    const session = event.data.object as any
    const updateData: Record<string, unknown> = { status: 'paid' }
    if (session.payment_intent) {
      updateData.stripe_payment_intent = session.payment_intent
    }
    if (session.shipping_details?.address) {
      updateData.shipping_address = {
        name: session.shipping_details.name ?? '',
        line1: session.shipping_details.address.line1 ?? '',
        line2: session.shipping_details.address.line2 ?? '',
        city: session.shipping_details.address.city ?? '',
        state: session.shipping_details.address.state ?? '',
        postal_code: session.shipping_details.address.postal_code ?? '',
        country: session.shipping_details.address.country ?? '',
      }
    }
    await supabase.from('orders').update(updateData).eq('stripe_session_id', session.id)
  } else if (type === 'checkout.session.async_payment_failed') {
    const session = event.data.object as any
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('stripe_session_id', session.id)
  } else if (type === 'checkout.session.expired') {
    const session = event.data.object as any
    await supabase
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('stripe_session_id', session.id)
  } else if (type === 'charge.refunded' || type === 'payment_intent.refunded') {
    const paymentIntent = event.data.object as any
    const sessionId = paymentIntent.metadata?.stripe_session_id
    if (sessionId) {
      await supabase
        .from('orders')
        .update({ status: 'refunded' })
        .eq('stripe_session_id', sessionId)
    }
  }

  return NextResponse.json({ received: true })
}
