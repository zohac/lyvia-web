export const FILTER_PILL_BASE = 'rounded-full text-sm font-medium transition-all'

export const FILTER_PILL_ACTIVE = `${FILTER_PILL_BASE} bg-[color:var(--color-crepuscule-800)] text-[color:var(--color-surface-elevated)] shadow-sm`

export const FILTER_PILL_INACTIVE = `${FILTER_PILL_BASE} border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-crepuscule-400)] hover:text-[color:var(--color-brand-primary)]`

export function filterPillClasses(isActive: boolean, size: 'sm' | 'md' = 'md'): string {
  const padding = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2'
  const base = isActive ? FILTER_PILL_ACTIVE : FILTER_PILL_INACTIVE
  return `${base} ${padding}`
}
