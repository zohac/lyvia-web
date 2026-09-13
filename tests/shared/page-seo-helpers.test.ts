import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import {
  resolvePageTitle,
  resolvePageDescription,
  resolvePageOgImage,
  resolvePageCanonical,
  buildPageBreadcrumbs,
  formatPageNavLinks,
  adjustHomeAnchorLinks,
  type ContentBlock
} from '../../shared/utils/page-seo-helpers'

describe('page-seo-helpers', () => {
  describe('resolvePageTitle', () => {
    test('uses seoTitle when provided and trimmed', () => {
      const result = resolvePageTitle('Mon Parcours', 'Sophie Jouan — Mon Parcours Spécialisé', 'Sophie Jouan')
      assert.equal(result, 'Sophie Jouan — Mon Parcours Spécialisé')
    })

    test('falls back to title with brand suffix when seoTitle is null or empty', () => {
      const result = resolvePageTitle('Mon Parcours', null, 'Sophie Jouan')
      assert.equal(result, 'Mon Parcours — Sophie Jouan')

      const resultWhitespace = resolvePageTitle('Mon Parcours', '   ', 'Sophie Jouan')
      assert.equal(resultWhitespace, 'Mon Parcours — Sophie Jouan')
    })

    test('returns only title when brandName is missing or empty', () => {
      const result = resolvePageTitle('Mon Parcours', null, '')
      assert.equal(result, 'Mon Parcours')

      const resultUndefined = resolvePageTitle('Mon Parcours')
      assert.equal(resultUndefined, 'Mon Parcours')
    })
  })

  describe('resolvePageDescription', () => {
    test('uses seoDescription when provided and trimmed', () => {
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'text', data: { html: '<p>Texte du bloc</p>' } }
      ]
      const result = resolvePageDescription(blocks, 'Description SEO personnalisée.', 'Sophie Jouan', 'Mon Parcours')
      assert.equal(result, 'Description SEO personnalisée.')
    })

    test('extracts, strips HTML, and truncates text from first text block when seoDescription is absent', () => {
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'image', data: { url: 'https://example.com/img.jpg', alt: 'Photo' } },
        { id: 'b2', type: 'text', data: { html: '<p>Bienvenue sur <strong>ma page</strong> d\'accompagnement. Nous aborderons la périménopause et les solutions naturelles.</p>' } }
      ]
      const result = resolvePageDescription(blocks, null, 'Sophie Jouan', 'Mon Parcours')
      assert.equal(result, 'Bienvenue sur ma page d\'accompagnement. Nous aborderons la périménopause et les solutions naturelles.')
    })

    test('truncates text to 160 characters maximum cleanly', () => {
      const longText = 'A'.repeat(200)
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'text', data: { html: `<p>${longText}</p>` } }
      ]
      const result = resolvePageDescription(blocks, null, 'Sophie Jouan', 'Mon Parcours')
      assert.ok(result.length <= 160, `Expected length <= 160, got ${result.length}`)
      assert.ok(result.endsWith('…') || result.length <= 160)
    })

    test('falls back to generic description if no text block has content', () => {
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'image', data: { url: 'https://example.com/img.jpg', alt: 'Photo' } }
      ]
      const result = resolvePageDescription(blocks, null, 'Sophie Jouan', 'Mon Parcours')
      assert.equal(result, 'Découvrez la page Mon Parcours de Sophie Jouan.')
    })

    test('falls back gracefully when brandName or pageTitle is missing or whitespace-only', () => {
      const result = resolvePageDescription([], null, '', '')
      assert.equal(result, 'Découvrez la page dédiée de votre praticienne.')

      const resultWhitespace = resolvePageDescription([], null, '   ', '   ')
      assert.equal(resultWhitespace, 'Découvrez la page dédiée de votre praticienne.')
    })
  })

  describe('resolvePageOgImage', () => {
    test('returns first image block URL if present', () => {
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'text', data: { html: '<p>Intro</p>' } },
        { id: 'b2', type: 'image', data: { url: 'https://assets.keova.app/image1.webp', alt: 'Img 1' } },
        { id: 'b3', type: 'image', data: { url: 'https://assets.keova.app/image2.webp', alt: 'Img 2' } }
      ]
      const result = resolvePageOgImage(blocks, 'https://example.com/logo.webp')
      assert.equal(result, 'https://assets.keova.app/image1.webp')
    })

    test('falls back to brand logo when no image blocks exist', () => {
      const blocks: ContentBlock[] = [
        { id: 'b1', type: 'text', data: { html: '<p>Intro</p>' } }
      ]
      const result = resolvePageOgImage(blocks, 'https://assets.keova.app/brand-logo.webp')
      assert.equal(result, 'https://assets.keova.app/brand-logo.webp')
    })

    test('falls back to default logo when neither image block nor brand logo is present', () => {
      const result = resolvePageOgImage([])
      assert.equal(result, '/images/keova-logo-white-label.webp')
    })

    test('converts relative fallback logo to absolute URL when origin is provided', () => {
      const result = resolvePageOgImage([], null, '/images/keova-logo-white-label.webp', 'https://sophiejouan.fr')
      assert.equal(result, 'https://sophiejouan.fr/images/keova-logo-white-label.webp')
    })
  })

  describe('resolvePageCanonical', () => {
    test('on white-label domain: points to own absolute URL', () => {
      const result = resolvePageCanonical({
        hostname: 'sophiejouan.fr',
        pageSlug: 'mon-accompagnement',
        isWhiteLabel: true,
        platformDomain: 'keova.fr'
      })
      assert.equal(result, 'https://sophiejouan.fr/mon-accompagnement')
    })

    test('on platform domain with verified white-label domain: points cross-domain to practitioner domain (YC2.4)', () => {
      const result = resolvePageCanonical({
        hostname: 'keova.fr',
        pageSlug: 'mon-accompagnement',
        isWhiteLabel: false,
        verifiedDomain: 'sophiejouan.fr',
        platformDomain: 'keova.fr',
        providerSlug: 'sophie-jouan'
      })
      assert.equal(result, 'https://sophiejouan.fr/mon-accompagnement')
    })

    test('on platform domain without verified white-label domain: points to platform URL', () => {
      const result = resolvePageCanonical({
        hostname: 'keova.fr',
        pageSlug: 'mon-accompagnement',
        isWhiteLabel: false,
        verifiedDomain: null,
        platformDomain: 'keova.fr',
        providerSlug: 'claire-martin'
      })
      assert.equal(result, 'https://keova.fr/coach/claire-martin/mon-accompagnement')
    })
  })

  describe('buildPageBreadcrumbs', () => {
    test('on white-label: 2 levels [Brand, Page]', () => {
      const result = buildPageBreadcrumbs({
        pageTitle: 'Mon Accompagnement',
        pageSlug: 'mon-accompagnement',
        isWhiteLabel: true,
        origin: 'https://sophiejouan.fr',
        brandName: 'Sophie Jouan'
      })
      assert.deepEqual(result, [
        { name: 'Sophie Jouan', item: 'https://sophiejouan.fr/' },
        { name: 'Mon Accompagnement', item: 'https://sophiejouan.fr/mon-accompagnement' }
      ])
    })

    test('on platform: 4 levels [Accueil, Spécialistes, Coach, Page]', () => {
      const result = buildPageBreadcrumbs({
        pageTitle: 'Mon Accompagnement',
        pageSlug: 'mon-accompagnement',
        isWhiteLabel: false,
        origin: 'https://keova.fr',
        brandName: 'Sophie Jouan',
        providerSlug: 'sophie-jouan'
      })
      assert.deepEqual(result, [
        { name: 'Accueil', item: 'https://keova.fr/' },
        { name: 'Spécialistes', item: 'https://keova.fr/#specialistes' },
        { name: 'Sophie Jouan', item: 'https://keova.fr/coach/sophie-jouan' },
        { name: 'Mon Accompagnement', item: 'https://keova.fr/coach/sophie-jouan/mon-accompagnement' }
      ])
    })
  })

  describe('formatPageNavLinks', () => {
    test('formats page items with menuLabel override or title fallback', () => {
      const pages = [
        { slug: 'parcours', title: 'Mon parcours professionnel', menuLabel: 'Parcours' },
        { slug: 'tarifs-details', title: 'Détails des tarifs', menuLabel: null }
      ]
      const result = formatPageNavLinks(pages)
      assert.deepEqual(result, [
        { label: 'Parcours', href: '/parcours' },
        { label: 'Détails des tarifs', href: '/tarifs-details' }
      ])
    })

    test('prepends custom prefix on platform domain', () => {
      const pages = [
        { slug: 'parcours', title: 'Mon parcours professionnel', menuLabel: 'Parcours' }
      ]
      const result = formatPageNavLinks(pages, '/coach/sophie-jouan')
      assert.deepEqual(result, [
        { label: 'Parcours', href: '/coach/sophie-jouan/parcours' }
      ])
    })
  })

  describe('adjustHomeAnchorLinks', () => {
    test('returns links untouched when on home page', () => {
      const links = [
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: 'Tarifs', href: '#tarifs' },
        { label: 'À propos', href: '/a-propos' }
      ]
      const result = adjustHomeAnchorLinks(links, true)
      assert.deepEqual(result, links)
    })

    test('rewrites anchor links to /#ancre when not on home page (white-label)', () => {
      const links = [
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: 'Tarifs', href: '#tarifs' },
        { label: 'À propos', href: '/a-propos' }
      ]
      const result = adjustHomeAnchorLinks(links, false)
      assert.deepEqual(result, [
        { label: 'Accompagnement', href: '/#accompagnement' },
        { label: 'Tarifs', href: '/#tarifs' },
        { label: 'À propos', href: '/a-propos' }
      ])
    })

    test('rewrites anchor links with specified homePath on platform (/coach/:slug#ancre)', () => {
      const links = [
        { label: 'Accompagnement', href: '#accompagnement' },
        { label: 'Tarifs', href: '#tarifs' }
      ]
      const result = adjustHomeAnchorLinks(links, false, '/coach/sophie-jouan')
      assert.deepEqual(result, [
        { label: 'Accompagnement', href: '/coach/sophie-jouan#accompagnement' },
        { label: 'Tarifs', href: '/coach/sophie-jouan#tarifs' }
      ])
    })
  })
})
