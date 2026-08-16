import { NextResponse } from "next/server"
import { getStripe } from "@/lib/stripe"
import { createAdminClient } from "@/lib/supabase/admin"
import { decrementStockWithFallback } from "@/lib/stock"
import { Resend } from "resend"

const FROM = process.env.RESEND_FROM || "Sportbalin <onboarding@resend.dev>"

function formatPrice(cents: number) {
  return (cents / 100).toFixed(2)
}

interface OrderItem {
  product_id: string
  product_name: string
  price_cents: number
  quantity: number
  size: string
  color: string
}

async function sendOrderConfirmation(session: any) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn("[webhook] RESEND_API_KEY not configured, skipping email")
    return
  }

  const email = session.customer_details?.email
  if (!email) {
    console.warn("[webhook] No customer email in session, skipping")
    return
  }

  const supabase = createAdminClient()

  const { data: order } = await supabase
    .from("orders")
    .select("id, total_cents, customer_email, shipping_address")
    .eq("stripe_session_id", session.id)
    .maybeSingle()

  const { data: settings } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "email_templates")
    .single()

  const templates = (settings?.value ?? {}) as Record<string, string>
  const orderNumber = order?.id?.slice(0, 8) ?? session.id?.slice(-8) ?? ""
  const totalCents = order?.total_cents ?? session.amount_total ?? 0
  const total = `${formatPrice(totalCents)}€`

  const shippingAddress = (order?.shipping_address ?? session.shipping_details?.address) as Record<string, string> | undefined
  const shippingName = (order?.shipping_address as Record<string, string> | undefined)?.name ?? session.shipping_details?.name ?? ""
  const addressHtml = shippingAddress
    ? `${shippingName}<br>${shippingAddress.line1 ?? ""}${shippingAddress.line2 ? "<br>" + shippingAddress.line2 : ""}<br>${shippingAddress.postal_code ?? ""} ${shippingAddress.city ?? ""}<br>${shippingAddress.country ?? ""}`
    : ""

  const subject = (templates.order_confirmation_subject || "Pedido confirmado — #{order_number}")
    .replace(/#\{order_number\}/g, orderNumber)
    .replace(/#\{total\}/g, total)

  let html = templates.order_confirmation_body || ""
  if (html) {
    html = html
      .replace(/#\{order_number\}/g, orderNumber)
      .replace(/#\{total\}/g, total)
      .replace(/#\{customer_email\}/g, email)
      .replace(/#\{shipping_address\}/g, addressHtml)
  } else {
    // Plantilla por defecto si no hay cuerpo configurado en /admin/settings
    const items = JSON.parse(session.metadata?.items || "[]") as OrderItem[]
    const itemsHtml = items
      .map(
        (item) => `
          <tr>
            <td style="padding:8px 0;border-bottom:1px solid #eee">${item.product_name}${item.size ? " / " + item.size : ""}${item.color ? " / " + item.color : ""}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:center">${item.quantity}</td>
            <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right">${formatPrice(item.price_cents * item.quantity)}€</td>
          </tr>`
      )
      .join("")

    const itemsTotal = items.reduce((s, i) => s + i.price_cents * i.quantity, 0)

    html = `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;color:#333">
        <h1 style="color:#C4E326">¡Gracias por tu pedido!</h1>
        <p>Hemos recibido tu pedido y lo estamos procesando.</p>
        <table style="width:100%;border-collapse:collapse;margin:20px 0">
          <thead><tr style="background:#f5f5f5"><th style="padding:8px;text-align:left">Producto</th><th style="padding:8px;text-align:center">Cant.</th><th style="padding:8px;text-align:right">Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
          <tfoot><tr><td colspan="2" style="padding:12px 8px;text-align:right;font-weight:bold">Total:</td><td style="padding:12px 8px;text-align:right;font-weight:bold;font-size:18px">${formatPrice(itemsTotal)}€</td></tr></tfoot>
        </table>
        ${session.shipping_details?.address
          ? `<div style="background:#f9f9f9;padding:16px;border-radius:8px;margin:16px 0"><h3 style="margin:0 0 8px">Dirección de envío</h3><p style="margin:0">${session.shipping_details.name || ""}<br/>${session.shipping_details.address.line1 || ""}<br/>${session.shipping_details.address.line2 ? session.shipping_details.address.line2 + "<br/>" : ""}${session.shipping_details.address.postal_code || ""} ${session.shipping_details.address.city || ""}<br/>${session.shipping_details.address.country || ""}</p></div>`
          : ""
        }
        <p style="color:#888;font-size:13px">Si tienes alguna duda, contáctanos en info@sportbalin.com</p>
      </div>
    `
  }

  try {
    const resend = new Resend(apiKey)
    const { error } = await resend.emails.send({
      from: FROM,
      to: email,
      subject,
      html,
    })
    if (error) {
      console.error("[webhook] Resend error:", JSON.stringify(error))
    }
  } catch (e) {
    console.error("[webhook] Email exception:", e)
  }
}

async function processPaidOrder(supabase: ReturnType<typeof createAdminClient>, session: any) {
  const { data: order } = await supabase
    .from("orders")
    .select("id, payment_verified_at")
    .eq("stripe_session_id", session.id)
    .maybeSingle()

  if (order?.payment_verified_at) {
    console.warn(`[webhook] Order ${session.id} already processed, skipping`)
    return
  }

  const items = JSON.parse(session.metadata?.items || "[]") as OrderItem[]

  const { error: stockError } = await decrementStockWithFallback(supabase, items)
  if (stockError) {
    console.error(`[webhook] Stock decrement failed for ${session.id}:`, stockError)
    // Do not fail the webhook; stock issue must be resolved manually.
  }

  const updateData: Record<string, unknown> = {
    status: "paid",
    payment_verified_at: new Date().toISOString(),
  }
  if (session.customer_details?.email) updateData.customer_email = session.customer_details.email
  if (session.payment_intent) updateData.stripe_payment_intent = session.payment_intent
  if (session.shipping_details?.address) {
    updateData.shipping_address = {
      name: session.shipping_details.name ?? "",
      line1: session.shipping_details.address.line1 ?? "",
      line2: session.shipping_details.address.line2 ?? "",
      city: session.shipping_details.address.city ?? "",
      state: session.shipping_details.address.state ?? "",
      postal_code: session.shipping_details.address.postal_code ?? "",
      country: session.shipping_details.address.country ?? "",
    }
  }

  await supabase.from("orders").update(updateData).eq("stripe_session_id", session.id)

  const discountCode = session.metadata?.discount_code as string | undefined
  if (discountCode) {
    const { data: discount } = await supabase
      .from("discounts")
      .select("used_count")
      .eq("code", discountCode)
      .maybeSingle()
    if (discount) {
      await supabase.from("discounts").update({ used_count: (discount.used_count ?? 0) + 1 }).eq("code", discountCode)
    }
  }

  const giftCardCode = session.metadata?.gift_card_code as string | undefined
  const giftCardAmount = parseInt(session.metadata?.gift_card_amount_cents || "0", 10) || 0
  if (giftCardCode && giftCardAmount > 0) {
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("remaining_balance_cents")
      .eq("code", giftCardCode)
      .maybeSingle()
    if (giftCard) {
      const newBalance = Math.max(0, (giftCard.remaining_balance_cents ?? 0) - giftCardAmount)
      await supabase.from("gift_cards").update({ remaining_balance_cents: newBalance }).eq("code", giftCardCode)
    }
  }

  await sendOrderConfirmation(session)
}

export async function POST(request: Request) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature")!

  const stripe = getStripe()
  let event
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const supabase = createAdminClient()
  const type = (event as any).type as string

  if (type === "checkout.session.completed") {
    const session = event.data.object as any

    if (session.payment_status === "paid") {
      await processPaidOrder(supabase, session)
    } else {
      const updateData: Record<string, unknown> = { status: "pending" }
      if (session.customer_details?.email) {
        updateData.customer_email = session.customer_details.email
      }
      if (session.payment_intent) {
        updateData.stripe_payment_intent = session.payment_intent
      }
      if (session.shipping_details?.address) {
        updateData.shipping_address = {
          name: session.shipping_details.name ?? "",
          line1: session.shipping_details.address.line1 ?? "",
          line2: session.shipping_details.address.line2 ?? "",
          city: session.shipping_details.address.city ?? "",
          state: session.shipping_details.address.state ?? "",
          postal_code: session.shipping_details.address.postal_code ?? "",
          country: session.shipping_details.address.country ?? "",
        }
      }
      await supabase.from("orders").update(updateData).eq("stripe_session_id", session.id)
    }
  } else if (type === "checkout.session.async_payment_succeeded") {
    await processPaidOrder(supabase, event.data.object as any)
  } else if (type === "checkout.session.async_payment_failed") {
    await supabase.from("orders").update({ status: "cancelled" }).eq("stripe_session_id", (event.data.object as any).id)
  } else if (type === "checkout.session.expired") {
    await supabase.from("orders").update({ status: "cancelled" }).eq("stripe_session_id", (event.data.object as any).id)
  }

  return NextResponse.json({ received: true })
}
