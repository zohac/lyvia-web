import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import * as Vue from 'vue'
import test, { describe } from 'node:test'

import type { PublicProviderProfile } from '../../app/features/seo/api/public-provider-profile.contract'

import {
  buildSignatureHeroHeadline,
  buildSignatureHeroSubtitleLine,
  SIGNATURE_HERO_FALLBACK_HEADLINE
} from '../../app/features/coach/domain/signature-hero'
import { renderSfc } from '../helpers/render-sfc'
import {
  createCoachProfile,
  createConsultationPlans,
  createPrograms,
  createTenant,
  ONE_CREDENTIAL
} from './fixtures/coach-page-render-fixture'

/**
 * Hotfix 25 — la ville ne participe plus à la hero du template `signature`.
 *
 * La preuve est un **rendu réel** du composant (`tests/helpers/render-sfc.ts`) :
 * une assertion de source resterait verte si `city` revenait dans le template,
 * et ne dirait rien du texte produit. Chaque test porte `city: 'Valognes'` en
 * entrée et vérifie que la sortie ne le contient pas — c'est la mutation AC-5.
 */

const CITY = 'Valognes'
const REGION = 'Cotentin'
const HERO_PATH = 'app/components/organisms/CoachHeroProfile.vue'
const SIGNATURE_PATH = 'app/components/templates/coach-pages/CoachPageSignature.vue'
const FOOTER_PATH = 'app/components/organisms/PublicFooter.vue'

// ---------------------------------------------------------------------------
// Composants Nuxt auto-importés (absents du runtime de test)
// ---------------------------------------------------------------------------

const stubs = {
  NuxtImg: Vue.defineComponent({ name: 'NuxtImg', setup: () => () => Vue.h('img') }),
  NuxtLink: Vue.defineComponent({
    name: 'NuxtLink',
    setup: (_props, { slots }) => () => Vue.h('a', {}, slots.default ? slots.default() : [])
  }),
  UIcon: Vue.defineComponent({ name: 'UIcon', setup: () => () => Vue.h('i') }),
  UButton: Vue.defineComponent({
    name: 'UButton',
    setup: (_props, { slots }) => () => Vue.h('button', {}, slots.default ? slots.default() : [])
  }),
  ULink: Vue.defineComponent({
    name: 'ULink',
    setup: (_props, { slots }) => () => Vue.h('a', {}, slots.default ? slots.default() : [])
  }),
  UAccordion: Vue.defineComponent({
    name: 'UAccordion',
    setup: (_props, { slots }) => () => Vue.h('div', {}, slots.default ? slots.default() : [])
  }),
  UModal: Vue.defineComponent({
    name: 'UModal',
    setup: (_props, { slots }) => () => Vue.h('div', {}, slots.default ? slots.default() : [])
  }),
  AtomsCoachFitSection: Vue.defineComponent({
    name: 'AtomsCoachFitSection',
    setup: () => () => Vue.h('div', { 'data-stub': 'AtomsCoachFitSection' })
  }),
  AtomsMedicalDisclaimer: Vue.defineComponent({
    name: 'AtomsMedicalDisclaimer',
    setup: () => () => Vue.h('div', { 'data-stub': 'AtomsMedicalDisclaimer' })
  })
}

const WHITE_LABEL_HEADER_STATE = {
  variant: 'white-label',
  layoutStyle: 'bar',
  brandLabel: 'Sophie Jouan',
  brandTo: '/',
  showBrandIcon: false,
  navLinks: [],
  loginLabel: 'Mon espace',
  loginTo: '/login',
  ctaLabel: 'Réserver',
  ctaTo: '/rdv'
} as const

/**
 * Le state de header vit dans un module chargé hors du SFC : les `globals` du
 * harnais ne l'atteignent pas, il faut donc le remplacer.
 */
const headerStateMock = {
  usePublicHeaderState: () => Vue.ref({ ...WHITE_LABEL_HEADER_STATE }),
  setPublicHeader: () => undefined
}

/** Décomposables qui reposent sur des auto-imports Nuxt non chargés ici. */
const signatureMocks: Record<string, unknown> = {
  '~/features/public/state/public-header.state': headerStateMock,
  '~/composables/useScrollReveal': {
    useScrollReveal: () => ({ reveal: () => ({}), isReady: Vue.ref(false) })
  },
  '~/composables/useExitIntent': { useExitIntent: () => undefined }
}

function simpleMarker(name: string): Vue.Component {
  return Vue.defineComponent({
    name,
    setup: () => () => Vue.h('div', { 'data-stub': name })
  })
}

// Les organisms du template Signature ne sont pas l'objet du test : ils sont
// remplacés par des marqueurs, SAUF `CoachHeroProfile` (rendu pour de vrai via
// les tests dédiés ci-dessous).
for (const child of [
  'CoachTransformationBenefits',
  'CoachFreeText',
  'CoachHowItWorks',
  'CoachPillars',
  'CoachPricing',
  'CoachTestimonials',
  'CoachEducationalContent',
  'CoachLeadCapture'
]) {
  signatureMocks[`~/components/organisms/${child}.vue`] = simpleMarker(child)
}
for (const child of ['CoachInlineCta', 'CoachAnnouncementBar']) {
  signatureMocks[`~/components/atoms/${child}.vue`] = simpleMarker(child)
}
for (const child of ['StickyCtaMobile', 'CoachCertificationsRail', 'CoachFeaturedCredential']) {
  signatureMocks[`~/components/molecules/${child}.vue`] = simpleMarker(child)
}

// ---------------------------------------------------------------------------
// Helpers de rendu
// ---------------------------------------------------------------------------

const nuxtGlobals = {
  ...Vue,
  useState: (_key?: string, init?: () => unknown) => Vue.ref(init ? init() : null)
}

async function renderHero(overrides: Record<string, unknown> = {}): Promise<string> {
  return renderSfc(HERO_PATH, {
    props: {
      displayName: 'Sophie Jouan',
      heroHeadline: null,
      credentials: [],
      city: CITY,
      discoveryDurationMinutes: 15,
      ctaTo: '/rdv',
      ...overrides
    },
    mocks: { '~/features/public/state/public-header.state': headerStateMock },
    stubs,
    globals: nuxtGlobals
  })
}

async function renderSignature(profileOverrides: Partial<PublicProviderProfile> = {}): Promise<string> {
  return renderSfc(SIGNATURE_PATH, {
    props: {
      tenant: createTenant(),
      ctaTo: '/rdv',
      coachProfile: createCoachProfile({
        templateCode: 'signature',
        sectionsConfig: { bio: true, certifications: true },
        city: CITY,
        region: REGION,
        heroHeadline: null,
        ...profileOverrides
      }),
      publicPrograms: createPrograms(),
      consultationPlans: createConsultationPlans(),
      isAuthenticated: false,
      currentPath: '/',
      previewMode: false
    },
    mocks: signatureMocks,
    stubs,
    globals: nuxtGlobals
  })
}

function h1Of(html: string): string {
  const match = /<h1[^>]*>([\s\S]*?)<\/h1>/.exec(html)
  if (!match) throw new Error(`aucun <h1> dans le rendu : ${html.slice(0, 400)}`)
  return (match[1] ?? '').replace(/\s+/g, ' ').trim()
}

// ---------------------------------------------------------------------------
// AC-1 / AC-2 — dérivation pure (entrées → sorties)
// ---------------------------------------------------------------------------

describe('hotfix-25 — dérivation de la hero Signature (helpers purs)', () => {
  test('AC-1 : sans accroche, le H1 est le repli générique, sans ville', () => {
    assert.equal(buildSignatureHeroHeadline(null), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.equal(buildSignatureHeroHeadline(undefined), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.equal(buildSignatureHeroHeadline(''), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.ok(!SIGNATURE_HERO_FALLBACK_HEADLINE.includes(CITY))
  })

  test('AC-1 : une accroche blanche compte comme vide (le H1 n’est jamais vide)', () => {
    assert.equal(buildSignatureHeroHeadline('   '), SIGNATURE_HERO_FALLBACK_HEADLINE)
  })

  test('AC-2 : une accroche renseignée est rendue telle quelle', () => {
    assert.equal(
      buildSignatureHeroHeadline('Retrouver votre équilibre hormonal'),
      'Retrouver votre équilibre hormonal'
    )
  })

  test('AC-1/AC-2 : la ligne de sous-titre ne contient que le titre de certification', () => {
    assert.equal(buildSignatureHeroSubtitleLine(ONE_CREDENTIAL), ONE_CREDENTIAL[0]?.title)
    assert.equal(buildSignatureHeroSubtitleLine([]), null)
    assert.equal(buildSignatureHeroSubtitleLine(null), null)
    assert.equal(buildSignatureHeroSubtitleLine(undefined), null)
  })

  test('la certification mise en avant n’est pas répétée par la ligne (plaque déjà rendue)', () => {
    assert.equal(
      buildSignatureHeroSubtitleLine([{ title: 'DU Naturopathie', featured: true }]),
      null
    )
    // La mise en avant est seconde : un `credentials[0]` ne passerait pas ici.
    assert.equal(
      buildSignatureHeroSubtitleLine([
        { title: 'Certification Ménopulse' },
        { title: 'DU Naturopathie', featured: true }
      ]),
      null
    )
  })
})

// ---------------------------------------------------------------------------
// AC-1 / AC-2 / AC-5 — rendu réel du hero
// ---------------------------------------------------------------------------

describe('hotfix-25 — rendu du hero Signature sans ville', () => {
  test('AC-1 : accroche vide + city=Valognes → H1 sans « à Valognes »', async () => {
    const html = await renderHero({ heroHeadline: null, city: CITY })

    assert.equal(h1Of(html), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.ok(!html.includes(CITY), `la ville ne doit apparaître nulle part dans la hero :\n${html}`)
    assert.ok(!html.includes('à Valognes'))
  })

  test('AC-1 : sous-titre sans ville quand une certification existe', async () => {
    const html = await renderHero({ heroHeadline: null, city: CITY, credentials: ONE_CREDENTIAL })

    assert.equal(h1Of(html), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.ok(
      html.includes(ONE_CREDENTIAL[0]?.title ?? ''),
      'le titre de certification doit rester rendu'
    )
    assert.ok(!html.includes(CITY), 'la ville ne doit pas apparaître dans la ligne de sous-titre')
  })

  test('AC-2 : accroche renseignée → H1 exact, sous-titre = certification, jamais la ville', async () => {
    const headline = 'Retrouver votre équilibre hormonal'
    const html = await renderHero({ heroHeadline: headline, city: CITY, credentials: ONE_CREDENTIAL })

    assert.equal(h1Of(html), headline)
    assert.ok(html.includes(ONE_CREDENTIAL[0]?.title ?? ''))
    assert.ok(!html.includes(CITY), 'la ville ne doit apparaître nulle part dans la hero')
  })

  test('AC-5 : la ville passée au hero ne produit aucun rendu (preuve de mutation)', async () => {
    for (const credentials of [[], ONE_CREDENTIAL, [{ title: 'DU Naturopathie', featured: true }]]) {
      const html = await renderHero({ heroHeadline: null, city: CITY, credentials })
      assert.ok(
        !html.includes(CITY),
        `city réintroduite dans le hero (credentials=${JSON.stringify(credentials)}) :\n${html}`
      )
    }
  })
})

// ---------------------------------------------------------------------------
// AC-3 — la ville reste où elle doit rester (badge bio + footer)
// ---------------------------------------------------------------------------

describe('hotfix-25 — la ville reste dans le badge bio et le footer (AC-3)', () => {
  test('le badge bio de Signature rend toujours « Valognes · Cotentin »', async () => {
    const html = await renderSignature()

    assert.ok(
      html.includes(`${CITY} · ${REGION}`),
      `le badge bio doit conserver la localisation :\n${html.slice(0, 2000)}`
    )

    // Racine de composition : le hero est monté par le vrai template, il doit
    // y produire le même texte qu'en isolation (aucune ville).
    const heroBlock = /<section[^>]*id="essence"[\s\S]*?<\/section>/.exec(html)?.[0] ?? ''
    assert.ok(heroBlock.length > 0, 'la hero doit être présente dans le template Signature')
    assert.equal(h1Of(html), SIGNATURE_HERO_FALLBACK_HEADLINE)
    assert.ok(
      !heroBlock.includes(CITY),
      `la hero rendue par CoachPageSignature ne doit pas publier la ville :\n${heroBlock}`
    )
  })

  test('le footer public rend toujours « Valognes · Cotentin »', async () => {
    const html = await renderSfc(FOOTER_PATH, {
      props: {},
      // `LegalFooterLinks` charge ref/useRoute/useNuxtData : hors périmètre ici.
      mocks: {
        '../atoms/LegalFooterLinks.vue': simpleMarker('LegalFooterLinks'),
        '../../features/public/state/public-header.state': headerStateMock
      },
      stubs,
      globals: {
        ...Vue,
        useRoute: () => ({ params: { slug: 'sophie-jouan' } }),
        useNuxtData: (key: string) => ({
          data: Vue.ref(
            key.startsWith('public-provider-profile')
              ? { city: CITY, region: REGION, displayName: 'Sophie Jouan' }
              : { brand: { displayName: 'Sophie Jouan' } }
          )
        })
      }
    })

    assert.ok(
      html.includes(`${CITY} · ${REGION}`),
      `le footer doit conserver la localisation :\n${html}`
    )
  })

  test('la portée reste la hero Signature : un seul template monte CoachHeroProfile', () => {
    assert.equal(
      templatesMountingSignatureHero(),
      1,
      'un second template qui monterait CoachHeroProfile élargirait la portée du hotfix'
    )
  })
})

/**
 * Garde de périmètre : `CoachHeroProfile` ne doit rester monté que par
 * `CoachPageSignature`. Si un autre template l'adopte, la règle « pas de ville
 * dans la hero » s'y appliquera aussi — c'est une décision produit, pas un
 * effet de bord acceptable.
 */
function templatesMountingSignatureHero(): number {
  const root = path.resolve(process.cwd(), 'app/components/templates/coach-pages')
  const files = walkVueFiles(root)

  return files.filter(file => /<CoachHeroProfile\b/.test(fs.readFileSync(file, 'utf-8'))).length
}

function walkVueFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) return walkVueFiles(full)
    return entry.isFile() && entry.name.endsWith('.vue') ? [full] : []
  })
}
