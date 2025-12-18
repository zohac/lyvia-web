import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  UserRole
} from '../features/auth/api/auth.contract'
import { useAuthState } from '../features/auth/state/auth.state'
import { apiFetch } from '../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../services/api/api-error'

type LoginInput = LoginRequest

function computeExpiresAt(expiresInSeconds: number): string {
  return new Date(Date.now() + expiresInSeconds * 1000).toISOString()
}

function normalizeAuthError(err: unknown): string {
  if (err instanceof ApiFetchError) {
    return mapAuthErrorCodeToUserMessage(err.apiError.code)
  }
  return 'Une erreur est survenue. Veuillez réessayer.'
}

export function useAuth() {
  const state = useAuthState()

  const bootstrapped = useState<boolean>('auth.bootstrapped', () => false)

  const role = computed<UserRole | null>(() => state.value.user?.role ?? null)

  function resolveDashboardPath(userRole: UserRole): string {
    switch (userRole) {
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

  function setAuthenticated(user: AuthUser, response: { accessToken: string; expiresInSeconds: number }) {
    state.value.accessToken = response.accessToken
    state.value.expiresAt = computeExpiresAt(response.expiresInSeconds)
    state.value.user = user
    state.value.role = user.role
    state.value.status = 'authenticated'
    state.value.lastError = null
  }

  function setGuest() {
    state.value.accessToken = null
    state.value.expiresAt = null
    state.value.user = null
    state.value.role = null
    state.value.status = 'guest'
  }

  async function login(input: LoginInput): Promise<void> {
    state.value.lastError = null
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      withAuth: false,
      body: input
    })

    setAuthenticated(response.user, response)
    await navigateTo(response.redirect?.path || resolveDashboardPath(response.user.role))
  }

  async function refreshAccessToken(): Promise<void> {
    state.value.lastError = null

    const response = await apiFetch<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      withAuth: false,
      retryOn401: false
    })

    state.value.accessToken = response.accessToken
    state.value.expiresAt = computeExpiresAt(response.expiresInSeconds)
  }

  async function fetchMe(): Promise<void> {
    state.value.lastError = null

    const response = await apiFetch<MeResponse>('/auth/me', {
      method: 'GET',
      withAuth: true
    })

    state.value.user = response.user
    state.value.role = response.user.role
    state.value.status = 'authenticated'
  }

  async function logout(): Promise<void> {
    state.value.lastError = null

    try {
      await apiFetch<LogoutResponse>('/auth/logout', {
        method: 'POST',
        withAuth: false,
        retryOn401: false
      })
    } finally {
      setGuest()
      await navigateTo('/')
    }
  }

  async function bootstrap(): Promise<void> {
    if (bootstrapped.value) return
    bootstrapped.value = true

    try {
      await refreshAccessToken()
    } catch {
      // ignore: refresh may fail if no cookie exists
    }

    try {
      await fetchMe()
    } catch {
      setGuest()
    }
  }

  function isAuthenticated(): boolean {
    return state.value.status === 'authenticated' && Boolean(state.value.user)
  }

  function hasRole(expectedRole: UserRole): boolean {
    return state.value.user?.role === expectedRole
  }

  return {
    status: computed(() => state.value.status),
    user: computed(() => state.value.user),
    role,
    accessToken: computed(() => state.value.accessToken),
    expiresAt: computed(() => state.value.expiresAt),
    lastError: computed(() => state.value.lastError),

    bootstrap,
    login: async (input: LoginInput) => {
      try {
        await login(input)
      } catch (err: unknown) {
        state.value.lastError = normalizeAuthError(err)
        throw err
      }
    },
    refreshAccessToken: async () => {
      try {
        await refreshAccessToken()
      } catch (err: unknown) {
        state.value.lastError = normalizeAuthError(err)
        setGuest()
        throw err
      }
    },
    fetchMe: async () => {
      try {
        await fetchMe()
      } catch (err: unknown) {
        state.value.lastError = normalizeAuthError(err)
        setGuest()
        throw err
      }
    },
    logout: async () => {
      try {
        await logout()
      } catch (err: unknown) {
        state.value.lastError = normalizeAuthError(err)
        throw err
      }
    },
    isAuthenticated,
    hasRole
  }
}
