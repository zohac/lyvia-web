import { useCurrentUser } from '../features/auth/useCurrentUser'

/**
 * Composable for dashboard greeting logic.
 *
 * Provides contextual greeting (Bonjour/Bonsoir based on time),
 * display name, and formatted date.
 *
 * @example
 * const { greeting, displayName, formattedDate } = useDashboardGreeting()
 */
export function useDashboardGreeting() {
  const currentUser = useCurrentUser()

  /**
   * Contextual greeting based on time of day
   * - 5h-12h: Bonjour
   * - 12h-18h: Bon après-midi
   * - 18h-5h: Bonsoir
   */
  const greeting = computed(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 12) return 'Bonjour'
    if (hour >= 12 && hour < 18) return 'Bon après-midi'
    return 'Bonsoir'
  })

  /**
   * User display name from auth state
   */
  const displayName = computed(() => currentUser.displayName.value)

  /**
   * Today's date formatted in French (e.g., "dimanche 25 janvier")
   */
  const formattedDate = computed(() => {
    return new Intl.DateTimeFormat('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }).format(new Date())
  })

  /**
   * Full greeting with name (e.g., "Bonjour, Sophie")
   */
  const fullGreeting = computed(() => {
    return `${greeting.value}, ${displayName.value}`
  })

  return {
    greeting,
    displayName,
    formattedDate,
    fullGreeting
  }
}
