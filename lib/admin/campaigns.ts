'use server'

import { auth } from '@clerk/nextjs/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { revalidatePath } from 'next/cache'
import { sendCampaignEmail, isResendConfigured } from '@/lib/email'
import type { EmailCampaign, CampaignStatus } from './types'

async function checkAdmin() {
  const { userId } = await auth()
  const adminId = process.env.ADMIN_USER_ID || 'user_3G8ZXADowWQkNZdX65U1djf8JYZ'
  if (!userId || (adminId && userId !== adminId)) throw new Error('Unauthorized')
}

export async function getCampaigns(): Promise<EmailCampaign[]> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('email_campaigns').select('*').order('created_at', { ascending: false })
  return (data ?? []) as EmailCampaign[]
}

export async function getCampaign(id: string): Promise<EmailCampaign | null> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data } = await supabase.from('email_campaigns').select('*').eq('id', id).single()
  return data as EmailCampaign | null
}

export async function createCampaign(data: { subject: string; html_content: string; plain_text?: string }): Promise<{ error?: string; id?: string }> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: inserted, error } = await supabase.from('email_campaigns').insert({
    subject: data.subject,
    html_content: data.html_content,
    plain_text: data.plain_text || '',
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/campaigns')
  return { id: inserted.id }
}

export async function updateCampaign(id: string, data: { subject?: string; html_content?: string; plain_text?: string }): Promise<{ error?: string }> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('email_campaigns').update({
    ...data,
    updated_at: new Date().toISOString(),
  }).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/campaigns')
  return {}
}

export async function deleteCampaign(id: string): Promise<{ error?: string }> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { error } = await supabase.from('email_campaigns').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/campaigns')
  return {}
}

export async function sendCampaign(campaignId: string): Promise<{ error?: string }> {
  await checkAdmin()

  if (!isResendConfigured()) return { error: 'RESEND_API_KEY is not configured' }

  const supabase = createAdminClient()

  const { data: campaign } = await supabase.from('email_campaigns').select('*').eq('id', campaignId).single()
  if (!campaign) return { error: 'Campaign not found' }
  if (campaign.status !== 'draft') return { error: 'Campaign already sent' }

  const { data: subscribers } = await supabase.from('newsletter_subscribers').select('id, email').eq('status', 'active')
  if (!subscribers || subscribers.length === 0) return { error: 'No active subscribers' }

  await supabase.from('email_campaigns').update({ status: 'sending', updated_at: new Date().toISOString() }).eq('id', campaignId)

  let sent = 0
  let failed = 0
  const BATCH_SIZE = 50

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE)
    try {
      await sendCampaignEmail({
        subject: campaign.subject,
        html: campaign.html_content,
        plainText: campaign.plain_text || undefined,
        fromName: campaign.sender_name,
        fromEmail: campaign.sender_email,
        to: batch.map((sub) => ({ email: sub.email, subscriberId: sub.id })),
      })

      const logs = batch.map((sub) => ({
        campaign_id: campaignId,
        subscriber_id: sub.id,
        email: sub.email,
        status: 'sent' as const,
      }))
      const { error: logError } = await supabase.from('email_logs').insert(logs)
      if (logError) console.error('Failed to log sent emails:', logError)
      sent += batch.length
    } catch (e: any) {
      const failedLogs = batch.map((sub) => ({
        campaign_id: campaignId,
        subscriber_id: sub.id,
        email: sub.email,
        status: 'failed' as const,
        error: e.message,
      }))
      const { error: logError } = await supabase.from('email_logs').insert(failedLogs)
      if (logError) console.error('Failed to log failed emails:', logError)
      failed += batch.length
    }
  }

  const finalStatus: CampaignStatus = failed > 0 && sent === 0 ? 'failed' : 'sent'
  await supabase.from('email_campaigns').update({
    status: finalStatus,
    total_recipients: subscribers.length,
    sent_count: sent,
    failed_count: failed,
    sent_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  }).eq('id', campaignId)

  revalidatePath('/admin/campaigns')
  return {}
}

export async function duplicateCampaign(id: string): Promise<{ error?: string; id?: string }> {
  await checkAdmin()
  const supabase = createAdminClient()
  const { data: original } = await supabase.from('email_campaigns').select('*').eq('id', id).single()
  if (!original) return { error: 'Campaign not found' }
  const { data: inserted, error } = await supabase.from('email_campaigns').insert({
    subject: original.subject + ' (copy)',
    html_content: original.html_content,
    plain_text: original.plain_text,
    sender_name: original.sender_name,
    sender_email: original.sender_email,
  }).select('id').single()
  if (error) return { error: error.message }
  revalidatePath('/admin/campaigns')
  return { id: inserted.id }
}
