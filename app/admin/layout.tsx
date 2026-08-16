import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import AdminLayoutClient from './AdminLayoutClient'
import { getCurrencyConfig } from '@/lib/admin/currency'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { userId, redirectToSignIn } = await auth()

  const adminUserId =
    process.env.NEXT_PUBLIC_ADMIN_USER_ID

  if (!userId) {
    return redirectToSignIn()
  }

  if (userId !== adminUserId) {
    redirect('/')
  }

  const currencyConfig = await getCurrencyConfig()

  return <AdminLayoutClient currencyConfig={currencyConfig}>{children}</AdminLayoutClient>
}
