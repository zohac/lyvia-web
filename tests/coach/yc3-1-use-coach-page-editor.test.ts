import * as assert from 'node:assert/strict'
import test from 'node:test'
import { ref } from 'vue'

import { createCoachPageEditor } from '../../app/features/coach/createCoachPageEditor'
import type { CoachPageTemplate } from '../../app/features/coach/api/coach-page-template.contract'
import type {
  ProviderAccountResponse,
  UpdateProviderAccountRequest
} from '../../app/features/account/api/provider-account.contract'

const signatureTemplate: CoachPageTemplate = {
  id: 'signature',
  code: 'signature',
  name: 'Signature',
  description: 'Template signature',
  previewImageUrl: null,
  sectionsAvailable: [
    'hero',
    'bio',
    'pillars',
    'faq',
    'testimonials',
    'benefits',
    'howItWorks',
    'educationalContent',
    'problemStatement',
    'emotionalSupport',
    'pricing',
    'disclaimer'
  ]
}

const essentielTemplate: CoachPageTemplate = {
  id: 'essentiel',
  code: 'essentiel',
  name: 'Essentiel',
  description: 'Template essentiel',
  previewImageUrl: null,
  sectionsAvailable: [
    'hero',
    'bio',
    'pillars',
    'faq',
    'testimonials',
    'benefits',
    'howItWorks',
    'pricing',
    'disclaimer'
  ]
}

function makeAccount(overrides: Partial<ProviderAccountResponse> = {}): ProviderAccountResponse {
  return {
    email: 'coach@example.test',
    firstname: 'Sophie',
    lastname: 'Jouan',
    bio: 'Bio',
    specialties: ['Stress'],
    slug: 'sophie-jouan',
    defaultDiscoveryDurationMinutes: 30,
    discoveryBufferAfterMinutes: 15,
    minBookingNoticeHours: 6,
    longBio: null,
    credentials: [],
    city: 'Paris',
    region: 'Ile-de-France',
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
    coachPageTemplateId: 'signature',
    sectionsConfig: {},
    brandColor: null,
    pillarsJson: null,
    faqJson: null,
    benefitsJson: null,
    howItWorksJson: null,
    educationalContentJson: null,
    problemStatementJson: null,
    brandName: null,
    logoUrl: null,
    imageUrl: null,
    heroImageUrl: null,
    secondaryPhotoUrl: null,
    updatedAt: '2026-04-12T10:00:00.000Z',
    ...overrides
  }
}

function createEditorHarness(options: {
  account?: ProviderAccountResponse
  templates?: CoachPageTemplate[]
} = {}) {
  const accountRef = ref<ProviderAccountResponse | null>(options.account ?? makeAccount())
  const loadingRef = ref(false)
  const savingRef = ref(false)
  const errorRef = ref<string | null>(null)
  const updatePatches: UpdateProviderAccountRequest[] = []
  const detailedPatches: UpdateProviderAccountRequest[] = []
  const stats = {
    fetchAccountCalls: 0,
    listTemplatesCalls: 0
  }

  function clonePatch(patch: UpdateProviderAccountRequest): UpdateProviderAccountRequest {
    return JSON.parse(JSON.stringify(patch)) as UpdateProviderAccountRequest
  }

  const editor = createCoachPageEditor({
    providerAccount: {
      account: accountRef,
      loading: loadingRef,
      saving: savingRef,
      error: errorRef,
      async fetchAccount() {
        stats.fetchAccountCalls += 1
      },
      async updateAccount(patch) {
        const nextPatch = clonePatch(patch)
        updatePatches.push(nextPatch)
        if (accountRef.value) {
          accountRef.value = { ...accountRef.value, ...nextPatch }
        }
        return true
      },
      async updateAccountDetailed(patch) {
        const nextPatch = clonePatch(patch)
        detailedPatches.push(nextPatch)
        accountRef.value = { ...(accountRef.value ?? makeAccount()), ...nextPatch }
        return { ok: true, data: accountRef.value }
      }
    },
    async listTemplates() {
      stats.listTemplatesCalls += 1
      return options.templates ?? [signatureTemplate, essentielTemplate]
    }
  })

  return {
    editor,
    stats,
    updatePatches,
    detailedPatches
  }
}

test('useCoachPageEditor: init hydrates forms from account and selected template', async () => {
  const account = makeAccount({
    coachPageTemplateId: 'signature',
    sectionsConfig: { benefits: false, pricing: true },
    benefitsJson: {
      items: [{ title: 'Clarté', description: 'Retrouver du sens', icon: 'i-lucide-heart' }],
      visionIntro: 'Ma vision',
      visionText: 'Mon texte'
    },
    educationalContentJson: {
      paragraphs: ['Premier paragraphe'],
      insightBox: { title: 'Insight', content: 'Contenu' }
    },
    problemStatementJson: {
      blockquote: 'Je ne comprends pas ce qu\'il m\'arrive',
      paragraphs: ['Paragraphe 1']
    }
  })
  const { editor, stats } = createEditorHarness({ account })

  await editor.init()

  assert.equal(stats.fetchAccountCalls, 1)
  assert.equal(stats.listTemplatesCalls, 1)
  assert.equal(editor.selectedTemplateId.value, 'signature')
  assert.deepStrictEqual(editor.availableSections.value, signatureTemplate.sectionsAvailable)
  assert.equal(editor.hasEmotionalSupportSection.value, true)
  assert.equal(editor.isSectionOn('hero'), true)
  assert.equal(editor.isSectionOn('benefits'), false)
  assert.deepStrictEqual(editor.benefitsForm.value, account.benefitsJson)
  assert.notEqual(editor.benefitsForm.value, account.benefitsJson)
  assert.deepStrictEqual(editor.educationalContentForm.value, account.educationalContentJson)
  assert.notEqual(editor.educationalContentForm.value, account.educationalContentJson)
  assert.deepStrictEqual(editor.problemStatementForm.value, account.problemStatementJson)
  assert.notEqual(editor.problemStatementForm.value, account.problemStatementJson)
})

test('useCoachPageEditor: benefits vision auto-creates empty form and saveBenefits sends the live payload', async () => {
  const { editor, updatePatches } = createEditorHarness({
    account: makeAccount({ benefitsJson: null })
  })

  editor.setBenefitsVisionIntro('Ma vision')
  editor.setBenefitsVisionText('Mon texte')

  assert.deepStrictEqual(editor.benefitsForm.value, {
    items: [],
    visionIntro: 'Ma vision',
    visionText: 'Mon texte'
  })

  editor.setBenefitsVisionIntro('')
  assert.equal(editor.benefitsForm.value?.visionIntro, undefined)

  const ok = await editor.saveBenefits()

  assert.equal(ok, true)
  assert.deepStrictEqual(updatePatches, [{
    benefitsJson: {
      items: [],
      visionText: 'Mon texte'
    }
  }])
})

test('useCoachPageEditor: educational insight handlers create the real form state used by the page', async () => {
  const { editor, updatePatches } = createEditorHarness({
    account: makeAccount({ educationalContentJson: null })
  })

  editor.addEducationalParagraph()
  editor.educationalContentForm.value!.paragraphs[0] = 'Paragraphe pédagogique'
  editor.setEducationalInsightTitle('Titre insight')
  editor.setEducationalInsightContent('Contenu insight')
  editor.removeEducationalParagraph(0)

  assert.deepStrictEqual(editor.educationalContentForm.value, {
    paragraphs: [],
    insightBox: {
      title: 'Titre insight',
      content: 'Contenu insight'
    }
  })

  const ok = await editor.saveEducationalContent()

  assert.equal(ok, true)
  assert.deepStrictEqual(updatePatches, [{
    educationalContentJson: {
      paragraphs: [],
      insightBox: {
        title: 'Titre insight',
        content: 'Contenu insight'
      }
    }
  }])
})

test('useCoachPageEditor: problem statement handlers create blockquote and paragraphs on empty profile', async () => {
  const { editor, updatePatches } = createEditorHarness({
    account: makeAccount({ problemStatementJson: null })
  })

  editor.setProblemStatementBlockquote('Citation principale')
  editor.addProblemParagraph()
  editor.problemStatementForm.value!.paragraphs[0] = 'Premier paragraphe'
  editor.addProblemParagraph()
  editor.problemStatementForm.value!.paragraphs[1] = 'Deuxième paragraphe'
  editor.removeProblemParagraph(0)

  assert.deepStrictEqual(editor.problemStatementForm.value, {
    blockquote: 'Citation principale',
    paragraphs: ['Deuxième paragraphe']
  })

  const ok = await editor.saveProblemStatement()

  assert.equal(ok, true)
  assert.deepStrictEqual(updatePatches, [{
    problemStatementJson: {
      blockquote: 'Citation principale',
      paragraphs: ['Deuxième paragraphe']
    }
  }])
})

test('useCoachPageEditor: saveTemplate resyncs selected template and derived sections after provider update', async () => {
  const { editor, detailedPatches } = createEditorHarness({
    account: makeAccount({ coachPageTemplateId: 'essentiel' })
  })

  await editor.init()

  const result = await editor.saveTemplate('signature')

  assert.deepStrictEqual(detailedPatches, [{ coachPageTemplateId: 'signature' }])
  assert.deepStrictEqual(result, { ok: true })
  assert.equal(editor.selectedTemplateId.value, 'signature')
  assert.equal(editor.hasEmotionalSupportSection.value, true)
  assert.ok(editor.editableSections.value.includes('problemStatement'))
})
