'use server'

import { requireAdmin } from '@/lib/admin-auth'

async function checkAdmin() {
  await requireAdmin()
}

const SAMPLE_ORDER_NUMBER = '12345678'

// Renderiza el preview del correo a partir del asunto y cuerpo (HTML) de una plantilla.
export async function renderEmailTemplatePreview(subject: string, body: string): Promise<{ subject: string; html: string }> {
  await checkAdmin()
  const previewSubject = (subject || '').replace(/#\{order_number\}/g, SAMPLE_ORDER_NUMBER)
  const htmlBody = (body || '').replace(/#\{order_number\}/g, SAMPLE_ORDER_NUMBER)
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8" /></head><body style="margin:0;padding:24px;background:#e9e9ee;font-family:Arial,sans-serif;">${htmlBody}</body></html>`
  return { subject: previewSubject, html }
}
