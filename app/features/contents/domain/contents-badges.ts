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

export function getTypeBadge(type: string): ContentTypeBadge {
  const map: Record<string, { color: ContentBadgeColor, label: string }> = {
    article: { color: 'primary', label: 'Article' },
    recette: { color: 'secondary', label: 'Recette' },
    actualite: { color: 'neutral', label: 'Actualité' }
  }
  return map[type] ?? { color: 'neutral', label: type }
}
