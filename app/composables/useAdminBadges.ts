/**
 * Composable for admin badge styling functions
 * Used by dashboard, logs, and notification-logs pages
 */

export type BadgeColor = 'success' | 'error' | 'info' | 'primary' | 'secondary' | 'warning' | 'neutral'

/**
 * Get badge color based on business event type prefix
 */
export function getEventBadgeColor(eventType: string): BadgeColor {
  if (eventType.startsWith('PAYMENT_')) return eventType.includes('FAILED') ? 'error' : 'success'
  if (eventType.startsWith('APPOINTMENT_')) return 'info'
  if (eventType.startsWith('CLIENT_')) return 'primary'
  if (eventType.startsWith('PROVIDER_')) return 'secondary'
  if (eventType.startsWith('STRIPE_')) return 'warning'
  if (eventType.startsWith('AUTH_') || eventType.includes('PASSWORD') || eventType.includes('EMAIL_CHANGE')) return 'neutral'
  return 'neutral'
}

/**
 * Get CSS classes for a badge color
 */
export function getBadgeClasses(color: BadgeColor | string): string {
  const colorMap: Record<string, string> = {
    success: 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]',
    error: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700',
    primary: 'bg-[color:var(--ui-color-primary-100)] text-[color:var(--color-brand-solid)]',
    secondary: 'bg-purple-100 text-purple-700',
    warning: 'bg-amber-100 text-amber-700',
    neutral: 'bg-gray-100 text-gray-600'
  }
  return colorMap[color] ?? 'bg-gray-100 text-gray-600'
}

/**
 * Get badge classes for notification status (sent/failed/skipped)
 */
export function getNotificationStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'sent': return 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
    case 'failed': return 'bg-red-100 text-red-700'
    case 'skipped': return 'bg-gray-100 text-gray-600'
    default: return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Get badge classes for notification type (email/sms)
 */
export function getNotificationTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'email': return 'bg-blue-100 text-blue-700'
    case 'sms': return 'bg-purple-100 text-purple-700'
    default: return 'bg-gray-100 text-gray-600'
  }
}

/**
 * Get translated label for notification status
 */
export function getNotificationStatusLabel(status: string): string {
  switch (status) {
    case 'sent': return 'Envoyé'
    case 'failed': return 'Échoué'
    case 'skipped': return 'Ignoré'
    default: return status
  }
}

/**
 * Composable that returns all badge helper functions
 */
export function useAdminBadges() {
  return {
    getEventBadgeColor,
    getBadgeClasses,
    getNotificationStatusBadgeClasses,
    getNotificationTypeBadgeClasses,
    getNotificationStatusLabel
  }
}
