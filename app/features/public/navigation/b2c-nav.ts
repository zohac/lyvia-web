/**
 * Navigation B2C partagée — homepage keova.fr + pages articles.
 *
 * Pourquoi : la homepage et /articles partageaient deux listes de liens
 * divergentes, cassant la continuité de navigation pour le visiteur.
 * Convention A44 (Retro DS3+DS4) : nombre d'items verrouillé par test.
 *
 * Règle d'ancrage :
 * - Sur la homepage, les ancres restent locales (`#education`).
 * - Sur une autre page (/articles/*), les ancres doivent être absolues
 *   (`/#education`) pour ramener à la homepage au bon endroit.
 */

export interface B2CNavItem {
  readonly label: string
  /** Ancre (#id) ou chemin absolu (/path). Les ancres seront préfixées sur
   *  les pages non-homepage via `resolveB2CNavLinks({ homeAnchorsAbsolute: true })`. */
  readonly href: string
}

/**
 * Source de vérité — 5 items, ordre stable.
 * Ordre pensé pour le parcours cognitif : comprendre → se reconnaître
 * → voir la solution → lire → lever les derniers doutes.
 */
export const B2C_NAV_ITEMS: readonly B2CNavItem[] = [
  { label: 'Comprendre', href: '#education' },
  { label: 'Symptômes', href: '#symptomes' },
  { label: 'Spécialistes', href: '#specialistes' },
  { label: 'Articles', href: '/articles' },
  { label: 'FAQ', href: '#faq' }
] as const

/**
 * Résout les liens selon le contexte de la page courante.
 * @param options.homeAnchorsAbsolute — true si la page courante n'est pas la
 *   homepage : les ancres `#foo` sont préfixées en `/#foo`.
 */
export function resolveB2CNavLinks(options: { homeAnchorsAbsolute: boolean }): B2CNavItem[] {
  if (!options.homeAnchorsAbsolute) {
    return [...B2C_NAV_ITEMS]
  }
  return B2C_NAV_ITEMS.map(item =>
    item.href.startsWith('#')
      ? { label: item.label, href: `/${item.href}` }
      : { label: item.label, href: item.href }
  )
}
