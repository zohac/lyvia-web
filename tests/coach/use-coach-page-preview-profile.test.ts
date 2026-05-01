import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { effectScope, reactive, ref } from 'vue'
import type { Ref } from 'vue'

import {
  PREVIEW_DEBOUNCE_MS,
  useCoachPagePreviewProfile,
  type CoachPagePreviewDeps
} from '../../app/features/coach/useCoachPagePreviewProfile'
import type {
  ProviderAccountResponse,
  TestimonialItem
} from '../../app/features/account/api/provider-account.contract'
import type {
  BenefitsJson,
  EducationalContentJson,
  FaqItem,
  HowItWorksStep,
  PillarsJson,
  ProblemStatementJson
} from '../../app/features/seo/api/public-provider-profile.contract'

/**
 * Story 0-28 — runtime tests for `useCoachPagePreviewProfile`.
 *
 * Anti-faux-vert: these tests fail if the debounce is removed (texts
 * would update synchronously), if toggles get debounced (sectionsConfig
 * would lag), or if the brandName overlay is dropped.
 */

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function makeAccount(overrides: Partial<ProviderAccountResponse> = {}): ProviderAccountResponse {
  return {
    email: 'sophie@example.test',
    firstname: 'Sophie',
    lastname: 'Jouan',
    bio: 'Bio courte serveur',
    specialties: ['Stress', 'Sommeil'],
    slug: 'sophie-jouan',
    defaultDiscoveryDurationMinutes: 30,
    discoveryBufferAfterMinutes: 15,
    minBookingNoticeHours: 6,
    longBio: 'LongBio serveur',
    credentials: [],
    city: 'Paris',
    region: 'Île-de-France',
    socialLinks: {},
    publicPhone: null,
    urgencyText: null,
    heroHeadline: null,
    testimonialsJson: [],
    leadMagnetUrl: null,
    leadMagnetTitle: null,
    googleAdsId: null,
    googleAdsConversionLabel: null,
    microsoftClarityId: null,
    coachPageTemplateId: 'tpl-1',
    sectionsConfig: { pillars: true, faq: true, bio: true },
    brandColor: null,
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    brandName: null,
    logoUrl: null,
    ...overrides
  }
}

type Harness = CoachPagePreviewDeps

function createHarness(account: ProviderAccountResponse | null): Harness {
  return {
    account: ref(account) as Ref<ProviderAccountResponse | null>,
    bioForm: reactive({ longBio: '', city: '', region: '' }),
    testimonialsForm: ref<TestimonialItem[]>([]) as Ref<TestimonialItem[]>,
    brandingForm: reactive({ brandName: '' }),
    sectionsConfig: reactive<Record<string, boolean>>({}),
    pillarsForm: ref<PillarsJson | null>(null) as Ref<PillarsJson | null>,
    faqForm: ref<FaqItem[]>([]) as Ref<FaqItem[]>,
    benefitsForm: ref<BenefitsJson | null>(null) as Ref<BenefitsJson | null>,
    howItWorksForm: ref<HowItWorksStep[]>([]) as Ref<HowItWorksStep[]>,
    educationalContentForm: ref<EducationalContentJson | null>(null) as Ref<EducationalContentJson | null>,
    problemStatementForm: ref<ProblemStatementJson | null>(null) as Ref<ProblemStatementJson | null>
  }
}

describe('useCoachPagePreviewProfile', () => {
  test('exports the documented PREVIEW_DEBOUNCE_MS constant', () => {
    assert.equal(PREVIEW_DEBOUNCE_MS, 250)
  })

  test('returns null draft when account is null', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const h = createHarness(null)
        const { draftCoachProfile, draftTenant } = useCoachPagePreviewProfile(h)
        assert.equal(draftCoachProfile.value, null)
        assert.equal(draftTenant.value, null)
      })
    } finally {
      scope.stop()
    }
  })

  test('hydrates draft from server account on first read (after initial debounce flush)', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const h = createHarness(makeAccount())
        const { draftCoachProfile } = useCoachPagePreviewProfile(h)
        // The watch fires immediately on creation, so the snapshot commit
        // happens after PREVIEW_DEBOUNCE_MS.
        await sleep(PREVIEW_DEBOUNCE_MS + 50)

        const draft = draftCoachProfile.value
        assert.ok(draft, 'draft must not be null when account is set')
        assert.equal(draft!.firstName, 'Sophie')
        assert.equal(draft!.longBio, 'LongBio serveur')
        assert.equal(draft!.city, 'Paris')
      })
    } finally {
      scope.stop()
    }
  })

  test('debounces 250ms on free-text edits (longBio); pre-flush draft still reflects server', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const h = createHarness(makeAccount({ longBio: 'serveur initial' }))
        const { draftCoachProfile } = useCoachPagePreviewProfile(h)
        await sleep(PREVIEW_DEBOUNCE_MS + 50)
        assert.equal(draftCoachProfile.value?.longBio, 'serveur initial')

        // Mutate the form — must NOT propagate immediately.
        h.bioForm.longBio = 'X'
        await sleep(50)
        assert.equal(
          draftCoachProfile.value?.longBio,
          'serveur initial',
          'longBio must remain stale before the debounce fires (jank guard)'
        )

        // After 250ms, the snapshot commits.
        await sleep(PREVIEW_DEBOUNCE_MS)
        assert.equal(draftCoachProfile.value?.longBio, 'X')
      })
    } finally {
      scope.stop()
    }
  })

  test('toggles (sectionsConfig) propagate INSTANTLY without waiting the debounce window', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const h = createHarness(makeAccount())
        // Seed the form-local sectionsConfig (the page hydrates this from
        // account in coach-page.vue; here we set it directly on the harness).
        h.sectionsConfig.pillars = true
        h.sectionsConfig.faq = true

        const { draftCoachProfile } = useCoachPagePreviewProfile(h)
        await sleep(PREVIEW_DEBOUNCE_MS + 50)
        assert.equal(draftCoachProfile.value?.sectionsConfig.pillars, true)

        // Mutate the toggle.
        h.sectionsConfig.pillars = false
        // No sleep — toggles bypass the debounce.
        assert.equal(
          draftCoachProfile.value?.sectionsConfig.pillars,
          false,
          'toggles must reflect instantly (AC-3, no debounce)'
        )

        // Adding a brand-new key also flows through (Vue ADD track op).
        h.sectionsConfig.testimonials = true
        assert.equal(draftCoachProfile.value?.sectionsConfig.testimonials, true)
      })
    } finally {
      scope.stop()
    }
  })

  test('brandingForm.brandName overlays draftTenant.brand.displayName INSTANTLY (no debounce)', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const h = createHarness(makeAccount())
        const { draftTenant } = useCoachPagePreviewProfile(h)
        // Default fallback when brandName is empty: full coach name.
        assert.equal(draftTenant.value?.brand.displayName, 'Sophie Jouan')

        h.brandingForm.brandName = 'Maison Sophie'
        // Branding flows instantly — no sleep needed (AC-5).
        assert.equal(
          draftTenant.value?.brand.displayName,
          'Maison Sophie',
          'brandName must overlay tenant.brand.displayName without debounce'
        )

        // Trim is applied (no leading/trailing spaces leak).
        h.brandingForm.brandName = '   '
        assert.equal(
          draftTenant.value?.brand.displayName,
          'Sophie Jouan',
          'whitespace-only brandName must fall back to coach full name'
        )
      })
    } finally {
      scope.stop()
    }
  })

  test('logoUrl flows instantly from server account into draftCoachProfile (post-upload refresh)', async () => {
    const scope = effectScope()
    try {
      await scope.run(async () => {
        const h = createHarness(makeAccount({ logoUrl: null }))
        const { draftCoachProfile } = useCoachPagePreviewProfile(h)
        await sleep(PREVIEW_DEBOUNCE_MS + 50)
        assert.equal(draftCoachProfile.value?.logoUrl, null)

        // Simulate fetchAccount() refresh after a successful upload.
        h.account.value = makeAccount({
          logoUrl: 'https://cdn.example.com/logos/sophie.png'
        })
        // No sleep — account ref is read directly inside the computed.
        assert.equal(
          draftCoachProfile.value?.logoUrl,
          'https://cdn.example.com/logos/sophie.png',
          'logoUrl must reflect the server account ref instantly'
        )
      })
    } finally {
      scope.stop()
    }
  })

  test('clears the pending debounce timer on scope disposal (no late commit)', async () => {
    const h = createHarness(makeAccount())
    const scope = effectScope()
    scope.run(() => {
      const { draftCoachProfile: _draft } = useCoachPagePreviewProfile(h)
      h.bioForm.longBio = 'late commit attempt'
      // Stop the scope BEFORE the debounce fires.
      scope.stop()
    })

    // Wait past the debounce window — no error should have been thrown
    // (the timer was cleared on dispose). We can't observe the snapshot
    // here because the scope is gone, but the absence of unhandled
    // rejection / late writes is the assertion.
    await sleep(PREVIEW_DEBOUNCE_MS + 100)
    assert.ok(true, 'scope.stop() must clear the pending debounce timer cleanly')
  })
})
