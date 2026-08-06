import type {
  AuthUser,
  LoginRequest,
  LoginResponse,
  LogoutResponse,
  MeResponse,
  RefreshResponse,
  UserRole
} from '../features/auth/api/auth.contract'
import { resolveDashboardPath, sanitizeInternalRedirectPath } from '../features/auth/routing/auth-routing'
import { useAuthState } from '../features/auth/state/auth.state'
import { useFeatureGate } from '../features/plans/useFeatureGate'
import { apiFetch } from '../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../services/api/api-error'

type LoginInput = LoginRequest & {
  redirectPath?: string
}

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

  /**
   * Story 18.2 (CR) — Le gate de plan est un `useState` de session.
   *
   * `logout()` fait `setGuest()` puis `navigateTo('/')` : une navigation SPA,
   * sans rechargement. Sans reset explicite, une 2ᵉ connexion dans le même
   * onglet héritait du plan du précédent utilisateur — `ensureLoaded()`
   * sortait tôt (`'ready'`) et `hasFeature()` répondait avec l'ancien plan.
   * Le backend 403 toujours, mais l'UI ouvrait des sections premium à une
   * coach Essentiel. Cas courant en démo et en support.
   *
   * Capturé ICI et pas dans `setGuest()` : le gate touche `useState` /
   * `useNuxtApp`, indisponibles depuis le gestionnaire d'événement d'où part
   * `logout()`. `invalidate()` ne referme aucun contexte — il est sûr à
   * appeler plus tard.
   */
  const featureGate = useFeatureGate()

  const bootstrapped = useState<boolean>('auth.bootstrapped', () => false)
  type NuxtAppWithAuthBootstrap = ReturnType<typeof useNuxtApp> & {
    __lyvia_auth_bootstrap__?: Promise<void> | null
  }

  const role = computed<UserRole | null>(() => state.value.user?.role ?? null)

  function setAuthenticated(user: AuthUser, response: { accessToken: string, expiresInSeconds: number }) {
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
    // La session se termine : le plan mis en cache ne vaut plus rien. Purge le
    // créneau de déduplication ET incrémente la génération, de sorte qu'un
    // `GET /provider/account` encore en vol ne réinstalle pas le plan sortant.
    featureGate.invalidate()
  }

  async function login(input: LoginInput): Promise<void> {
    state.value.lastError = null
    const redirectPath = sanitizeInternalRedirectPath(input.redirectPath)
    const response = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      withAuth: false, // No Bearer header, but cookies are always sent (credentials: 'include')
      body: {
        email: input.email,
        password: input.password
      }
    })

    setAuthenticated(response.user, response)
    await navigateTo(
      response.redirect?.path || redirectPath || resolveDashboardPath(response.user.role)
    )
  }

  async function refreshAccessToken(): Promise<void> {
    state.value.lastError = null

    const response = await apiFetch<RefreshResponse>('/auth/refresh', {
      method: 'POST',
      withAuth: false, // No Bearer header, but cookies are always sent (credentials: 'include')
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
    if (import.meta.server) return

    const nuxtApp = useNuxtApp() as NuxtAppWithAuthBootstrap
    const existing = nuxtApp.__lyvia_auth_bootstrap__
    if (existing) return existing

    const promise = (async () => {
      try {
        await refreshAccessToken()
      } catch {
        // ignore: refresh may fail if no cookie exists
      }

      try {
        await fetchMe()
      } catch {
        setGuest()
      } finally {
        bootstrapped.value = true
        nuxtApp.__lyvia_auth_bootstrap__ = null
      }
    })()

    nuxtApp.__lyvia_auth_bootstrap__ = promise
    return promise
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
