'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { SystemHealth } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
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
    { key: 'NEXT_PUBLIC_SUPABASE_URL', label: 'URL de Supabase', configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL },
    { key: 'NEXT_PUBLIC_SUPABASE_ANON_KEY', label: 'Clave anónima de Supabase', configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY },
    { key: 'SUPABASE_SERVICE_ROLE_KEY', label: 'Rol de servicio de Supabase', configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY },
    { key: 'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY', label: 'Clave pública de Clerk', configured: !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY },
    { key: 'CLERK_SECRET_KEY', label: 'Clave secreta de Clerk', configured: !!process.env.CLERK_SECRET_KEY },
    { key: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', label: 'Clave pública de Stripe', configured: !!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY },
    { key: 'STRIPE_SECRET_KEY', label: 'Clave secreta de Stripe', configured: !!process.env.STRIPE_SECRET_KEY },
    { key: 'STRIPE_WEBHOOK_SECRET', label: 'Secreto de webhook de Stripe', configured: !!process.env.STRIPE_WEBHOOK_SECRET },
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
  const supabase = createAdminClient()
  try {
    const { error } = await supabase
      .from('banners')
      .select('text_x, text_y')
      .limit(1)
    if (!error) {
      return { success: true }
    }
    if (error.code === 'PGRST204') {
      return {
        error:
          'Las columnas text_x/text_y no existen en la tabla banners. Ejecuta la migración en el editor SQL de Supabase: ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_x INTEGER NOT NULL DEFAULT 50; ALTER TABLE banners ADD COLUMN IF NOT EXISTS text_y INTEGER NOT NULL DEFAULT 50;',
      }
    }
    return { error: error.message }
  } catch (e: any) {
    return { error: e?.message || 'La verificación de la migración falló' }
  }
}
