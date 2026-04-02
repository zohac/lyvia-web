/**
 * Composable for admin badge styling functions
 * Uses DS semantic tokens — zero Tailwind legacy colors
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
 * Get CSS classes for a badge color — DS tokens only
 */
export function getBadgeClasses(color: BadgeColor | string): string {
  const colorMap: Record<string, string> = {
    success: 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]',
    error: 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]',
    info: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-700)]',
    primary: 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-800)]',
    secondary: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]',
    warning: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]',
    neutral: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
  }
  return colorMap[color] ?? 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
}

/**
 * Get badge classes for notification status (sent/failed/skipped)
 */
export function getNotificationStatusBadgeClasses(status: string): string {
  switch (status) {
    case 'sent': return 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
    case 'failed': return 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]'
    case 'skipped': return 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
    default: return 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
  }
}

/**
 * Get badge classes for notification type (email/sms)
 */
export function getNotificationTypeBadgeClasses(type: string): string {
  switch (type) {
    case 'email': return 'bg-[color:var(--color-crepuscule-100)] text-[color:var(--color-crepuscule-700)]'
    case 'sms': return 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]'
    default: return 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]'
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
 * Base classes for status badges with dot indicator
 */
export const STATUS_BADGE_BASE = 'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium'
export const STATUS_DOT_BASE = 'h-1.5 w-1.5 rounded-full'

export type StatusBadgeVariant = 'success' | 'error' | 'warning' | 'neutral'

const STATUS_BADGE_VARIANTS: Record<StatusBadgeVariant, { badge: string, dot: string }> = {
  success: { badge: 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]', dot: 'bg-[color:var(--color-success-500)]' },
  error: { badge: 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]', dot: 'bg-[color:var(--color-error-500)]' },
  warning: { badge: 'bg-[color:var(--color-sunset-100)] text-[color:var(--color-sunset-700)]', dot: 'bg-[color:var(--color-sunset-500)]' },
  neutral: { badge: 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]', dot: 'bg-[color:var(--color-neutral-400)]' }
}

export function getStatusBadgeClasses(variant: StatusBadgeVariant): { badge: string, dot: string } {
  const v = STATUS_BADGE_VARIANTS[variant]
  return { badge: `${STATUS_BADGE_BASE} ${v.badge}`, dot: `${STATUS_DOT_BASE} ${v.dot}` }
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
    getNotificationStatusLabel,
    getStatusBadgeClasses
  }
}
