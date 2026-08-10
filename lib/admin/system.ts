'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SystemHealth } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getSystemHealth(): Promise<SystemHealth> {
  await checkAdmin()
  const supabase = createAdminClient()

  let supabaseConnected = false
  try {
    const { error } = await supabase.from('products').select('id').limit(1)
    supabaseConnected = !error
  } catch { /* ignore */ }

  let bucketPublic: boolean | null = null
  try {
    const { data: bucket } = await supabase.storage.getBucket('product-images')
    bucketPublic = bucket?.public ?? null
  } catch { /* ignore */ }

  const envChecks = [
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'Supabase URL', configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Supabase Anon Key', configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Supabase Service Role', configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', label: 'Clerk Publishable Key', configured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY },
    { key: 'CLERK_SECRET_KEY', label: 'Clerk Secret Key', configured: !!process.env.CLERK_SECRET_KEY },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Stripe Publishable Key', configured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
    { key: 'STRIPE_SECRET_KEY', label: 'Stripe Secret Key', configured: !!process.env.STRIPE_SECRET_KEY },
    { key: 'STRIPE_WEBHOOK_SECRET', label: 'Stripe Webhook Secret', configured: !!process.env.STRIPE_WEBHOOK_SECRET },
  ]

  return {
    node_version: process.version || '—',
    platform: process.platform || '—',
    uptime_seconds: Math.floor(process.uptime()),
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    supabase_connected: supabaseConnected,
    stripe_configured: !!process.env.STRIPE_SECRET_KEY,
    clerk_configured: !!process.env.CLERK_SECRET_KEY,
    storage_bucket_public: bucketPublic,
    env_checks: envChecks,
  }
}

export async function setupStoragePublicBucket() {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.storage.updateBucket('product-images', { public: true })
  if (error) return { error: error.message }
  return { success: true }
}

export async function runBannerPositionMigration() {
  await checkAdmin()
  const sql = `
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_x INTEGER NOT NULL DEFAULT 50;
    ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_y INTEGER NOT NULL DEFAULT 50;
  `
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
        Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY!}`,
      },
      body: JSON.stringify({ query: sql }),
    })
    if (!res.ok) {
      const text = await res.text()
      return { error: `Migration failed (${res.status}): ${text}` }
    }
    return { success: true }
  } catch (e: any) {
    return { error: e?.message || 'Migration request failed' }
  }
}
