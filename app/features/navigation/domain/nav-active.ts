/**
 * Active-state resolution for the dashboard navigation (Story diffusion-8).
 *
 * A bare `prefix` rule lights up both a section and the nested entry that lives
 * under it: `/provider/content/keova` starts with `/provider/content`, so
 * "Contenus" **and** "Articles Keova" were both rendered active, each with
 * `aria-current="page"`. Only the most specific matching prefix wins.
 *
 * Kept free of Vue/Nuxt so the rule is executed by the unit tests instead of
 * being read from the shell's source.
 */

export type NavMatchMode = 'exact' | 'prefix'

export interface NavMatchItem {
  to: string
  match?: NavMatchMode
  label?: string
}

export function isNavItemActive(
  path: string,
  item: NavMatchItem,
  allItems: readonly NavMatchItem[]
): boolean {
  if (path === item.to) return true
  if (item.match !== 'prefix' || !path.startsWith(item.to)) return false

  return !allItems.some(
    other =>
      other !== item
      && other.match === 'prefix'
      && other.to.length > item.to.length
      && (path === other.to || path.startsWith(other.to))
  )
}
