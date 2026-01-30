const ALLOWED_STRIPE_HOSTNAMES = new Set([
  'checkout.stripe.com',
  'connect.stripe.com'
])

export function isValidStripeUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'https:' && ALLOWED_STRIPE_HOSTNAMES.has(parsed.hostname)
  } catch {
    return false
  }
}
