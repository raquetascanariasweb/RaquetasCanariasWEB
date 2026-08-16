import { Resend } from 'resend'
import { render } from '@react-email/components'
import BaseEmail from '@/emails/BaseEmail'
import { createAdminClient } from '@/lib/supabase/admin'
import { ORDER_STATUS_LABELS } from './types'
import type { AdminOrder, NotificationSettings, OrderStatus } from './types'

const FROM_EMAIL = 'Sportbalin <hello@sportbalin.com>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Estados que disparan una notificación y su checkbox asociado.
const STATUS_TO_NOTIFICATION: Partial<Record<OrderStatus, keyof NotificationSettings>> = {
  paid: 'order_confirmed',
  shipped: 'order_shipped',
  delivered: 'order_delivered',
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(email)
}

export async function getNotificationSettings(): Promise<NotificationSettings | null> {
  try {
    const supabase = createAdminClient()
    const { data } = await supabase.from('settings').select('value').eq('key', 'notifications').limit(1)
    const value = data?.[0]?.value
    return (value as NotificationSettings | null) ?? null
  } catch {
    return null
  }
}

function formatMoney(cents: number): string {
  return (cents / 100).toLocaleString('es-ES', { style: 'currency', currency: 'EUR' })
}

function buildOrderHtml(order: AdminOrder, status: OrderStatus): string {
  const statusLabel = ORDER_STATUS_LABELS[status] ?? status
  const items = (order.items ?? [])
    .map((it) => `<li>${it.product_name} — ${it.size}${it.color ? ` / ${it.color}` : ''} × ${it.quantity}</li>`)
    .join('')

  return `
    <p>El pedido <strong>#${order.id.slice(0, 8)}</strong> ha cambiado de estado a <strong>${statusLabel}</strong>.</p>
    <p>Total del pedido: <strong>${formatMoney(order.total_cents)}</strong></p>
    <ul>${items}</ul>
  `.trim()
}

// Pedido de ejemplo usado en la vista previa del admin.
export function getSampleOrder(): AdminOrder {
  return {
    id: '12345678-abcd-4ef0-9abc-1234567890ab',
    user_id: 'user_sample',
    status: 'shipped',
    total_cents: 18900,
    payment_method: 'stripe',
    stripe_session_id: null,
    stripe_payment_intent: null,
    payment_verified_at: null,
    items: [
      { product_id: 'p1', product_name: 'Camiseta Sportbalin Premium', quantity: 2, price_cents: 4500, size: 'M', color: 'Negro' },
      { product_id: 'p2', product_name: 'Leggings Performance', quantity: 1, price_cents: 9900, size: 'S', color: 'Gris' },
    ],
    shipping_address: null,
    notes: '',
    tracking_number: '',
    shipping_carrier: '',
    created_at: new Date().toISOString(),
  }
}

// Construye el asunto y el HTML del correo de notificación de un pedido.
export async function buildOrderStatusEmail(order: AdminOrder, status: OrderStatus): Promise<{ subject: string; html: string }> {
  const statusLabel = ORDER_STATUS_LABELS[status] ?? status
  const subject = `Pedido #${order.id.slice(0, 8)} — ${statusLabel}`
  const html = await render(
    BaseEmail({
      title: 'Sportbalin — Notificación de pedido',
      previewText: subject,
      content: buildOrderHtml(order, status),
      ctaText: 'Ver pedidos',
      ctaUrl: `${APP_URL}/admin/orders`,
    })
  )
  return { subject, html }
}

// Envía el correo de notificación cuando un pedido cambia de estado.
// Nunca lanza excepciones: un fallo de email no debe bloquear la actualización del pedido.
export async function sendOrderStatusNotification(order: AdminOrder, status: OrderStatus): Promise<void> {
  const notificationKey = STATUS_TO_NOTIFICATION[status]
  if (!notificationKey) return

  const settings = await getNotificationSettings()
  if (!settings || !settings[notificationKey]) return

  const to = settings.notification_email?.trim()
  if (!to || !isValidEmail(to)) return

  if (!process.env.RESEND_API_KEY) {
    console.warn('[notifications] RESEND_API_KEY not configured, skipping order email')
    return
  }

  const { subject, html } = await buildOrderStatusEmail(order, status)

  try {
    const resend = new Resend(process.env.RESEND_API_KEY)
    const { error } = await resend.emails.send({ from: FROM_EMAIL, to, subject, html })
    if (error) console.error('[notifications] Resend error:', error.message)
  } catch (e) {
    console.error('[notifications] Failed to send order email:', e)
  }
}

// Elimina cualquier rastro del antiguo webhook y normaliza el email.
export function sanitizeNotificationSettings(value: Partial<NotificationSettings> | null | undefined): NotificationSettings {
  const { webhook_url, ...rest } = (value ?? {}) as Partial<NotificationSettings> & { webhook_url?: string }
  const email = typeof rest.notification_email === 'string' ? rest.notification_email.trim() : ''
  return {
    order_confirmed: rest.order_confirmed ?? true,
    order_shipped: rest.order_shipped ?? true,
    order_delivered: rest.order_delivered ?? true,
    low_stock_alert: rest.low_stock_alert ?? true,
    new_subscriber: rest.new_subscriber ?? false,
    notification_email: email,
  }
}
