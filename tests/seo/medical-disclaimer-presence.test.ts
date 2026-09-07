import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('MedicalDisclaimer presence (U1.4a)', () => {
  test('MedicalDisclaimer component file exists', () => {
    const filePath = path.join(appRoot, 'components/atoms/MedicalDisclaimer.vue')
    assert.ok(fs.existsSync(filePath), 'MedicalDisclaimer.vue should exist')
  })

  test('MedicalDisclaimer contains the required YMYL text', () => {
    const content = readFile('components/atoms/MedicalDisclaimer.vue')
    assert.ok(
      content.includes('ne se substitue pas'),
      'Should contain the medical disclaimer text'
    )
  })

  test('CoachPageSignature (rendered template) includes MedicalDisclaimer', () => {
    // YC2.1: rendering is now in CoachPageSignature.vue.
    // CoachPublicPageTemplate.vue became a thin data loader.
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Coach profile template (Signature) should include MedicalDisclaimer'
    )
  })

  test('booking platform page includes MedicalDisclaimer', () => {
    const content = readFile('pages/coach/[slug]/onboarding/discovery.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Booking platform page should include MedicalDisclaimer'
    )
  })

  test('booking white-label page includes MedicalDisclaimer', () => {
    const content = readFile('pages/onboarding/discovery.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Booking white-label page should include MedicalDisclaimer'
    )
  })

  test('CoachPageEssentiel (rendered template) includes MedicalDisclaimer (FR-Y9)', () => {
    const content = readFile('components/templates/coach-pages/CoachPageEssentiel.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Coach profile template (Essentiel) should include MedicalDisclaimer'
    )
  })

  test('CoachPageVisuel (rendered template) includes MedicalDisclaimer (FR-Y9)', () => {
    const content = readFile('components/templates/coach-pages/CoachPageVisuel.vue')
    assert.ok(
      content.includes('MedicalDisclaimer'),
      'Coach profile template (Visuel) should include MedicalDisclaimer'
    )
  })

  // Story 0-22 — FR-Y9 : disclaimer obligatoire sur chaque article du blog
  test('article page (/articles/[...slug]) includes MedicalDisclaimer (FR-Y9)', () => {
    const content = readFile('pages/articles/[...slug].vue')
    assert.ok(
      content.includes('AtomsMedicalDisclaimer') || content.includes('MedicalDisclaimer'),
      'Article page should include MedicalDisclaimer — YMYL santé (FR-Y9)'
    )
  })

  test('article page MedicalDisclaimer is rendered INSIDE the article body (not only imported)', () => {
    const content = readFile('pages/articles/[...slug].vue')
    // Vérifie que le composant est bien utilisé dans le template (pas juste importé au script)
    assert.match(
      content,
      /<AtomsMedicalDisclaimer\s*\/>|<atoms-medical-disclaimer\s*\/>/
    )
  })
})
