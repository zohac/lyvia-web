import { resolveDashboardPath } from '../features/auth/routing/auth-routing'
import { useAuthState } from '../features/auth/state/auth.state'
import { isAllowedSupportPath } from '../features/support-session/api/support-session.contract'

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) return

  const auth = useAuth()

  if (auth.status.value === 'unknown') {
    await auth.bootstrap()
  }

  if (!auth.isAuthenticated()) {
    return navigateTo({ path: '/login', query: { redirect: to.fullPath } })
  }

  if (!auth.hasRole('PROVIDER')) {
    const userRole = auth.role.value
    return userRole ? navigateTo(resolveDashboardPath(userRole)) : navigateTo('/')
  }

  // Support session gating on provider routes
  const authState = useAuthState()
  const supportSession = authState.value.supportSession
  if (supportSession != null && (supportSession.phase === 'active' || supportSession.phase === 'ending' || supportSession.phase === 'restoring')) {
    if (!isAllowedSupportPath(to.path)) {
      try {
        const toast = useToast()
        toast.add({
          title: 'Accès restreint en mode assistance',
          description: 'Cette page n\'est pas accessible pendant une session d\'assistance.',
          color: 'warning'
        })
      } catch {
        // Safe outside toast context
      }
      return navigateTo('/provider/coach-page')
    }
  }
})
