import type { UserRole } from '../api/auth.contract'

export function resolveDashboardPath(role: UserRole): string {
  switch (role) {
    case 'CLIENT':
      return '/client/dashboard'
    case 'PROVIDER':
      return '/provider/dashboard'
    case 'ADMIN':
      return '/admin/dashboard'
    default:
      return '/'
  }
}

export function sanitizeInternalRedirectPath(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const path = value.trim()
  if (!path.startsWith('/')) return null
  if (path.startsWith('//')) return null
  return path
}

