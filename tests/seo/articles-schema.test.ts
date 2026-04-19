import * as assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  buildArticleSchema,
  buildAuthorPerson,
  buildArticleBreadcrumb,
  buildArticleIndexBreadcrumb,
  buildArticleCitations
} from '../../app/features/seo/articles-schema-helpers'

const ORIGIN = 'https://keova.fr'

const BASE_AUTHOR = {
  name: 'Sophie Jouan',
  role: 'Spécialiste accompagnement ménopause',
  photoUrl: '/sophie_jouan.jpeg',
  profileUrl: '/coach/sophie-jouan'
}

const BASE_ARTICLE = {
  slug: 'bouffees-de-chaleur-menopause',
  title: 'Bouffées de chaleur : comprendre et agir au quotidien',
  description: 'Pourquoi surviennent-elles, combien de temps durent-elles ?',
  imageUrl: '/images/articles/bouffees-de-chaleur.webp',
  category: 'symptomes',
  publishedAt: '2026-04-17',
  updatedAt: '2026-04-17',
  readingTime: 7,
  tags: ['bouffées de chaleur', 'ménopause'],
  author: BASE_AUTHOR
}

// --- buildAuthorPerson ---

describe('buildAuthorPerson', () => {
  it('builds a Person with absolute URL and image', () => {
    const person = buildAuthorPerson(ORIGIN, BASE_AUTHOR)
    assert.equal(person['@type'], 'Person')
    assert.equal(person.name, 'Sophie Jouan')
    assert.equal(person.jobTitle, 'Spécialiste accompagnement ménopause')
    assert.equal(person.url, 'https://keova.fr/coach/sophie-jouan')
    assert.equal(person.image, 'https://keova.fr/sophie_jouan.jpeg')
    assert.equal(person['@id'], 'https://keova.fr/coach/sophie-jouan#person')
  })

  it('trims trailing slash on origin', () => {
    const person = buildAuthorPerson('https://keova.fr/', BASE_AUTHOR)
    assert.equal(person.url, 'https://keova.fr/coach/sophie-jouan')
  })

  it('preserves absolute profile URL', () => {
    const person = buildAuthorPerson(ORIGIN, {
      ...BASE_AUTHOR,
      photoUrl: 'https://cdn.example.com/photo.jpg'
    })
    assert.equal(person.image, 'https://cdn.example.com/photo.jpg')
  })
})

// --- buildArticleSchema ---

describe('buildArticleSchema', () => {
  it('produces an Article with required E-E-A-T fields', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    assert.equal(article['@type'], 'Article')
    assert.equal(article.headline, BASE_ARTICLE.title)
    assert.equal(article.description, BASE_ARTICLE.description)
    assert.equal(article.image, 'https://keova.fr/images/articles/bouffees-de-chaleur.webp')
    assert.equal(article.datePublished, '2026-04-17')
    assert.equal(article.dateModified, '2026-04-17')
    assert.equal(article.inLanguage, 'fr-FR')
    assert.equal(article.isAccessibleForFree, true)
    assert.equal(article.articleSection, 'symptomes')
  })

  it('embeds Person as author', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    assert.equal(article.author['@type'], 'Person')
    assert.equal(article.author.name, 'Sophie Jouan')
  })

  it('uses publishedAt as dateModified when updatedAt is missing', () => {
    const article = buildArticleSchema(ORIGIN, { ...BASE_ARTICLE, updatedAt: undefined })
    assert.equal(article.dateModified, BASE_ARTICLE.publishedAt)
  })

  it('builds mainEntityOfPage pointing to article URL', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    const expectedUrl = `${ORIGIN}/articles/${BASE_ARTICLE.slug}`
    assert.equal(article.mainEntityOfPage['@id'], expectedUrl)
    assert.equal(article['@id'], `${expectedUrl}#article`)
  })

  it('publisher is Keova Organization with logo', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    assert.equal(article.publisher['@type'], 'Organization')
    assert.equal(article.publisher.name, 'Keova')
    assert.equal(article.publisher.logo.url, 'https://keova.fr/keova-logo.webp')
  })

  it('keywords joined from tags', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    assert.equal(article.keywords, 'bouffées de chaleur, ménopause')
  })

  it('omits citation when no sources provided', () => {
    const article = buildArticleSchema(ORIGIN, BASE_ARTICLE)
    assert.equal('citation' in article, false)
  })

  it('omits citation when sources is an empty array', () => {
    const article = buildArticleSchema(ORIGIN, { ...BASE_ARTICLE, sources: [] })
    assert.equal('citation' in article, false)
  })

  it('emits citation[] when sources are provided', () => {
    const sources = [
      { label: 'Inserm — Dossier Ménopause (2024)', url: 'https://www.inserm.fr/dossier/menopause/' },
      { label: 'The Lancet — Menopause Series (2024)', url: 'https://www.thelancet.com/series-do/menopause' }
    ]
    const article = buildArticleSchema(ORIGIN, { ...BASE_ARTICLE, sources })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const citations = (article as any).citation as Array<{ '@type': string, 'name': string, 'url': string }>
    assert.equal(citations.length, 2)
    assert.equal(citations[0]!['@type'], 'CreativeWork')
    assert.equal(citations[0]!.name, 'Inserm — Dossier Ménopause (2024)')
    assert.equal(citations[0]!.url, 'https://www.inserm.fr/dossier/menopause/')
    assert.equal(citations[1]!.name, 'The Lancet — Menopause Series (2024)')
  })
})

// --- buildArticleCitations ---

describe('buildArticleCitations', () => {
  it('maps each source to a CreativeWork with name + url', () => {
    const citations = buildArticleCitations([
      { label: 'HAS — Ménopause (2014)', url: 'https://has-sante.fr/jcms/c_1754061' }
    ])
    assert.equal(citations.length, 1)
    assert.deepStrictEqual(citations[0], {
      '@type': 'CreativeWork',
      'name': 'HAS — Ménopause (2014)',
      'url': 'https://has-sante.fr/jcms/c_1754061'
    })
  })

  it('preserves order of sources', () => {
    const citations = buildArticleCitations([
      { label: 'A', url: 'https://a.fr' },
      { label: 'B', url: 'https://b.fr' },
      { label: 'C', url: 'https://c.fr' }
    ])
    assert.equal(citations.map(c => c.name).join(','), 'A,B,C')
  })
})

// --- buildArticleBreadcrumb ---

describe('buildArticleBreadcrumb', () => {
  it('returns Accueil > Articles > Titre with absolute URLs', () => {
    const crumbs = buildArticleBreadcrumb(ORIGIN, 'Bouffées de chaleur', 'bouffees-de-chaleur')
    assert.equal(crumbs.length, 3)
    assert.deepStrictEqual(crumbs[0], { name: 'Accueil', item: 'https://keova.fr/' })
    assert.deepStrictEqual(crumbs[1], { name: 'Articles', item: 'https://keova.fr/articles' })
    assert.deepStrictEqual(crumbs[2], {
      name: 'Bouffées de chaleur',
      item: 'https://keova.fr/articles/bouffees-de-chaleur'
    })
  })
})

describe('buildArticleIndexBreadcrumb', () => {
  it('returns 2-level breadcrumb for index page', () => {
    const crumbs = buildArticleIndexBreadcrumb(ORIGIN)
    assert.equal(crumbs.length, 2)
    assert.equal(crumbs[0].name, 'Accueil')
    assert.equal(crumbs[1].name, 'Articles')
    assert.equal(crumbs[1].item, 'https://keova.fr/articles')
  })
})
