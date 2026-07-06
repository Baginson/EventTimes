import type { User } from 'firebase/auth'

export function isAdminUser(user: User | null) {
  const adminEmail = import.meta.env.VITE_ADMIN_EMAIL
  return Boolean(adminEmail && user?.email === adminEmail)
}
