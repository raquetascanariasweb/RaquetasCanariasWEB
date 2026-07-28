'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const CURRENCY_LOCALE_MAP: Record<string, string> = {
  USD: 'en-US',
  EUR: 'es-ES',
  GBP: 'en-GB',
}

export async function getCurrencyConfig(): Promise<{ code: string; locale: string }> {
  const supabase = createAdminClient()
  const { data } = await supabase.from('settings').select('value').eq('key', 'general').single()
  const value = data?.value ?? {}
  const code = value.store_currency || 'EUR'
  return { code, locale: CURRENCY_LOCALE_MAP[code] || 'es-ES' }
}
