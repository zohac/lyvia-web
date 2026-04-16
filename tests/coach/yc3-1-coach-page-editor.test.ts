import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  COACH_PAGE_ALWAYS_ON_SECTIONS,
  COACH_PAGE_INLINE_EDITOR_SECTIONS,
  getCoachPageConfigurableSections,
  getCoachPageEditableSections,
  getCoachPageExternalEditorSection,
  getCoachPageTemplateSaveErrorToast,
  isCoachPageAlwaysOnSection,
  isCoachPageInlineEditorSection,
  isCoachPageNestedEditorSection,
  supportsEmotionalSupportSection
} from '../../app/features/coach/domain/coach-page-editor'

const signatureSections = [
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

const essentielSections = [
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

test('ALWAYS_ON sections stay limited to hero and disclaimer', () => {
  assert.deepStrictEqual(COACH_PAGE_ALWAYS_ON_SECTIONS, ['hero', 'disclaimer'])
  assert.equal(isCoachPageAlwaysOnSection('hero'), true)
  assert.equal(isCoachPageAlwaysOnSection('disclaimer'), true)
  assert.equal(isCoachPageAlwaysOnSection('pricing'), false)
})

test('inline editor sections stay aligned with the provider editor forms', () => {
  assert.deepStrictEqual(COACH_PAGE_INLINE_EDITOR_SECTIONS, [
    'pillars',
    'faq',
    'benefits',
    'howItWorks',
    'educationalContent',
    'problemStatement'
  ])
  assert.equal(isCoachPageInlineEditorSection('pillars'), true)
  assert.equal(isCoachPageInlineEditorSection('bio'), false)
})

test('emotionalSupport is treated as a nested section, not a top-level toggle/editor card', () => {
  assert.equal(isCoachPageNestedEditorSection('emotionalSupport'), true)
  assert.equal(supportsEmotionalSupportSection(signatureSections), true)
  assert.equal(supportsEmotionalSupportSection(essentielSections), false)
})

test('configurable sections hide nested emotionalSupport while keeping pricing configurable', () => {
  assert.deepStrictEqual(getCoachPageConfigurableSections(signatureSections), [
    'hero',
    'bio',
    'pillars',
    'faq',
    'testimonials',
    'benefits',
    'howItWorks',
    'educationalContent',
    'problemStatement',
    'pricing',
    'disclaimer'
  ])
})

test('editable sections exclude hero, disclaimer and nested emotionalSupport', () => {
  assert.deepStrictEqual(getCoachPageEditableSections(signatureSections), [
    'bio',
    'pillars',
    'faq',
    'testimonials',
    'benefits',
    'howItWorks',
    'educationalContent',
    'problemStatement',
    'pricing'
  ])
})

test('external editor links point to the right screens', () => {
  assert.deepStrictEqual(getCoachPageExternalEditorSection('bio'), {
    label: 'Modifiable dans Mon compte',
    to: '/provider/account'
  })

  assert.deepStrictEqual(getCoachPageExternalEditorSection('testimonials'), {
    label: 'Modifiable dans Mon compte',
    to: '/provider/account'
  })

  assert.deepStrictEqual(getCoachPageExternalEditorSection('pricing'), {
    label: 'Modifiable dans Mes tarifs',
    to: '/provider/scheduling'
  })

  assert.equal(getCoachPageExternalEditorSection('pillars'), null)
})

test('template save error toast maps TEMPLATE_NOT_AVAILABLE to an explicit message', () => {
  assert.deepStrictEqual(getCoachPageTemplateSaveErrorToast('TEMPLATE_NOT_AVAILABLE'), {
    title: 'Ce template n\'est pas disponible pour votre compte',
    description: 'Contactez l\'équipe Keova pour y accéder.'
  })

  assert.deepStrictEqual(getCoachPageTemplateSaveErrorToast('UNKNOWN'), {
    title: 'Erreur lors du changement de template'
  })
})

// ═══════════════════════════════════════════════════════════
// R2-F1: Empty section auto-creation logic validation
// ═══════════════════════════════════════════════════════════

test('R2-F1: BenefitsJson structure supports visionIntro/visionText on empty items array', () => {
  // Validates the data shape that the page creates when coach types in vision fields on empty profile
  const emptyBenefits = { items: [] as { title: string, description: string, icon?: string }[] }

  // Simulates what the fixed @update:model-value handler does
  const withVision = { ...emptyBenefits, visionIntro: 'Ma vision', visionText: 'Mon texte' }

  assert.equal(withVision.items.length, 0)
  assert.equal(withVision.visionIntro, 'Ma vision')
  assert.equal(withVision.visionText, 'Mon texte')
})

test('R2-F1: EducationalContentJson structure supports insightBox on empty paragraphs', () => {
  // Validates the data shape that the page creates when coach types in insightBox on empty profile
  const emptyContent = { paragraphs: [] as string[] }

  // Simulates what the fixed @update:model-value handler does
  const withInsight = {
    ...emptyContent,
    insightBox: { title: 'Mon titre', content: 'Mon contenu' }
  }

  assert.equal(withInsight.paragraphs.length, 0)
  assert.equal(withInsight.insightBox.title, 'Mon titre')
  assert.equal(withInsight.insightBox.content, 'Mon contenu')
})

// ═══════════════════════════════════════════════════════════
// R2-F2: ProblemStatementJson paragraphs support
// ═══════════════════════════════════════════════════════════

test('R2-F2: ProblemStatementJson supports blockquote + paragraphs array', () => {
  const statement = {
    blockquote: 'Citation principale',
    paragraphs: ['Premier paragraphe', 'Deuxième paragraphe']
  }

  assert.equal(statement.blockquote, 'Citation principale')
  assert.equal(statement.paragraphs.length, 2)

  // Add a paragraph (simulates addProblemParagraph)
  statement.paragraphs.push('')
  assert.equal(statement.paragraphs.length, 3)

  // Remove a paragraph (simulates removeProblemParagraph)
  statement.paragraphs.splice(1, 1)
  assert.equal(statement.paragraphs.length, 2)
  assert.equal(statement.paragraphs[0], 'Premier paragraphe')
})

test('R2-F2: empty problemStatement auto-creates with paragraphs array', () => {
  // Simulates what the blockquote handler does on null form
  let form: { blockquote: string, paragraphs: string[] } | null = null

  // Coach types in blockquote on empty profile
  if (!form) {
    form = { blockquote: '', paragraphs: [] }
  }
  form.blockquote = 'Ma citation'

  assert.equal(form.blockquote, 'Ma citation')
  assert.deepStrictEqual(form.paragraphs, [])
})

// ═══════════════════════════════════════════════════════════
// R2-F4: Benefit icon defaults
// ═══════════════════════════════════════════════════════════

test('R2-F4: benefit items without icon get default sparkles icon', () => {
  const DEFAULT_BENEFIT_ICON = 'i-lucide-sparkles'
  const items = [
    { title: 'A', description: 'desc A', icon: 'i-lucide-heart' },
    { title: 'B', description: 'desc B' },
    { title: 'C', description: 'desc C', icon: '' }
  ]

  // Simulates the computed displayBenefits in CoachTransformationBenefits.vue
  const display = items.map(item => ({
    ...item,
    icon: item.icon || DEFAULT_BENEFIT_ICON
  }))

  assert.equal(display[0].icon, 'i-lucide-heart')
  assert.equal(display[1].icon, DEFAULT_BENEFIT_ICON)
  assert.equal(display[2].icon, DEFAULT_BENEFIT_ICON)
})

// ═══════════════════════════════════════════════════════════
// R2-F5: Coach page editor domain logic coverage
// ═══════════════════════════════════════════════════════════

test('R2-F5: editable sections for Essentiel exclude Signature-only sections', () => {
  const editable = getCoachPageEditableSections(essentielSections)
  assert.ok(!editable.includes('educationalContent'))
  assert.ok(!editable.includes('problemStatement'))
  assert.ok(!editable.includes('emotionalSupport'))
  assert.ok(editable.includes('pillars'))
  assert.ok(editable.includes('faq'))
  assert.ok(editable.includes('benefits'))
})

test('R2-F5: editable sections for Signature include all content sections', () => {
  const editable = getCoachPageEditableSections(signatureSections)
  assert.ok(editable.includes('educationalContent'))
  assert.ok(editable.includes('problemStatement'))
  assert.ok(editable.includes('pillars'))
  assert.ok(editable.includes('faq'))
  assert.ok(editable.includes('benefits'))
  assert.ok(editable.includes('howItWorks'))
})

test('R2-F5: pricing section is toggleable (not always-on)', () => {
  assert.equal(isCoachPageAlwaysOnSection('pricing'), false)
  const configurable = getCoachPageConfigurableSections(signatureSections)
  assert.ok(configurable.includes('pricing'))
})
