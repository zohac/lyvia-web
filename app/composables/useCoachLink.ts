/**
 * useCoachLink — Résolution centralisée des URLs d'une page coach.
 *
 * Composable PUR (AD-Y5) : pas de `useState`, pas de `useFetch`, pas de runtime
 * Nuxt. C'est une fonction déterministe qui prend `{ slug, domain?, origin? }`
 * et retourne `{ site, booking }`.
 *
 * Comportement :
 *   - `domain` présent et non vide → URLs **absolues** `https://{domain}` et
 *     `https://{domain}/onboarding/discovery` (white-label custom domain).
 *   - `domain` absent ET `origin` fourni → URLs absolues
 *     `{origin}/coach/{slug}` et `{origin}/coach/{slug}/onboarding/discovery`
 *     (utile pour Schema.org / sitemap).
 *   - `domain` absent ET `origin` absent → URLs **relatives**
 *     `/coach/{slug}` et `/coach/{slug}/onboarding/discovery` (route Nuxt
 *     plateforme).
 *
 * Convention P-Y6 : c'est le SEUL endroit du code qui construit des chemins
 * `/coach/{slug}`. Tout autre composant / helper doit passer par ce composable.
 * La seule exception tolérée est `pages/coach/**` (routes Nuxt, qui sont la
 * cible des liens, pas leur source).
 */

export interface CoachLinkTarget {
  /** URL du site / profil coach (custom domain si fourni, sinon route plateforme). */
  site: string
  /** URL de la page de réservation du discovery (white-label ou plateforme). */
  booking: string
}

export interface CoachLinkInput {
  slug: string
  /** Custom domain white-label (ex: "sophie-jouan.fr"). Optionnel. */
  domain?: string | null
  /**
   * Optionnel. Si fourni ET qu'aucun `domain` n'est présent, les URLs
   * deviennent absolues (utile pour Schema.org, breadcrumbs SEO, sitemap).
   * Ne doit PAS contenir de slash final.
   */
  origin?: string | null
}

function stripTrailingSlash(value: string): string {
  return value.endsWith('/') ? value.slice(0, -1) : value
}

export function useCoachLink(input: CoachLinkInput): CoachLinkTarget {
  const domain = input.domain?.trim()
  if (domain) {
    const base = `https://${domain}`
    return {
      site: base,
      booking: `${base}/onboarding/discovery`
    }
  }

  const slugPath = `/coach/${input.slug}`
  const origin = input.origin?.trim()
  if (origin) {
    const cleanOrigin = stripTrailingSlash(origin)
    return {
      site: `${cleanOrigin}${slugPath}`,
      booking: `${cleanOrigin}${slugPath}/onboarding/discovery`
    }
  }

  return {
    site: slugPath,
    booking: `${slugPath}/onboarding/discovery`
  }
}
