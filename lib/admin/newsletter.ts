'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import type { NewsletterSubscriber } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.NEXT_PUBLIC_ADMIN_USER_ID || process.env.ADMIN_USER_ID
  if (!userId || userId !== adminId) throw new Error('Unauthorized')
}

export async function getSubscribers(): Promise<NewsletterSubscriber[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('newsletter_subscribers').select('*').order('subscribed_at', { ascending: false })
  return (data ?? []) as NewsletterSubscriber[]
}

export async function bulkDeleteSubscribers(ids: string[]) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('newsletter_subscribers').delete().in('id', ids)
  if (error) return { error: error.message }
  revalidatePath('/admin/newsletter')
  return { success: true }
}

export async function deleteSubscriber(id: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/newsletter')
  return { success: true }
}

export async function createSubscriber(email: string) {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('newsletter_subscribers').insert({
    email: email.trim().toLowerCase(),
    source: 'admin',
  })
  if (error) {
    if (error.code === '23505') return { error: 'Subscriber already exists' }
    return { error: error.message }
  }
  revalidatePath('/admin/newsletter')
  return { success: true }
}

export async function updateSubscriberStatus(id: string, status: 'active' | 'unsubscribed') {
  await checkAdmin()
  const supabase = createAdminClient()
  const update: Record<string, any> = { status }
  if (status === 'unsubscribed') update.unsubscribed_at = new Date().toISOString()
  else update.unsubscribed_at = null
  const { error } = await supabase.from('newsletter_subscribers').update(update).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/newsletter')
  return { success: true }
}
