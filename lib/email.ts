import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY

let resend: Resend | null = null

function getResend(): Resend {
  if (!resend) {
    if (!resendApiKey) throw new Error('RESEND_API_KEY not configured')
    resend = new Resend(resendApiKey)
  }
  return resend
}

export function isResendConfigured(): boolean {
  return !!process.env.RESEND_API_KEY
}

export interface SendCampaignOptions {
  subject: string
  html: string
  plainText?: string
  fromName?: string
  fromEmail?: string
  to: { email: string; subscriberId?: string }[]
}

export async function sendCampaignEmail(opts: SendCampaignOptions) {
  const r = getResend()
  const fromName = opts.fromName || 'Raquetas Canarias'
  const fromEmail = opts.fromEmail || 'info@raquetascanarias.com'
  const from = `${fromName} <${fromEmail}>`

  const result = await r.emails.send({
    from,
    to: opts.to.map((t) => t.email),
    subject: opts.subject,
    html: opts.html,
    text: opts.plainText,
  })

  return result
}
