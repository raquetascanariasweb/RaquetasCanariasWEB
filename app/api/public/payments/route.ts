import { createAdminClient } from "@/lib/supabase/admin"

export const dynamic = "force-dynamic"

export async function GET() {
  const supabase = createAdminClient()
  const { data } = await supabase
    .from("settings")
    .select("value")
    .eq("key", "payments")
    .single()

  const value = (data?.value ?? {}) as Record<string, unknown>

  // Stripe se configura por variable de entorno (igual que el checkout).
  // Se mantiene fallback a los ajustes guardados en BD por compatibilidad.
  const stripeSecretEnv = process.env.STRIPE_SECRET_KEY
  const stripeSecretDb = typeof value.stripe_secret_key === "string" ? value.stripe_secret_key : ""
  const stripePublishableEnv = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  const stripePublishableDb = typeof value.stripe_publishable_key === "string" ? value.stripe_publishable_key : ""

  return Response.json({
    bizum_enabled: value.bizum_enabled === true,
    bizum_phone: typeof value.bizum_phone === "string" ? value.bizum_phone : "",
    stripe_enabled: !!(stripeSecretEnv || stripeSecretDb) && !!(stripePublishableEnv || stripePublishableDb),
    paypal_enabled: !!(process.env.PAYPAL_CLIENT_ID || (typeof value.paypal_client_id === "string" && value.paypal_client_id.length > 0)),
  })
}
