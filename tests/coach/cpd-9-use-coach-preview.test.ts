import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { effectScope, reactive, ref } from 'vue'

import { createCoachPreview, toPublicProgram } from '../../app/features/coach/useCoachPreview'
import type { CoachPreviewDeps } from '../../app/features/coach/useCoachPreview'
import type { ProgramResponse } from '../../app/features/programs/api/programs.contract'

const ALBA_TEMPLATE_CODE = 'visuel-portrait'

/** Toutes les dépendances REQUISES, comme la page les fournit. */
function makeDeps(overrides: Partial<CoachPreviewDeps> = {}): CoachPreviewDeps {
  return {
    account: ref(null),
    bioForm: reactive({ longBio: '', city: '', region: '' }),
    testimonialsForm: ref([]),
    brandingForm: reactive({ brandName: '' }),
    sectionsConfig: reactive<Record<string, boolean>>({}),
    pillarsForm: ref(null),
    faqForm: ref([]),
    benefitsForm: ref(null),
    howItWorksForm: ref([]),
    educationalContentForm: ref(null),
    problemStatementForm: ref(null),
    ...overrides
  }
}

/** Construit le composable dans un scope Vue (watchers + onScopeDispose). */
function withPreview<T>(fn: (preview: ReturnType<typeof createCoachPreview>) => T, overrides: Partial<CoachPreviewDeps> = {}): T {
  const scope = effectScope()
  try {
    return scope.run(() => fn(createCoachPreview(makeDeps(overrides)))) as T
  } finally {
    scope.stop()
  }
}

describe('cpd-9 — useCoachPreview', () => {
  test('toPublicProgram maps every field of PublicProgramListItem', () => {
    const program = {
      id: 'p1',
      providerId: 'prov1',
      name: 'Programme',
      description: 'desc',
      totalSessions: 5,
      validityMonths: 6,
      gracePeriodDays: 3,
      priceCents: 1000,
      allowInstallments: true,
      installmentCount: 2,
      discoveryGate: true,
      sessionDurationMinutes: 60,
      sortOrder: 1,
      status: 'active',
      stripeProductId: 'prod',
      stripePriceId: 'price',
      monthlyPriceCents: 500,
      createdAt: '2026-01-01T00:00:00.000Z'
    } as unknown as ProgramResponse

    // Contrat COMPLET : une clé oubliée par le mapping fait échouer ce test
    // (l'assertion d'origine ne vérifiait que 4 des 11 champs).
    assert.deepEqual(toPublicProgram(program), {
      id: 'p1',
      name: 'Programme',
      description: 'desc',
      totalSessions: 5,
      validityMonths: 6,
      priceCents: 1000,
      allowInstallments: true,
      installmentCount: 2,
      monthlyPriceCents: 500,
      discoveryGate: true,
      sessionDurationMinutes: 60
    })
  })

  test('toPublicProgram normalises absent nullable fields to null, never undefined', () => {
    const program = {
      id: 'p2',
      name: 'Sans versement',
      description: 'desc',
      totalSessions: 1,
      validityMonths: 1,
      priceCents: 100,
      allowInstallments: false,
      discoveryGate: false,
      sessionDurationMinutes: 30
    } as unknown as ProgramResponse

    const out = toPublicProgram(program)
    assert.equal(out.installmentCount, null)
    assert.equal(out.monthlyPriceCents, null)
    assert.ok(!Object.values(out).some(v => v === undefined), 'no field may be undefined')
    assert.equal(JSON.stringify(out).includes('undefined'), false)
  })

  test('openMobile opens the mobile preview; closeMobile returns to the editor without closing desktop', () => {
    withPreview((preview) => {
      const desktopBefore = preview.previewOpen.value
      assert.equal(preview.mobileOpen.value, false)

      preview.openMobile()
      assert.equal(preview.mobileOpen.value, true)

      preview.closeMobile()
      assert.equal(preview.mobileOpen.value, false)
      assert.equal(preview.previewOpen.value, desktopBefore, 'closeMobile must not touch the desktop panel')
    })
  })

  test('closeDesktop closes the desktop panel and a second call keeps it closed', () => {
    withPreview((preview) => {
      // default from useCoachPagePreviewState is open
      assert.equal(preview.previewOpen.value, true)
      preview.closeDesktop()
      assert.equal(preview.previewOpen.value, false)
      preview.closeDesktop()
      assert.equal(preview.previewOpen.value, false, 'closeDesktop is not a toggle')
    })
  })

  test('reopenDesktop reopens the desktop panel and a second call keeps it open', () => {
    withPreview((preview) => {
      preview.closeDesktop()
      assert.equal(preview.previewOpen.value, false)
      preview.reopenDesktop()
      assert.equal(preview.previewOpen.value, true)
      preview.reopenDesktop()
      assert.equal(preview.previewOpen.value, true, 'reopenDesktop is not a toggle')
    })
  })

  test('closeMobile is NOT equivalent to closeDesktop (non-vacuity)', () => {
    withPreview((preview) => {
      const desktopBefore = preview.previewOpen.value
      preview.closeMobile()
      assert.equal(preview.previewOpen.value, desktopBefore)
    })
  })

  test('missing required dependency throws instead of degrading silently', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const deps = makeDeps()
        delete (deps as { sectionsConfig?: unknown }).sectionsConfig
        assert.throws(
          () => createCoachPreview(deps),
          /missing required dependencies: sectionsConfig/
        )
      })
    } finally {
      scope.stop()
    }
  })

  test('previewTemplateCode derives from templates + selectedTemplateId, and Alba is not a hero-background template', () => {
    const templates = ref([
      { id: 't1', code: 'signature' },
      { id: 't2', code: ALBA_TEMPLATE_CODE }
    ])
    const selectedTemplateId = ref<string | null>('t1')

    withPreview((preview) => {
      assert.equal(preview.previewTemplateCode.value, 'signature')
      assert.equal(preview.isHeroBackgroundTemplate.value, true)

      selectedTemplateId.value = 't2'
      assert.equal(preview.previewTemplateCode.value, ALBA_TEMPLATE_CODE)
      assert.equal(preview.isHeroBackgroundTemplate.value, false)
    }, { templates, selectedTemplateId })
  })

  test('publicLink and previewLink come from the account slug (white-label domain honoured)', () => {
    const account = ref({
      slug: 'sophie',
      customDomain: 'sophiejouan.test'
    } as unknown as import('../../app/features/account/api/provider-account.contract').ProviderAccountResponse)

    withPreview((preview) => {
      assert.equal(preview.publicLink.value?.site, 'https://sophiejouan.test')
      assert.equal(preview.previewLink.value, '/coach/sophie?preview=true')
    }, { account })
  })

  test('loadPreviewData loads consultation plans and only the ACTIVE programs', async () => {
    const plans = [{ id: 'plan1' }, { id: 'plan2' }] as unknown as import('../../app/features/consultation/api/consultation.contract').ConsultationPricePlan[]
    const programs = [
      { id: 'a', name: 'Actif', status: 'active', totalSessions: 1, validityMonths: 1, priceCents: 1, allowInstallments: false, installmentCount: null, monthlyPriceCents: null, discoveryGate: false, sessionDurationMinutes: 30, description: 'd' },
      { id: 'b', name: 'Brouillon', status: 'draft' }
    ] as unknown as ProgramResponse[]

    await withPreview(async (preview) => {
      await preview.loadPreviewData()
      assert.equal(preview.consultationPlans.value.length, 2)
      assert.deepEqual(preview.publicPrograms.value.map(p => p.id), ['a'])
    }, {
      loadConsultationPlans: async () => plans,
      loadPrograms: async () => programs
    })
  })

  test('loadPreviewData falls back to empty lists when a loader rejects', async () => {
    await withPreview(async (preview) => {
      await preview.loadPreviewData()
      assert.deepEqual(preview.consultationPlans.value, [])
      assert.deepEqual(preview.publicPrograms.value, [])
    }, {
      loadConsultationPlans: async () => {
        throw new Error('boom')
      },
      loadPrograms: async () => {
        throw new Error('boom')
      }
    })
  })

  test('exposes the documented keys', () => {
    withPreview((preview) => {
      for (const k of ['device', 'mobileOpen', 'openMobile', 'closeMobile', 'reopenDesktop', 'closeDesktop', 'setDevice', 'publicLink', 'previewLink', 'draftProfile', 'draftTenant', 'consultationPlans', 'publicPrograms']) {
        assert.ok(k in preview, `missing ${k}`)
      }
    })
  })
})
