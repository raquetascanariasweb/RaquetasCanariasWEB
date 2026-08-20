import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { z } from 'zod'
import { Resend } from 'resend'
import { render } from '@react-email/components'
import BaseEmail from '@/emails/BaseEmail'
import { isAdmin } from '@/lib/admin-auth'

const FROM_EMAIL = 'Raquetas Canarias <info@raquetascanarias.com>'

const SendEmailSchema = z.object({
  to: z.string().trim().email(),
  subject: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(10000),
  previewText: z.string().trim().max(200).optional(),
  ctaText: z.string().trim().max(100).optional(),
  ctaUrl: z.string().trim().url().optional(),
  recipientName: z.string().trim().max(200).optional(),
})

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!isAdmin(userId)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const parsed = SendEmailSchema.safeParse(body)
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid request body.'
      return NextResponse.json(
        { success: false, error: message },
        { status: 400 }
      )
    }

    const { to, subject, content, previewText, ctaText, ctaUrl, recipientName } = parsed.data

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
        content,
        ctaText,
        ctaUrl,
        recipientName,
      })
    )

    const resend = new Resend(apiKey)
    const { data, error } = await resend.emails.send({
      from: FROM_EMAIL,
      to,
      subject,
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
