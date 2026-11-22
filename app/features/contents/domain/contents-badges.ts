export type ContentStatusBadge = { color: string, label: string }
export type ContentVisibilityBadge = { color: string, label: string }
export type ContentTypeBadge = { color: string, label: string }

export function getStatusBadge(isPublished: boolean): ContentStatusBadge {
  return isPublished
    ? { color: 'success', label: 'Publié' }
    : { color: 'neutral', label: 'Brouillon' }
}

export function getVisibilityBadge(visibility: string): ContentVisibilityBadge {
  return visibility === 'public'
    ? { color: 'info', label: 'Public' }
    : { color: 'warning', label: 'Privé' }
}

export function getTypeBadge(type: string): ContentTypeBadge {
  const map: Record<string, { color: string, label: string }> = {
    article: { color: 'primary', label: 'Article' },
    recette: { color: 'secondary', label: 'Recette' },
    actualite: { color: 'neutral', label: 'Actualité' }
  }
  return map[type] ?? { color: 'neutral', label: type }
}
