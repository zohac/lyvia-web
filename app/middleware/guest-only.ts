import { resolveDashboardPath } from '../features/auth/routing/auth-routing'

export default defineNuxtRouteMiddleware(async () => {
  if (import.meta.server) return

  const auth = useAuth()

  if (auth.status.value === 'unknown') {
    await auth.bootstrap()
  }

  if (!auth.isAuthenticated()) return

  const userRole = auth.role.value
  if (!userRole) {
    return navigateTo('/')
  }

  return navigateTo(resolveDashboardPath(userRole))
})
