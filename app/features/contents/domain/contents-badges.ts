/**
 * Badge colours are the Nuxt UI v4 `UBadge` colour names. Typing them here keeps
 * a typo a compile error instead of a silent fallback, and lets the pages pass
 * the value without an `as any`.
 */
export type ContentBadgeColor = 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'

export type ContentStatusBadge = { color: ContentBadgeColor, label: string }
export type ContentTypeBadge = { color: ContentBadgeColor, label: string }

export function getStatusBadge(isPublished: boolean): ContentStatusBadge {
  return isPublished
    ? { color: 'success', label: 'Publié' }
    : { color: 'neutral', label: 'Brouillon' }
}

export type ContentDiffusionBadge = { color: ContentBadgeColor, label: string }

export function getDiffusionBadge(audience: string): ContentDiffusionBadge {
  return audience === 'all'
    ? { color: 'info', label: 'Toutes mes clientes' }
    : { color: 'warning', label: 'Clientes choisies' }
}

/**
 * Encre du badge (diffusion-15, AC6).
 *
 * `UBadge variant="soft"` peint son texte avec la **rampe** de la couleur
 * (`text-{color}-500`) : mesuré à l'écran sur la liste praticienne, « Clientes
 * choisies » sortait à **2,53:1** et « Publié » à 4,03:1 — sous AA alors que ces
 * pastilles portent une information. Le thème du badge (`keova-badge.ts`) est
 * hors périmètre (exemption du 2026-11-24) : l'encre est donc reposée par
 * instance, sur les pas déjà présents dans `shared.css` (700/800), tous ≥ 4,5:1
 * sur les fonds 50 et 100 de leur propre famille.
 */
export function getBadgeInkClass(color: ContentBadgeColor): string {
  const inks: Record<ContentBadgeColor, string> = {
    primary: 'text-[color:var(--color-crepuscule-700)]',
    secondary: 'text-[color:var(--color-sunset-800)]',
    success: 'text-[color:var(--color-success-700)]',
    info: 'text-[color:var(--color-crepuscule-700)]',
    warning: 'text-[color:var(--color-sunset-800)]',
    error: 'text-[color:var(--color-error-700)]',
    neutral: 'text-[color:var(--color-neutral-700)]'
  }
  return inks[color]
}

export function getTypeBadge(type: string): ContentTypeBadge {
  const map: Record<string, { color: ContentBadgeColor, label: string }> = {
    article: { color: 'primary', label: 'Article' },
    recette: { color: 'secondary', label: 'Recette' },
    actualite: { color: 'neutral', label: 'Actualité' }
  }
  return map[type] ?? { color: 'neutral', label: type }
}
