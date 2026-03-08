/**
 * Public SEO metadata contracts.
 *
 * Source of truth:
 * - `repositories/lyvia-api/openapi.yaml`
 * - `GET /public/seo?targetType=...&targetId=...`
 */

export type PublicSeoResponse = {
  title: string | null
  description: string | null
  ogImageUrl: string | null
  canonicalUrl: string | null
}
