import * as assert from 'node:assert/strict'
import * as Vue from 'vue'
import test, { describe } from 'node:test'

import type { ConsultationPricePlan } from '../../app/features/consultation/api/consultation.contract'
import type { PublicTenantResponse } from '../../app/features/onboarding/api/onboarding.contract'
import type { PublicProgramListItem } from '../../app/features/programs/api/programs.contract'
import type { CredentialItem, PublicProviderProfile } from '../../app/features/seo/api/public-provider-profile.contract'

import { renderSfc } from '../helpers/render-sfc'
import {
  createCoachProfile,
  createConsultationPlans,
  createPrograms,
  createTenant,
  ONE_CREDENTIAL,
  TWO_CREDENTIALS
} from './fixtures/coach-page-render-fixture'

type TemplateUnderTest = { name: string, path: string, templateCode: string }

// `templateCode` suit le mapping de `app/composables/useCoachPageTemplate.ts` :
// Alba est servie par le code `visuel-portrait`, pas par `signature`. Le rendre
// explicite évite de rendre les quatre templates avec un profil que le
// résolveur de production ne pourrait jamais leur associer.
const TEMPLATES: TemplateUnderTest[] = [
  { name: 'CoachPageSignature.vue', path: 'app/components/templates/coach-pages/CoachPageSignature.vue', templateCode: 'signature' },
  { name: 'CoachPageEssentiel.vue', path: 'app/components/templates/coach-pages/CoachPageEssentiel.vue', templateCode: 'essentiel' },
  { name: 'CoachPageVisuel.vue', path: 'app/components/templates/coach-pages/CoachPageVisuel.vue', templateCode: 'visuel' },
  { name: 'CoachPageAlba.vue', path: 'app/components/templates/coach-pages/CoachPageAlba.vue', templateCode: 'visuel-portrait' }
]

function findTemplate(name: string): TemplateUnderTest {
  const found = TEMPLATES.find(template => template.name === name)
  if (!found) {
    throw new Error(`${name} absent de TEMPLATES : la liste des templates a changé`)
  }
  return found
}

// ---------------------------------------------------------------------------
// Markers (mocks that echo their props)
// ---------------------------------------------------------------------------

const RailMarker = Vue.defineComponent({
  name: 'CoachCertificationsRailMarker',
  props: { credentials: { type: Array, default: () => [] } },
  setup: (props) => {
    return () => {
      const credentials = props.credentials as Array<{ title?: string }>
      return Vue.h('div', {
        'data-rail': '',
        'data-rail-count': String(credentials.length),
        'data-rail-titles': credentials.map(credential => credential.title ?? '').join('|')
      })
    }
  }
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

// Seuls les composants réellement importés par les quatre templates (et par
// `CoachVisuelBio`, qui est rendu pour de vrai) sont mockés. Une clé posée sur
// un dossier que rien n'importe ne prouve rien : elle masquerait un déplacement
// de fichier au lieu de le faire échouer.
const SIMPLE_CHILDREN: Record<string, readonly string[]> = {
  '~/components/organisms': [
    'CoachHeroProfile',
    'CoachTransformationBenefits',
    'CoachFreeText',
    'CoachHowItWorks',
    'CoachPillars',
    'CoachPricing',
    'CoachTestimonials',
    'CoachEducationalContent',
    'CoachLeadCapture'
  ],
  '~/components/atoms': ['CoachInlineCta', 'CoachAnnouncementBar'],
  '~/components/molecules': ['StickyCtaMobile'],
  '~/components/templates/coach-pages/essentiel': ['CoachEssentielHeader', 'CoachEssentielHero'],
  // `CoachVisuelBio` n'est pas mocké : il porte l'ancre `id="qui-suis-je"` de
  // Visuel, donc son rendu réel est la seule preuve d'ordre honnête.
  '~/components/templates/coach-pages/visuel': [
    'CoachVisuelHeader',
    'CoachVisuelHero',
    'CoachVisuelProblem',
    'CoachVisuelPillars',
    'CoachVisuelSteps',
    'CoachVisuelMidCta'
  ],
  '~/components/templates/coach-pages/alba': ['CoachAlbaHeader', 'CoachAlbaHero']
}

const mocks: Record<string, unknown> = {}
for (const [directory, children] of Object.entries(SIMPLE_CHILDREN)) {
  for (const child of children) {
    mocks[`${directory}/${child}.vue`] = simpleMarker(child)
  }
}
// Rail et plaque : marqueurs qui échoent leurs props.
mocks['~/components/molecules/CoachCertificationsRail.vue'] = RailMarker
mocks['~/components/molecules/CoachFeaturedCredential.vue'] = PlaqueMarker

// Composables qui reposent sur des auto-imports Nuxt (ref/onMounted) et ne
// doivent pas être chargés transitivement sous le harnais.
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

type TemplateProps = {
  tenant: PublicTenantResponse
  ctaTo: string
  coachProfile: PublicProviderProfile
  publicPrograms: PublicProgramListItem[]
  consultationPlans: ConsultationPricePlan[]
  isAuthenticated: boolean
  currentPath: string
  previewMode: boolean
}

function baseProps(profileOverrides: Partial<PublicProviderProfile> = {}): TemplateProps {
  const profile = createCoachProfile({
    sectionsConfig: { bio: true, testimonials: true, certifications: true },
    credentials: TWO_CREDENTIALS.map(credential => ({ ...credential })),
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

function templateProps(template: TemplateUnderTest, profileOverrides: Partial<PublicProviderProfile> = {}): TemplateProps {
  return baseProps({ templateCode: template.templateCode, ...profileOverrides })
}

const FEATURED_CREDENTIAL_TITLE = 'DU Naturopathie'
const OTHER_CREDENTIAL_TITLE = 'Certification Ménopulse'

function withFeatured(template: TemplateUnderTest, profileOverrides: Partial<PublicProviderProfile> = {}): TemplateProps {
  // La qualification mise en avant est **seconde** : si elle était première,
  // un `credentials[0]` passerait pour `findFeaturedCredential`, et l'assertion
  // de titre ne prouverait rien.
  const credentials: CredentialItem[] = [
    { title: OTHER_CREDENTIAL_TITLE, institution: 'Ménopulse' },
    { title: FEATURED_CREDENTIAL_TITLE, institution: 'ISUPNAT', featured: true }
  ]
  return templateProps(template, { ...profileOverrides, credentials })
}

function withOneCredential(template: TemplateUnderTest): TemplateProps {
  return templateProps(template, { credentials: ONE_CREDENTIAL.map(credential => ({ ...credential })) })
}

async function renderTemplate(templatePath: string, props: TemplateProps): Promise<string> {
  return renderSfc(templatePath, {
    props,
    mocks,
    stubs,
    globals: { ...Vue, useState: () => ({ value: false }) }
  })
}

/**
 * Bloc d'une section, **balise d'ouverture incluse**.
 * Sans exiger le `<section ...>` lui-même, un `indexOf('</section>')` peut
 * traverser la section suivante et l'assertion ne prouve plus rien.
 */
function sectionBlock(html: string, sectionId: string, label: string): string {
  const opening = new RegExp(`<section[^>]*id="${sectionId}"`).exec(html)
  if (!opening) {
    throw new Error(`${label}: <section id="${sectionId}"> introuvable`)
  }
  const end = html.indexOf('</section>', opening.index)
  if (end <= opening.index) {
    throw new Error(`${label}: balise </section> de #${sectionId} introuvable`)
  }
  return html.slice(opening.index, end)
}

function certificationsBlock(html: string, label: string): string {
  return sectionBlock(html, 'certifications', label)
}

function railTitlesOf(credentials: CredentialItem[]): string {
  return credentials.map(credential => credential.title ?? '').join('|')
}

// ---------------------------------------------------------------------------
// AC-1 : section rendue quand elle doit l'être, avec son rail dedans
// ---------------------------------------------------------------------------
describe('TF.2 — section certifications ON', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : <section id>, <h2> avant le rail, rail porteur des 2 qualifications`, async () => {
      const html = await renderTemplate(t.path, templateProps(t))
      const block = certificationsBlock(html, t.name)
      assert.match(block, /<h2[^>]*>\s*Parcours &amp; qualifications\s*<\/h2>/)
      assert.match(block, /data-rail-count="2"/, `${t.name}: le rail doit recevoir les qualifications`)
      assert.ok(
        block.indexOf('<h2') < block.indexOf('data-rail'),
        `${t.name}: le titre de section doit précéder le rail`
      )
      assert.ok(
        block.includes(`data-rail-titles="${railTitlesOf(TWO_CREDENTIALS)}"`),
        `${t.name}: le rail doit porter les qualifications réelles, pas leur nombre`
      )
    })

    test(`${t.name} : une seule qualification → rail count=1`, async () => {
      const html = await renderTemplate(t.path, withOneCredential(t))
      const block = certificationsBlock(html, t.name)
      assert.match(block, /data-rail-count="1"/, `${t.name}: le rail doit compter ce qu'il reçoit`)
      assert.ok(
        block.includes(`data-rail-titles="${ONE_CREDENTIAL[0]?.title ?? ''}"`),
        `${t.name}: le rail doit porter la qualification réelle`
      )
    })
  }
})

// ---------------------------------------------------------------------------
// AC-2 : toggle OFF → section absente
// ---------------------------------------------------------------------------
describe('TF.2 — section certifications OFF par le toggle', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : pas d'id, pas de h2, pas de rail`, async () => {
      const html = await renderTemplate(t.path, templateProps(t, { sectionsConfig: { bio: true, testimonials: true, certifications: false } }))
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
    test(`${t.name} : ni section, ni titre, ni rail avec credentials vides`, async () => {
      const html = await renderTemplate(t.path, templateProps(t, { credentials: [] }))
      assert.doesNotMatch(html, /id="certifications"/)
      assert.doesNotMatch(html, /Parcours &amp; qualifications/)
      assert.doesNotMatch(html, /data-rail/)
    })
  }
})

// ---------------------------------------------------------------------------
// AC-4 : ordre, unicité, plaque hors section
// ---------------------------------------------------------------------------
describe('TF.2 — ordre et composition', () => {
  for (const t of TEMPLATES) {
    test(`${t.name} : qui-suis-je < certifications < temoignages, rail unique, plaque hors section`, async () => {
      const html = await renderTemplate(t.path, withFeatured(t))
      const bioIdx = html.indexOf('id="qui-suis-je"')
      const certIdx = html.indexOf('id="certifications"')
      const testiIdx = html.indexOf('id="temoignages"')
      assert.ok(bioIdx >= 0, `${t.name}: ancre bio introuvable`)
      assert.ok(certIdx >= 0, `${t.name}: ancre certifications introuvable`)
      assert.ok(testiIdx >= 0, `${t.name}: ancre témoignages introuvable`)
      assert.ok(bioIdx < certIdx, `${t.name}: bio doit précéder certifications`)
      assert.ok(certIdx < testiIdx, `${t.name}: certifications doit précéder témoignages`)
      // unicité du rail et de la section
      const railCount = (html.match(/data-rail-count/g) ?? []).length
      assert.equal(railCount, 1, `${t.name}: une seule occurrence du rail (trouvé ${railCount})`)
      const sectionCount = (html.match(/id="certifications"/g) ?? []).length
      assert.equal(sectionCount, 1, `${t.name}: une seule section certifications (trouvé ${sectionCount})`)
      // plaque hors de la section
      const block = certificationsBlock(html, t.name)
      assert.doesNotMatch(block, /data-featured-title/, `${t.name}: plaque ne doit pas être dans la section`)
    })
  }

  test('CoachPageVisuel : plaque rendue dans la bio, une fois, avec la qualification mise en avant', async () => {
    const visuel = findTemplate('CoachPageVisuel.vue')
    const html = await renderTemplate(visuel.path, withFeatured(visuel))
    const featuredIdx = html.indexOf('data-featured')
    const certIdx = html.indexOf('id="certifications"')
    assert.ok(featuredIdx >= 0, 'plaque attendue dans la bio')
    assert.ok(featuredIdx < certIdx, 'plaque doit précéder la section certifications')
    // La plaque vit dans la bio de Visuel, pas dans le hero : l'y enfermer est
    // la seule assertion qui distingue les deux emplacements.
    const bioBlock = sectionBlock(html, 'qui-suis-je', visuel.name)
    assert.ok(
      bioBlock.includes(`data-featured-title="${FEATURED_CREDENTIAL_TITLE}"`),
      'la plaque doit rendre la qualification marquée featured, pas la première de la liste'
    )
    const titles = html.match(/data-featured-title="[^"]*"/g) ?? []
    assert.deepEqual(titles, [`data-featured-title="${FEATURED_CREDENTIAL_TITLE}"`])
  })
})
