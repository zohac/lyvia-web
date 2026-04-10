import * as assert from 'node:assert/strict'
import test from 'node:test'
import { computed, createSSRApp, defineComponent, effectScope, h, nextTick, ref } from 'vue'
import { renderToString } from 'vue/server-renderer'

import {
  buildCoachEssentielNavLinks,
  getCoachEssentielBioParagraphs,
  hasCoachEssentielPricing
} from '../../app/features/coach/domain/essentiel-page'
import type {
  BenefitsJson,
  PublicProviderProfile
} from '../../app/features/seo/api/public-provider-profile.contract'
import { useCoachSectionVisibility } from '../../app/composables/useCoachSectionVisibility'

function createBenefits(): BenefitsJson {
  return {
    items: [
      {
        title: 'Retrouver un quotidien plus stable',
        description: 'Des ajustements simples pour mieux vivre les symptomes.'
      }
    ]
  }
}

function createProfile(overrides: Partial<PublicProviderProfile> = {}): PublicProviderProfile {
  return {
    slug: 'sophie-jouan',
    firstName: 'Sophie',
    lastName: 'Jouan',
    displayName: 'Sophie Jouan',
    bio: null,
    specialties: [],
    timezone: 'Europe/Paris',
    imageUrl: null,
    heroImageUrl: null,
    discoveryDurationMinutes: 15,
    discoveryBufferAfterMinutes: 15,
    isActive: true,
    longBio: null,
    credentials: [],
    city: null,
    region: null,
    socialLinks: {},
    publicPhone: null,
    urgencyText: null,
    heroHeadline: null,
    testimonialsJson: [],
    secondaryPhotoUrl: null,
    leadMagnetUrl: null,
    leadMagnetTitle: null,
    googleAdsId: null,
    googleAdsConversionLabel: null,
    microsoftClarityId: null,
    templateCode: 'essentiel',
    sectionsConfig: {},
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    ...overrides
  }
}

async function renderEssentielSnapshot(input: {
  coachProfile: PublicProviderProfile | null
  consultationPlans?: readonly unknown[]
  publicPrograms?: readonly unknown[]
}): Promise<string> {
  const snapshotApp = createSSRApp(defineComponent({
    setup() {
      const { show } = useCoachSectionVisibility(() => input.coachProfile)

      const hasPricing = computed(() => hasCoachEssentielPricing(
        input.consultationPlans ?? [],
        input.publicPrograms ?? []
      ))

      const navLinks = computed(() => buildCoachEssentielNavLinks({
        showBenefits: show.benefits.value,
        showBio: show.bio.value,
        hasPricing: hasPricing.value,
        showTestimonials: show.testimonials.value
      }))

      const bioParagraphs = computed(() => getCoachEssentielBioParagraphs(input.coachProfile))

      return () => h('main', [
        h('nav', { 'data-nav': 'true' }, navLinks.value.map(link => h('a', { href: link.href }, link.label))),
        show.bio.value
          ? h('section', { id: 'qui-suis-je' }, bioParagraphs.value.map(paragraph => h('p', paragraph)))
          : null,
        show.benefits.value ? h('section', { id: 'accompagnement' }, 'Accompagnement') : null,
        show.testimonials.value ? h('section', { id: 'temoignages' }, 'Temoignages') : null,
        hasPricing.value ? h('section', { id: 'tarifs' }, 'Tarifs') : null,
        h('section', { 'data-final-cta': 'true' }, 'CTA final'),
        h('div', { 'data-disclaimer': 'true' }, 'Disclaimer')
      ])
    }
  }))

  return renderToString(snapshotApp)
}

test('getCoachEssentielBioParagraphs splits and trims longBio paragraphs', () => {
  const paragraphs = getCoachEssentielBioParagraphs(createProfile({
    longBio: '  Premier paragraphe.  \n\n Deuxieme paragraphe. \n\n'
  }))

  assert.deepEqual(paragraphs, [
    'Premier paragraphe.',
    'Deuxieme paragraphe.'
  ])
})

test('buildCoachEssentielNavLinks keeps the expected order and omits hidden sections', () => {
  const links = buildCoachEssentielNavLinks({
    showBenefits: true,
    showBio: false,
    hasPricing: true,
    showTestimonials: true
  })

  assert.deepEqual(links, [
    { label: 'Accompagnement', href: '#accompagnement' },
    { label: 'Tarifs', href: '#tarifs' },
    { label: 'Témoignages', href: '#temoignages' }
  ])
})

test('useCoachSectionVisibility hides bio when toggle is off even with content', async () => {
  const profile = ref(createProfile({
    bio: 'Je vous accompagne avec une approche concrete.',
    sectionsConfig: { bio: false }
  }))

  const scope = effectScope()
  let showBio: ReturnType<typeof useCoachSectionVisibility>['show']['bio'] | undefined
  let hasBio: ReturnType<typeof useCoachSectionVisibility>['has']['bio'] | undefined

  scope.run(() => {
    const visibility = useCoachSectionVisibility(profile)
    showBio = visibility.show.bio
    hasBio = visibility.has.bio
  })

  assert.equal(hasBio?.value, true)
  assert.equal(showBio?.value, false)

  profile.value = createProfile({
    bio: 'Je vous accompagne avec une approche concrete.',
    sectionsConfig: { bio: true }
  })
  await nextTick()

  assert.equal(showBio?.value, true)
  scope.stop()
})

test('useCoachSectionVisibility hides bio when content is empty even if toggle is on', async () => {
  const profile = ref(createProfile({
    bio: '   ',
    longBio: '\n\n',
    sectionsConfig: { bio: true }
  }))

  const scope = effectScope()
  let showBio: ReturnType<typeof useCoachSectionVisibility>['show']['bio'] | undefined
  let hasBio: ReturnType<typeof useCoachSectionVisibility>['has']['bio'] | undefined

  scope.run(() => {
    const visibility = useCoachSectionVisibility(profile)
    showBio = visibility.show.bio
    hasBio = visibility.has.bio
  })

  assert.equal(hasBio?.value, false)
  assert.equal(showBio?.value, false)

  profile.value = createProfile({
    longBio: 'Premier paragraphe.\n\nDeuxieme paragraphe.',
    sectionsConfig: { bio: true }
  })
  await nextTick()

  assert.equal(hasBio?.value, true)
  assert.equal(showBio?.value, true)
  scope.stop()
})

test('SSR snapshot keeps the minimal always-on sections while hiding bio when disabled', async () => {
  const html = await renderEssentielSnapshot({
    coachProfile: createProfile({
      bio: 'Je vous accompagne avec une approche concrete.',
      sectionsConfig: { bio: false }
    })
  })

  assert.ok(!html.includes('id="qui-suis-je"'))
  assert.ok(!html.includes('>Qui suis-je<'))
  assert.ok(html.includes('data-final-cta="true"'))
  assert.ok(html.includes('data-disclaimer="true"'))
})

test('SSR snapshot renders the bio section, nav links and pricing when data is present', async () => {
  const html = await renderEssentielSnapshot({
    coachProfile: createProfile({
      longBio: 'Premier paragraphe.\n\nDeuxieme paragraphe.',
      benefitsJson: createBenefits(),
      testimonialsJson: [
        { quote: 'Un vrai mieux.', firstName: 'Anne' }
      ],
      sectionsConfig: {
        bio: true,
        benefits: true,
        testimonials: true
      }
    }),
    publicPrograms: [{}]
  })

  assert.ok(html.includes('href="#accompagnement"'))
  assert.ok(html.includes('href="#qui-suis-je"'))
  assert.ok(html.includes('href="#tarifs"'))
  assert.ok(html.includes('href="#temoignages"'))
  assert.ok(html.includes('id="qui-suis-je"'))
  assert.ok(html.includes('Premier paragraphe.'))
  assert.ok(html.includes('Deuxieme paragraphe.'))
  assert.ok(html.includes('id="tarifs"'))
})
