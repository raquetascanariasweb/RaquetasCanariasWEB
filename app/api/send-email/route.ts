import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import BaseEmail from '@/emails/BaseEmail'

const FROM_EMAIL = 'Sportbalin <hello@sportbalin.com>'

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
    if (!userId || userId !== adminId) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { to, subject, content, previewText, ctaText, ctaUrl, recipientName } = body

    if (!to || typeof to !== 'string' || !to.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid recipient email (to).' },
        { status: 400 }
      )
    }

    if (!subject || typeof subject !== 'string' || !subject.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid subject.' },
        { status: 400 }
      )
    }

    if (!content || typeof content !== 'string' || !content.trim()) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid content.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to.trim())) {
      return NextResponse.json(
        { success: false, error: 'Invalid recipient email format.' },
        { status: 400 }
      )
    }

    const apiKey = process.env.RESEND_API_KEY
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'Email service is not configured. Set RESEND_API_KEY.' },
        { status: 503 }
      )
    }

    const html = await render(
      BaseEmail({
        title: subject,
        previewText: previewText || subject,
        content: content.trim(),
        ctaText,
        ctaUrl,
        recipientName,
      })
    )

    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to: to.trim(),
      subject: subject.trim(),
      html,
    })

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message || 'Failed to send email.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, message: 'Email sent successfully.', id: data?.id },
      { status: 200 }
    )
  } catch (error) {
    console.error('Send email error:', error)
    const message = error instanceof Error ? error.message : 'An unexpected error occurred.'
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    )
  }
}
