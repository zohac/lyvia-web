import { resolveDashboardPath } from '../features/auth/routing/auth-routing'

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
})

