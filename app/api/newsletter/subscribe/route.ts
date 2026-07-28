import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    const trimmedEmail = email.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    const supabase = createAdminClient()

    const { data: existing } = await supabase
      .from('newsletter_subscribers')
      .select('id, status')
      .eq('email', trimmedEmail)
      .maybeSingle()

    if (existing) {
      if (existing.status === 'unsubscribed') {
        const { error } = await supabase
          .from('newsletter_subscribers')
          .update({ status: 'active', unsubscribed_at: null })
          .eq('id', existing.id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ message: 'Subscription reactivated' })
      }
      return NextResponse.json({ message: 'Already subscribed' })
    }

    const { error } = await supabase
      .from('newsletter_subscribers')
      .insert({ email: trimmedEmail, source: 'footer' })

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ message: 'Already subscribed' })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Subscribed successfully' })
  } catch {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}
