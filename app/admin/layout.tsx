import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'
import { getCurrencyConfig } from '@/lib/admin/currency'
import { isAdmin } from '@/lib/admin-auth'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth()

  if (!userId) {
    return redirectToSignIn()
  }

  if (!isAdmin(userId)) {
    redirect('/')
  }

  const currencyConfig = await getCurrencyConfig()

  return <AdminLayoutClient currencyConfig={currencyConfig}>{children}</AdminLayoutClient>
}
