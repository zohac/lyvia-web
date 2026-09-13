import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import {
  resolvePageCanonical,
  buildPageBreadcrumbs,
  formatPageNavLinks,
  adjustHomeAnchorLinks
} from '../../shared/utils/page-seo-helpers'

const REPO_ROOT = process.cwd()

describe('Dynamic Page SEO & Navigation Integration', () => {
  test('Page templates declare required SEO, canonical, Schema.org and navigation structures', () => {
    const wlPageSrc = readFileSync(join(REPO_ROOT, 'app', 'pages', '[...slug].vue'), 'utf8')
    const platformPageSrc = readFileSync(join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', '[pageSlug].vue'), 'utf8')
    const indexSrc = readFileSync(join(REPO_ROOT, 'app', 'pages', 'index.vue'), 'utf8')
    const coachIndexSrc = readFileSync(join(REPO_ROOT, 'app', 'pages', 'coach', '[slug]', 'index.vue'), 'utf8')

    // [...slug].vue checks
    assert.ok(wlPageSrc.includes('useSeoMeta'), '[...slug].vue must use useSeoMeta')
    assert.ok(wlPageSrc.includes('usePublicCanonicalHead'), '[...slug].vue must set canonical head')
    assert.ok(wlPageSrc.includes('useSchemaOrg'), '[...slug].vue must call useSchemaOrg')
    assert.ok(wlPageSrc.includes('defineWebPage'), '[...slug].vue must declare WebPage schema')
    assert.ok(wlPageSrc.includes('defineBreadcrumb'), '[...slug].vue must declare Breadcrumb schema')
    assert.ok(wlPageSrc.includes('usePublicPagesMenu'), '[...slug].vue must fetch menu pages')
    assert.ok(wlPageSrc.includes('adjustHomeAnchorLinks'), '[...slug].vue must adjust home anchor links')
    assert.ok(wlPageSrc.includes('formatPageNavLinks'), '[...slug].vue must format dynamic nav links')

    // coach/[slug]/[pageSlug].vue checks
    assert.ok(platformPageSrc.includes('useSeoMeta'), 'platform page must use useSeoMeta')
    assert.ok(platformPageSrc.includes('usePublicCanonicalHead'), 'platform page must set canonical head')
    assert.ok(platformPageSrc.includes('useSchemaOrg'), 'platform page must call useSchemaOrg')
    assert.ok(platformPageSrc.includes('defineWebPage'), 'platform page must declare WebPage schema')
    assert.ok(platformPageSrc.includes('defineBreadcrumb'), 'platform page must declare Breadcrumb schema')
    assert.ok(platformPageSrc.includes('usePublicPagesMenu'), 'platform page must fetch menu pages')
    assert.ok(platformPageSrc.includes('adjustHomeAnchorLinks'), 'platform page must adjust home anchor links')
    assert.ok(platformPageSrc.includes('formatPageNavLinks'), 'platform page must format dynamic nav links')

    // index.vue checks
    assert.ok(indexSrc.includes('usePublicPagesMenu'), 'index.vue must integrate usePublicPagesMenu')
    assert.ok(indexSrc.includes('formatPageNavLinks'), 'index.vue must format dynamic nav links for white-label')

    // coach/[slug]/index.vue checks
    assert.ok(coachIndexSrc.includes('usePublicPagesMenu'), 'coach index must integrate usePublicPagesMenu')
    assert.ok(coachIndexSrc.includes('formatPageNavLinks'), 'coach index must format dynamic nav links for coach header')
  })

  test('YC2.4 & Convention 1 Cross-Domain Canonical resolution for dynamic pages', () => {
    // When coach has custom domain, platform page points cross-domain to verified custom domain
    const crossDomainCanonical = resolvePageCanonical({
      hostname: 'keova.fr',
      pageSlug: 'mon-approche',
      isWhiteLabel: false,
      verifiedDomain: 'sophiejouan.fr',
      platformDomain: 'keova.fr',
      providerSlug: 'sophie-jouan'
    })
    assert.equal(crossDomainCanonical, 'https://sophiejouan.fr/mon-approche')

    // When coach has NO custom domain, platform page stays on platform
    const platformCanonical = resolvePageCanonical({
      hostname: 'keova.fr',
      pageSlug: 'mon-approche',
      isWhiteLabel: false,
      verifiedDomain: null,
      platformDomain: 'keova.fr',
      providerSlug: 'sophie-jouan'
    })
    assert.equal(platformCanonical, 'https://keova.fr/coach/sophie-jouan/mon-approche')

    // On white-label domain, canonical stays on host
    const wlCanonical = resolvePageCanonical({
      hostname: 'sophiejouan.fr',
      pageSlug: 'mon-approche',
      isWhiteLabel: true,
      platformDomain: 'keova.fr'
    })
    assert.equal(wlCanonical, 'https://sophiejouan.fr/mon-approche')
  })

  test('Breadcrumb hierarchy conforms to Schema.org (2 levels on WL, 4 levels on platform)', () => {
    const wlBreadcrumbs = buildPageBreadcrumbs({
      pageTitle: 'Mon Approche',
      pageSlug: 'mon-approche',
      isWhiteLabel: true,
      origin: 'https://sophiejouan.fr',
      brandName: 'Sophie Jouan'
    })
    assert.equal(wlBreadcrumbs.length, 2)
    assert.deepEqual(wlBreadcrumbs[0], { name: 'Sophie Jouan', item: 'https://sophiejouan.fr/' })
    assert.deepEqual(wlBreadcrumbs[1], { name: 'Mon Approche', item: 'https://sophiejouan.fr/mon-approche' })

    const platformBreadcrumbs = buildPageBreadcrumbs({
      pageTitle: 'Mon Approche',
      pageSlug: 'mon-approche',
      isWhiteLabel: false,
      origin: 'https://keova.fr',
      brandName: 'Sophie Jouan',
      providerSlug: 'sophie-jouan'
    })
    assert.equal(platformBreadcrumbs.length, 4)
    assert.deepEqual(platformBreadcrumbs[0], { name: 'Accueil', item: 'https://keova.fr/' })
    assert.deepEqual(platformBreadcrumbs[1], { name: 'Spécialistes', item: 'https://keova.fr/#specialistes' })
    assert.deepEqual(platformBreadcrumbs[2], { name: 'Sophie Jouan', item: 'https://keova.fr/coach/sophie-jouan' })
    assert.deepEqual(platformBreadcrumbs[3], { name: 'Mon Approche', item: 'https://keova.fr/coach/sophie-jouan/mon-approche' })
  })

  test('Navigation links formatting and home anchor adjustments', () => {
    const pages = [
      { slug: 'approche', title: 'Mon Approche', menuLabel: 'Approche' },
      { slug: 'faq-perso', title: 'Questions Fréquentes', menuLabel: null }
    ]

    const wlLinks = formatPageNavLinks(pages)
    assert.deepEqual(wlLinks, [
      { label: 'Approche', href: '/approche' },
      { label: 'Questions Fréquentes', href: '/faq-perso' }
    ])

    const platformLinks = formatPageNavLinks(pages, '/coach/sophie')
    assert.deepEqual(platformLinks, [
      { label: 'Approche', href: '/coach/sophie/approche' },
      { label: 'Questions Fréquentes', href: '/coach/sophie/faq-perso' }
    ])

    const baseAnchors = [
      { label: 'Accompagnement', href: '#accompagnement' },
      { label: 'Tarifs', href: '#tarifs' }
    ]

    // On dynamic subpage (not home page), anchor links are prefixed
    const adjustedWl = adjustHomeAnchorLinks(baseAnchors, false, '/')
    assert.deepEqual(adjustedWl, [
      { label: 'Accompagnement', href: '/#accompagnement' },
      { label: 'Tarifs', href: '/#tarifs' }
    ])

    const adjustedPlatform = adjustHomeAnchorLinks(baseAnchors, false, '/coach/sophie')
    assert.deepEqual(adjustedPlatform, [
      { label: 'Accompagnement', href: '/coach/sophie#accompagnement' },
      { label: 'Tarifs', href: '/coach/sophie#tarifs' }
    ])
  })
})
