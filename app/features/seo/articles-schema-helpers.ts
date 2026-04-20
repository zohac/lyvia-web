/**
 * Pure helpers pour Schema.org des articles /articles.
 * Convention A17/A35 : tous les constructeurs sont des fonctions pures testables.
 * Convention retro T2/4 : raw JSON-LD pour Article (pas de defineArticle fiable
 * sur tous les cas) + defineBreadcrumb natif pour la cohérence inter-composables.
 */

export interface ArticleAuthorInput {
  name: string
  role: string
  photoUrl: string
  profileUrl: string
}

export interface ArticleSourceInput {
  label: string
  url: string
}

export interface ArticleInput {
  slug: string
  title: string
  description: string
  imageUrl: string
  category: string
  publishedAt: string
  updatedAt?: string
  readingTime: number
  tags: readonly string[]
  author: ArticleAuthorInput
  /** Sources citées (E-E-A-T / YMYL). Émis en `citation[]` Schema.org. */
  sources?: readonly ArticleSourceInput[]
}

export interface BreadcrumbCrumb {
  name: string
  item?: string
}

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/+$/, '')
}

function absoluteUrl(origin: string, path: string): string {
  const o = normalizeOrigin(origin)
  if (/^https?:\/\//i.test(path)) return path
  return `${o}${path.startsWith('/') ? path : `/${path}`}`
}

/**
 * Person Schema.org auteur — utilisable dans un Article.author
 * ou injecté séparément via useSchemaOrg.
 */
export function buildAuthorPerson(origin: string, author: ArticleAuthorInput) {
  const o = normalizeOrigin(origin)
  return {
    '@type': 'Person' as const,
    '@id': `${o}${author.profileUrl.startsWith('/') ? author.profileUrl : `/${author.profileUrl}`}#person`,
    'name': author.name,
    'jobTitle': author.role,
    'url': absoluteUrl(o, author.profileUrl),
    'image': absoluteUrl(o, author.photoUrl)
  }
}

/**
 * Article Schema.org complet (raw JSON-LD).
 * Requis E-E-A-T : headline, description, image, author (Person),
 * datePublished, dateModified, publisher.
 */
/**
 * Citations Schema.org à partir des sources médicales listées dans le
 * frontmatter de l'article. Chaque source devient un `CreativeWork`
 * référencé par `Article.citation[]` — signal E-E-A-T fort pour YMYL santé.
 */
export function buildArticleCitations(sources: readonly ArticleSourceInput[]) {
  return sources.map(s => ({
    '@type': 'CreativeWork' as const,
    'name': s.label,
    'url': s.url
  }))
}

export function buildArticleSchema(origin: string, article: ArticleInput) {
  const o = normalizeOrigin(origin)
  const articleUrl = `${o}/articles/${article.slug}`
  const person = buildAuthorPerson(o, article.author)
  const citations = article.sources && article.sources.length > 0
    ? buildArticleCitations(article.sources)
    : null

  return {
    '@type': 'Article' as const,
    '@id': `${articleUrl}#article`,
    'headline': article.title,
    'description': article.description,
    'image': absoluteUrl(o, article.imageUrl),
    'datePublished': article.publishedAt,
    'dateModified': article.updatedAt ?? article.publishedAt,
    'articleSection': article.category,
    'keywords': [...article.tags].join(', '),
    'wordCount': article.readingTime * 200,
    'inLanguage': 'fr-FR',
    'isAccessibleForFree': true,
    'mainEntityOfPage': {
      '@type': 'WebPage' as const,
      '@id': articleUrl
    },
    'author': person,
    'publisher': {
      '@type': 'Organization' as const,
      '@id': `${o}/#organization`,
      'name': 'Keova',
      'url': o,
      'logo': {
        '@type': 'ImageObject' as const,
        'url': `${o}/images/keova-logo.webp`
      }
    },
    // `citation` omis quand aucune source — évite un tableau vide parasite
    ...(citations ? { citation: citations } : {})
  }
}

/**
 * BreadcrumbList : Accueil > Articles > {article}.
 * Utilisable tel quel dans defineBreadcrumb({ itemListElement: ... }).
 */
export function buildArticleBreadcrumb(
  origin: string,
  articleTitle: string,
  articleSlug: string
): BreadcrumbCrumb[] {
  const o = normalizeOrigin(origin)
  return [
    { name: 'Accueil', item: `${o}/` },
    { name: 'Articles', item: `${o}/articles` },
    { name: articleTitle, item: `${o}/articles/${articleSlug}` }
  ]
}

/**
 * BreadcrumbList page liste : Accueil > Articles.
 */
export function buildArticleIndexBreadcrumb(origin: string): BreadcrumbCrumb[] {
  const o = normalizeOrigin(origin)
  return [
    { name: 'Accueil', item: `${o}/` },
    { name: 'Articles', item: `${o}/articles` }
  ]
}

/**
 * UI helpers — catégories d'articles.
 * Déplacés hors des pages Vue car unctx peut mal parser les objets
 * complexes post-await (bug observé avec Vue SFC macro mode).
 */
export function categoryBadgeClass(category: string): string {
  if (category === 'alimentation') return 'bg-emerald-100 text-emerald-800'
  if (category === 'mouvement') return 'bg-sky-100 text-sky-800'
  if (category === 'bien-etre') return 'bg-violet-100 text-violet-800'
  return 'bg-stone-100 text-stone-800'
}

export function categoryLabelText(category: string): string {
  if (category === 'alimentation') return 'Alimentation'
  if (category === 'mouvement') return 'Mouvement'
  if (category === 'bien-etre') return 'Bien-être'
  if (category === 'symptomes') return 'Symptômes'
  return category
}

export function formatDateFr(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  }).format(new Date(iso))
}
