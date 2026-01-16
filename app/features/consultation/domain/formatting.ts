/**
 * Domain module for formatting consultation-related values.
 *
 * Provides pure, centralized functions for formatting dates, times, and prices.
 * All functions use fr-FR locale and support configurable timezone.
 *
 * @module consultation/domain/formatting
 */

/**
 * Default timezone for French clients.
 */
export const DEFAULT_TIMEZONE = 'Europe/Paris'

/**
 * Formats a price in cents to a localized EUR string.
 *
 * @param amountCents - Price in cents (e.g., 8000 = 80.00€)
 * @returns Formatted price string (e.g., "80,00 €")
 *
 * @example
 * formatPrice(8000) // => "80,00 €"
 * formatPrice(12500) // => "125,00 €"
 */
export function formatPrice(amountCents: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amountCents / 100)
}

/**
 * Formats a Date to a long French date string with weekday.
 *
 * @param date - Date to format
 * @param timezone - IANA timezone (default: "Europe/Paris")
 * @returns Formatted date string (e.g., "mardi 24 décembre")
 *
 * @example
 * formatDateLong(new Date('2025-12-24T14:00:00Z')) // => "mardi 24 décembre"
 */
export function formatDateLong(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    timeZone: timezone
  }).format(date)
}

/**
 * Formats a Date to a long French date string with weekday and year.
 *
 * @param date - Date to format
 * @param timezone - IANA timezone (default: "Europe/Paris")
 * @returns Formatted date string (e.g., "mardi 24 décembre 2025")
 *
 * @example
 * formatDateLongWithYear(new Date('2025-12-24T14:00:00Z')) // => "mardi 24 décembre 2025"
 */
export function formatDateLongWithYear(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: timezone
  }).format(date)
}

/**
 * Formats a Date to a short date string.
 *
 * @param date - Date to format
 * @param timezone - IANA timezone (default: "Europe/Paris")
 * @returns Formatted date string (e.g., "24 déc.")
 *
 * @example
 * formatDateShort(new Date('2025-12-24T14:00:00Z')) // => "24 déc."
 */
export function formatDateShort(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    timeZone: timezone
  }).format(date)
}

/**
 * Formats a Date to a time string (HH:MM).
 *
 * @param date - Date to format
 * @param timezone - IANA timezone (default: "Europe/Paris")
 * @returns Formatted time string (e.g., "14:00")
 *
 * @example
 * formatTime(new Date('2025-12-24T14:00:00Z')) // => "15:00" (in Europe/Paris)
 */
export function formatTime(date: Date, timezone: string = DEFAULT_TIMEZONE): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone
  }).format(date)
}

/**
 * Formats a duration range from start time and duration.
 *
 * @param startDate - Start date/time
 * @param durationMinutes - Duration in minutes
 * @param timezone - IANA timezone (default: "Europe/Paris")
 * @returns Formatted range string (e.g., "14:00 - 15:00")
 *
 * @example
 * formatTimeRange(new Date('2025-12-24T14:00:00Z'), 60) // => "15:00 - 16:00" (in Europe/Paris)
 */
export function formatTimeRange(
  startDate: Date,
  durationMinutes: number,
  timezone: string = DEFAULT_TIMEZONE
): string {
  const endDate = new Date(startDate.getTime() + durationMinutes * 60 * 1000)
  return `${formatTime(startDate, timezone)} - ${formatTime(endDate, timezone)}`
}
