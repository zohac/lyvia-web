import type { AuthUser } from '../../auth/api/auth.contract'

export type SupportSessionSummary = {
  id: string
  providerProfileId: string
  providerUserId: string
}

export type StartSupportSessionResponse = {
  accessToken: string
  expiresAt: string
  supportSession: SupportSessionSummary
  user: AuthUser
}

export type SupportSessionPhase = 'active' | 'ending' | 'restoring'

export type SupportSessionState = {
  id: string
  providerProfileId: string
  providerUserId: string
  expiresAt: string
  returnTo: string
  phase: SupportSessionPhase
}

export type SupportNavigationItem = {
  label: string
  to: string
  icon: string
  match: 'exact' | 'prefix'
}

export const SUPPORT_NAVIGATION_ITEMS: readonly SupportNavigationItem[] = [
  {
    label: 'Mon compte',
    to: '/provider/account',
    icon: 'lucide:user',
    match: 'exact'
  },
  {
    label: 'Ma page coach',
    to: '/provider/coach-page',
    icon: 'lucide:layout',
    match: 'exact'
  },
  {
    label: 'Créneaux & Tarifs',
    to: '/provider/scheduling',
    icon: 'lucide:clock',
    match: 'exact'
  },
  {
    label: 'Disponibilités',
    to: '/provider/availability',
    icon: 'lucide:calendar-clock',
    match: 'exact'
  },
  {
    label: 'Programmes',
    to: '/provider/programs',
    icon: 'lucide:package',
    match: 'prefix'
  },
  {
    label: 'SEO',
    to: '/provider/seo',
    icon: 'lucide:globe',
    match: 'exact'
  }
] as const

function cleanPathname(rawPath: string): string {
  const withoutQuery = (rawPath.split('?')[0] ?? '').split('#')[0] ?? ''
  if (withoutQuery.length > 1 && withoutQuery.endsWith('/')) {
    return withoutQuery.slice(0, -1)
  }
  return withoutQuery
}

export function isAllowedSupportPath(path: string): boolean {
  const clean = cleanPathname(path)

  for (const item of SUPPORT_NAVIGATION_ITEMS) {
    if (item.match === 'exact' && clean === item.to) {
      return true
    }
    if (item.match === 'prefix') {
      if (clean === item.to || clean.startsWith(`${item.to}/`)) {
        return true
      }
    }
  }

  return false
}

export function resolveSupportNavigationItem(path: string): SupportNavigationItem | null {
  const clean = cleanPathname(path)
  for (const item of SUPPORT_NAVIGATION_ITEMS) {
    if (item.match === 'exact' && clean === item.to) {
      return item
    }
    if (item.match === 'prefix') {
      if (clean === item.to || clean.startsWith(`${item.to}/`)) {
        return item
      }
    }
  }
  return null
}

export function buildSupportReturnTo(providerProfileId: string): string {
  const trimmed = providerProfileId?.trim()
  if (!trimmed) {
    throw new Error('Invalid providerProfileId: cannot be empty')
  }
  return `/admin/providers/${trimmed}`
}

export function calculateSupportRemainingSeconds(
  expiresAt: string,
  nowMs: number = Date.now()
): number {
  const expiryTime = new Date(expiresAt).getTime()
  if (Number.isNaN(expiryTime)) {
    return 0
  }
  const diffMs = expiryTime - nowMs
  if (diffMs <= 0) {
    return 0
  }
  return Math.floor(diffMs / 1000)
}

export function formatSupportRemainingTime(remainingSeconds: number): string {
  const clamped = Math.max(0, Math.floor(remainingSeconds))
  const minutes = Math.floor(clamped / 60)
  const seconds = clamped % 60
  const pad = (n: number) => n.toString().padStart(2, '0')
  return `${pad(minutes)}:${pad(seconds)}`
}

export function validateStartSupportSessionResponse(
  data: unknown,
  expectedProviderProfileId: string
): StartSupportSessionResponse {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid start support session response: expected an object')
  }

  const res = data as Partial<StartSupportSessionResponse>

  if (!res.accessToken || typeof res.accessToken !== 'string') {
    throw new Error('Invalid accessToken in start support session response')
  }

  if (!res.expiresAt || typeof res.expiresAt !== 'string') {
    throw new Error('Invalid expiresAt in start support session response')
  }

  const expiryMs = new Date(res.expiresAt).getTime()
  if (Number.isNaN(expiryMs)) {
    throw new Error('Invalid expiresAt date format in start support session response')
  }

  if (!res.supportSession || typeof res.supportSession !== 'object') {
    throw new Error('Invalid supportSession in start support session response')
  }

  const session = res.supportSession as Partial<SupportSessionSummary>
  if (!session.id || typeof session.id !== 'string') {
    throw new Error('Invalid supportSession.id')
  }

  if (!session.providerProfileId || session.providerProfileId !== expectedProviderProfileId) {
    throw new Error('Invalid supportSession.providerProfileId: providerProfileId mismatch')
  }

  if (!session.providerUserId || typeof session.providerUserId !== 'string') {
    throw new Error('Invalid supportSession.providerUserId')
  }

  if (!res.user || typeof res.user !== 'object') {
    throw new Error('Invalid user in start support session response')
  }

  if (res.user.role !== 'PROVIDER') {
    throw new Error('Invalid user role: expected PROVIDER')
  }

  if (res.user.id !== session.providerUserId) {
    throw new Error('Invalid user.id: providerUserId mismatch')
  }

  return res as StartSupportSessionResponse
}
