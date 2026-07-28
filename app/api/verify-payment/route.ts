import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe'
import { createAdminClient } from '@/lib/supabase/admin'

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

      return NextResponse.json({ status: 'paid' })
    }

    return NextResponse.json({ status: session.payment_status ?? 'pending' })
  } catch (e) {
    console.error('Stripe verification error:', e)
    return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
  }
}
