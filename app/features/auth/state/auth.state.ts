import type { AuthUser, UserRole } from '../api/auth.contract'

export type AuthStatus = 'unknown' | 'authenticated' | 'guest'

export type AuthState = {
  status: AuthStatus
  user: AuthUser | null
  role: UserRole | null
  accessToken: string | null
  expiresAt: string | null
  lastError: string | null
}

export function useAuthState() {
  return useState<AuthState>('auth.state', () => ({
    status: 'unknown',
    user: null,
    role: null,
    accessToken: null,
    expiresAt: null,
    lastError: null
  }))
}

