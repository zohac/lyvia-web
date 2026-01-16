/**
 * Domain module for building Stripe checkout return URLs.
 *
 * This module provides pure functions for constructing return URLs
 * that respect custom domains (white-label support).
 *
 * @module consultation/domain/return-urls
 * @see Ticket RF7 - Front : returnUrls respectent le domaine (white-label)
 */

/**
 * Return URLs for Stripe checkout session.
 */
export interface CheckoutReturnUrls {
  /** URL where the user is redirected after successful payment */
  success: string
  /** URL where the user is redirected if they cancel the payment */
  cancel: string
}

/**
 * Stripe Checkout Session ID placeholder.
 *
 * Stripe replaces this placeholder with the actual session ID
 * when redirecting the user back to the success URL.
 *
 * @see https://docs.stripe.com/payments/checkout/custom-success-page
 */
export const CHECKOUT_SESSION_ID_PLACEHOLDER = '{CHECKOUT_SESSION_ID}'

/**
 * Default paths for consultation checkout return URLs.
 */
export const DEFAULT_CONSULTATION_PATHS = {
  success: `/client/consultation/success?session_id=${CHECKOUT_SESSION_ID_PLACEHOLDER}`,
  cancel: '/client/consultation/cancelled'
} as const

/**
 * Builds absolute return URLs for Stripe checkout.
 *
 * This function constructs fully-qualified URLs using the provided origin,
 * ensuring that checkout returns work correctly on custom domains (white-label).
 *
 * **Critical for RF7 compliance:**
 * - Never hardcode domain names (kaora.app, localhost, etc.)
 * - Always use the current origin from the browser
 *
 * @param origin - The origin to use for building URLs (e.g., "https://sophie-coaching.com")
 * @param paths - Optional custom paths for success and cancel URLs
 * @returns Fully-qualified return URLs for Stripe checkout
 *
 * @example
 * // Platform domain
 * buildCheckoutReturnUrls('https://kaora.app')
 * // => { success: 'https://kaora.app/client/consultation/success?session_id={CHECKOUT_SESSION_ID}', cancel: 'https://kaora.app/client/consultation/cancelled' }
 *
 * @example
 * // Custom domain (white-label)
 * buildCheckoutReturnUrls('https://sophie-coaching.com')
 * // => { success: 'https://sophie-coaching.com/client/consultation/success?session_id={CHECKOUT_SESSION_ID}', cancel: 'https://sophie-coaching.com/client/consultation/cancelled' }
 *
 * @example
 * // With custom paths
 * buildCheckoutReturnUrls('https://example.com', {
 *   success: '/booking/confirmed?session_id={CHECKOUT_SESSION_ID}',
 *   cancel: '/booking/cancelled'
 * })
 * // => { success: 'https://example.com/booking/confirmed?session_id={CHECKOUT_SESSION_ID}', cancel: 'https://example.com/booking/cancelled' }
 */
export function buildCheckoutReturnUrls(
  origin: string,
  paths: { success?: string, cancel?: string } = {}
): CheckoutReturnUrls {
  const successPath = paths.success ?? DEFAULT_CONSULTATION_PATHS.success
  const cancelPath = paths.cancel ?? DEFAULT_CONSULTATION_PATHS.cancel

  return {
    success: `${origin}${successPath}`,
    cancel: `${origin}${cancelPath}`
  }
}

/**
 * Extracts the current origin in a safe manner.
 *
 * Returns an empty string when called in a non-browser environment (SSR),
 * which is acceptable because checkout is always initiated client-side.
 *
 * @returns The current window origin or empty string if not in browser
 *
 * @example
 * // In browser on custom domain
 * getCurrentOrigin() // => 'https://sophie-coaching.com'
 *
 * // In SSR context
 * getCurrentOrigin() // => ''
 */
export function getCurrentOrigin(): string {
  if (typeof window === 'undefined') {
    return ''
  }
  return window.location.origin
}

/**
 * Validates that a URL is safe to use as a return URL.
 *
 * Rejects:
 * - Empty or falsy URLs
 * - Relative URLs (no origin)
 * - Dangerous protocols (javascript:, data:, etc.)
 * - Malformed URLs
 *
 * @param url - The URL to validate
 * @returns True if the URL is safe for redirection
 *
 * @example
 * isValidReturnUrl('https://example.com/success') // => true
 * isValidReturnUrl('http://localhost:3000/success') // => true
 * isValidReturnUrl('/success') // => false (relative, no origin)
 * isValidReturnUrl('javascript:alert(1)') // => false (dangerous protocol)
 * isValidReturnUrl('') // => false (empty)
 */
export function isValidReturnUrl(url: string): boolean {
  if (!url) return false

  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  } catch {
    return false
  }
}
