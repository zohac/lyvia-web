import * as assert from 'node:assert/strict'
import * as Vue from 'vue'
import test, { describe } from 'node:test'

import { renderSfc } from '../helpers/render-sfc'
import {
  createCoachProfile,
  createConsultationPlans,
  createPrograms,
  createTenant,
  TWO_CREDENTIALS
} from './fixtures/coach-page-render-fixture'

const TEMPLATES = [
  { name: 'CoachPageSignature.vue', path: 'app/components/templates/coach-pages/CoachPageSignature.vue' },
  { name: 'CoachPageEssentiel.vue', path: 'app/components/templates/coach-pages/CoachPageEssentiel.vue' },
  { name: 'CoachPageVisuel.vue', path: 'app/components/templates/coach-pages/CoachPageVisuel.vue' },
  { name: 'CoachPageAlba.vue', path: 'app/components/templates/coach-pages/CoachPageAlba.vue' }
] as const

// ---------------------------------------------------------------------------
// Markers (mocks that echo their props)
// ---------------------------------------------------------------------------

const RailMarker = Vue.defineComponent({
  name: 'CoachCertificationsRailMarker',
  props: { credentials: { type: Array, default: () => [] } },
  setup: props => () =>
    Vue.h('div', { 'data-rail': '', 'data-rail-count': String((props.credentials as unknown[]).length) })
})

const PlaqueMarker = Vue.defineComponent({
  name: 'CoachFeaturedCredentialMarker',
  props: { credential: { type: Object, default: null } },
  setup: props => () =>
    Vue.h('div', { 'data-featured': '', 'data-featured-title': (props.credential as { title?: string } | null)?.title ?? '' })
})

function simpleMarker(name: string): Vue.Component {
  return Vue.defineComponent({
    name,
    setup: () => () => Vue.h('div', { 'data-stub': name })
  })
}

const simpleChildren = [
  'CoachHeroProfile',
  'CoachTransformationBenefits',
  'CoachFreeText',
  'CoachHowItWorks',
  'CoachPillars',
  'CoachPricing',
  'CoachTestimonials',
  'CoachEducationalContent',
  'CoachInlineCta',
  'CoachLeadCapture',
  'CoachAnnouncementBar',
  'StickyCtaMobile',
  'CoachEssentielHeader',
  'CoachEssentielHero',
  'CoachVisuelHeader',
  'CoachVisuelHero',
  'CoachVisuelProblem',
  'CoachVisuelPillars',
  'CoachVisuelSteps',
  'CoachVisuelMidCta',
  'CoachAlbaHeader',
  'CoachAlbaHero'
]

const mocks: Record<string, unknown> = {}
for (const child of simpleChildren) {
  mocks[`~/components/organisms/${child}.vue`] = simpleMarker(child)
  mocks[`~/components/molecules/${child}.vue`] = simpleMarker(child)
  mocks[`~/components/templates/coach-pages/essentiel/${child}.vue`] = simpleMarker(child)
  mocks[`~/components/templates/coach-pages/visuel/${child}.vue`] = simpleMarker(child)
  mocks[`~/components/templates/coach-pages/alba/${child}.vue`] = simpleMarker(child)
  mocks[`~/components/atoms/${child}.vue`] = simpleMarker(child)
}
// Rail and plaque are special.
mocks['~/components/molecules/CoachCertificationsRail.vue'] = RailMarker
mocks['~/components/molecules/CoachFeaturedCredential.vue'] = PlaqueMarker

// Composables that rely on Nuxt auto-imports (ref/onMounted) and must not be
// loaded transitively under the harness.
mocks['~/composables/useScrollReveal'] = {
  useScrollReveal: () => ({ reveal: () => ({}), isReady: Vue.ref(false) })
}
mocks['~/composables/useExitIntent'] = { useExitIntent: () => undefined }

const stubs = {
  NuxtImg: Vue.defineComponent({ name: 'NuxtImg', setup: () => () => Vue.h('img') }),
  NuxtLink: Vue.defineComponent({ name: 'NuxtLink', setup: (_p, { slots }) => () => Vue.h('a', {}, slots.default ? slots.default() : []) }),
  UIcon: Vue.defineComponent({ name: 'UIcon', setup: () => () => Vue.h('i') }),
  UButton: Vue.defineComponent({ name: 'UButton', setup: (_p, { slots }) => () => Vue.h('button', {}, slots.default ? slots.default() : []) }),
  UAccordion: Vue.defineComponent({ name: 'UAccordion', setup: (_p, { slots }) => () => Vue.h('div', {}, slots.default ? slots.default() : []) }),
  UModal: Vue.defineComponent({ name: 'UModal', setup: (_p, { slots }) => () => Vue.h('div', {}, slots.default ? slots.default() : []) }),
  USelect: Vue.defineComponent({ name: 'USelect', setup: () => () => Vue.h('select') }),
  AtomsCoachFitSection: Vue.defineComponent({ name: 'AtomsCoachFitSection', setup: () => () => Vue.h('div', { 'data-stub': 'AtomsCoachFitSection' }) }),
  AtomsMedicalDisclaimer: Vue.defineComponent({ name: 'AtomsMedicalDisclaimer', setup: () => () => Vue.h('div', { 'data-stub': 'AtomsMedicalDisclaimer' }) })
}

function baseProps(profileOverrides: Record<string, unknown> = {}) {
  const profile = createCoachProfile({
    templateCode: 'signature',
    sectionsConfig: { bio: true, testimonials: true, certifications: true },
    credentials: TWO_CREDENTIALS.map(c => ({ ...c })),
    ...profileOverrides
  })
  return {
    tenant: createTenant(),
    ctaTo: '/rdv',
    coachProfile: profile,
    publicPrograms: createPrograms(),
    consultationPlans: createConsultationPlans(),
    isAuthenticated: false,
    currentPath: '/',
    previewMode: false
  }
}

function withFeatured(profileOverrides: Record<string, unknown> = {}) {
  const creds = [
    { title: 'DU Naturopathie', institution: 'ISUPNAT', featured: true },
    { title: 'Certification Ménopulse', institution: 'Ménopulse' }
  ]
  return baseProps({ credentials: creds, ...profileOverrides })
}

async function renderTemplate(templatePath: string, props: Record<string, unknown>): Promise<string> {
  return renderSfc(templatePath, {
    props,
    mocks,
    stubs,
    globals: { ...Vue, useState: () => ({ value: false }) }
  })
}

// ---------------------------------------------------------------------------
// AC-1 : section rendue quand elle doit l'être
// ---------------------------------------------------------------------------
describe('TF.2 — section certifications ON', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : id, h2, rail count=2`, async () => {
      const html = await renderTemplate(t.path, baseProps())
      assert.match(html, /id="certifications"/)
      assert.match(html, /Parcours &amp; qualifications/)
      assert.match(html, /data-rail/)
      assert.match(html, /data-rail-count="2"/)
    })
  }
})

// ---------------------------------------------------------------------------
// AC-2 : toggle OFF → section absente
// ---------------------------------------------------------------------------
describe('TF.2 — section certifications OFF par le toggle', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : pas d'id, pas de h2, pas de rail`, async () => {
      const html = await renderTemplate(t.path, baseProps({ sectionsConfig: { bio: true, testimonials: true, certifications: false } }))
      assert.doesNotMatch(html, /id="certifications"/)
      assert.doesNotMatch(html, /Parcours &amp; qualifications/)
      assert.doesNotMatch(html, /data-rail/)
    })
  }
})

// ---------------------------------------------------------------------------
// AC-3 : contenu vide → section absente
// ---------------------------------------------------------------------------
describe('TF.2 — section certifications OFF par contenu vide', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : pas d'id avec credentials vides`, async () => {
      const html = await renderTemplate(t.path, baseProps({ credentials: [] }))
      assert.doesNotMatch(html, /id="certifications"/)
    })
  }
})

// ---------------------------------------------------------------------------
// AC-4 : ordre, unicité, plaque hors section
// ---------------------------------------------------------------------------
describe('TF.2 — ordre et composition', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : qui-suis-je < certifications < temoignages, rail unique, plaque hors section`, async () => {
      const html = await renderTemplate(t.path, withFeatured())
      const bioIdx = html.indexOf('id="qui-suis-je"')
      const certIdx = html.indexOf('id="certifications"')
      const testiIdx = html.indexOf('id="temoignages"')
      assert.ok(bioIdx >= 0, `${t.name}: ancre bio introuvable`)
      assert.ok(certIdx >= 0, `${t.name}: ancre certifications introuvable`)
      assert.ok(testiIdx >= 0, `${t.name}: ancre témoignages introuvable`)
      assert.ok(bioIdx < certIdx, `${t.name}: bio doit précéder certifications`)
      assert.ok(certIdx < testiIdx, `${t.name}: certifications doit précéder témoignages`)
      // unicité du rail
      const railCount = (html.match(/data-rail-count/g) ?? []).length
      assert.equal(railCount, 1, `${t.name}: une seule occurrence du rail (trouvé ${railCount})`)
      // plaque hors de la section
      const start = html.indexOf('id="certifications"')
      const end = html.indexOf('</section>', start)
      assert.ok(start >= 0 && end > start, `${t.name}: bloc de section introuvable`)
      const block = html.slice(start, end)
      assert.equal(/data-featured-title/.test(block), false, `${t.name}: plaque ne doit pas être dans la section`)
    })
  }

  test('CoachPageVisuel : plaque rendue une fois avant id="certifications"', async () => {
    const html = await renderTemplate(TEMPLATES[2].path, withFeatured())
    const featuredIdx = html.indexOf('data-featured')
    const certIdx = html.indexOf('id="certifications"')
    assert.ok(featuredIdx >= 0, 'plaque attendue dans la bio')
    assert.ok(featuredIdx < certIdx, 'plaque doit précéder la section certifications')
    const count = (html.match(/data-featured-title/g) ?? []).length
    assert.equal(count, 1, 'une seule plaque attendue')
  })
})
