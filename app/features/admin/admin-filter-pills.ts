/**
 * Pastilles de filtre de l'admin.
 *
 * `border` est posé sur **les deux** états, transparent quand la pastille est
 * active : sans lui, l'état actif mesurait 2 px de moins que l'état inactif et
 * la rangée sautait au clic. `transition-colors` remplace `transition-all` :
 * seules les couleurs changent, et une transition sur `all` anime aussi la
 * géométrie au moindre ajout de propriété.
 */
export const FILTER_PILL_BASE = 'rounded-full border text-sm font-medium transition-colors duration-150'

export const FILTER_PILL_ACTIVE = `${FILTER_PILL_BASE} border-transparent bg-[color:var(--color-crepuscule-800)] text-[color:var(--color-surface-elevated)] shadow-sm`

export const FILTER_PILL_INACTIVE = `${FILTER_PILL_BASE} border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-crepuscule-400)] hover:text-[color:var(--color-brand-primary)]`

export function filterPillClasses(isActive: boolean, size: 'sm' | 'md' = 'md'): string {
  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
  const base = isActive ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
  return `${base} ${padding}`
}
