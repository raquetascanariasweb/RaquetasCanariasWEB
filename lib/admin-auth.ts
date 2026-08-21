import { auth } from '@clerk/nextjs/server'

export function isAdmin(userId: string | null | undefined): boolean {
  if (!userId) return false
  const raw = process.env.ADMIN_USER_IDS
    || process.env.ADMIN_USER_ID
    || ''
  return raw
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .includes(userId)
}

export async function requireAdmin(): Promise<string> {
  const { userId } = await auth()
  if (!isAdmin(userId)) throw new Error('Unauthorized')
  return userId!
}
