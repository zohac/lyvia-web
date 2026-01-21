/**
 * useCurrentUser composable.
 *
 * Provides convenient computed properties for the current authenticated user.
 * Centralizes display name logic that was previously duplicated across components.
 */
export function useCurrentUser() {
  const auth = useAuth()

  /**
   * The authenticated user object (null if not authenticated)
   */
  const user = computed(() => auth.user.value)

  /**
   * User email (empty string if not authenticated)
   */
  const email = computed(() => user.value?.email ?? '')

  /**
   * User role (null if not authenticated)
   */
  const role = computed(() => user.value?.role ?? null)

  /**
   * First name from profile (null if not available)
   */
  const firstname = computed(() => user.value?.firstname ?? null)

  /**
   * Last name from profile (null if not available)
   */
  const lastname = computed(() => user.value?.lastname ?? null)

  /**
   * Display name with fallback logic:
   * 1. Use API displayName if available (e.g., "Marie D.")
   * 2. Fallback to firstname if available
   * 3. Fallback to email local part (before @)
   * 4. Fallback to 'Utilisateur'
   */
  const displayName = computed(() => {
    if (user.value?.displayName) {
      return user.value.displayName
    }
    if (user.value?.firstname) {
      return user.value.firstname
    }
    if (user.value?.email) {
      const local = user.value.email.split('@')[0] ?? ''
      if (local.length > 0) {
        // Capitalize first letter
        return local.charAt(0).toUpperCase() + local.slice(1)
      }
    }
    return 'Utilisateur'
  })

  /**
   * User initials (2 letters) for avatar display:
   * 1. Use first letters of firstname + lastname if both available
   * 2. Fallback to first 2 letters of firstname
   * 3. Fallback to first 2 letters of email
   * 4. Fallback to 'U'
   */
  const initials = computed(() => {
    if (user.value?.firstname && user.value?.lastname) {
      return (
        user.value.firstname.charAt(0).toUpperCase()
        + user.value.lastname.charAt(0).toUpperCase()
      )
    }
    if (user.value?.firstname) {
      return user.value.firstname.slice(0, 2).toUpperCase()
    }
    if (user.value?.email) {
      return user.value.email.slice(0, 2).toUpperCase()
    }
    return 'U'
  })

  /**
   * Whether the user is authenticated
   */
  const isAuthenticated = computed(() => auth.status.value === 'authenticated')

  /**
   * Whether the user is a client
   */
  const isClient = computed(() => user.value?.role === 'CLIENT')

  /**
   * Whether the user is a provider
   */
  const isProvider = computed(() => user.value?.role === 'PROVIDER')

  /**
   * Whether the user is an admin
   */
  const isAdmin = computed(() => user.value?.role === 'ADMIN')

  return {
    user,
    email,
    role,
    firstname,
    lastname,
    displayName,
    initials,
    isAuthenticated,
    isClient,
    isProvider,
    isAdmin
  }
}
