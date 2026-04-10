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
