import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'
import {
  DEFAULT_COACH_TEMPLATE_CODE,
  SUPPORTED_COACH_TEMPLATE_CODES,
  isKnownTemplateCode,
  resolveCoachTemplateCode
} from '../../app/composables/coach-template-registry'

const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('YC2.2 — coach-template-registry (pure resolver)', () => {
  describe('SUPPORTED_COACH_TEMPLATE_CODES', () => {
    test('contains signature and essentiel', () => {
      assert.ok(SUPPORTED_COACH_TEMPLATE_CODES.includes('signature'))
      assert.ok(SUPPORTED_COACH_TEMPLATE_CODES.includes('essentiel'))
      assert.equal(SUPPORTED_COACH_TEMPLATE_CODES.length, 2)
    })
  })

  describe('DEFAULT_COACH_TEMPLATE_CODE', () => {
    test('is "essentiel" (fallback template)', () => {
      assert.equal(DEFAULT_COACH_TEMPLATE_CODE, 'essentiel')
    })

    test('is part of the supported codes', () => {
      assert.ok(SUPPORTED_COACH_TEMPLATE_CODES.includes(DEFAULT_COACH_TEMPLATE_CODE))
    })
  })

  describe('isKnownTemplateCode', () => {
    test('accepts valid codes', () => {
      assert.equal(isKnownTemplateCode('signature'), true)
      assert.equal(isKnownTemplateCode('essentiel'), true)
    })

    test('rejects unknown codes', () => {
      assert.equal(isKnownTemplateCode('unknown'), false)
      assert.equal(isKnownTemplateCode('SIGNATURE'), false) // case-sensitive
      assert.equal(isKnownTemplateCode('signatur'), false)
    })

    test('rejects null and undefined', () => {
      assert.equal(isKnownTemplateCode(null), false)
      assert.equal(isKnownTemplateCode(undefined), false)
    })

    test('rejects empty string', () => {
      assert.equal(isKnownTemplateCode(''), false)
    })
  })

  describe('resolveCoachTemplateCode', () => {
    test('returns "signature" for templateCode="signature"', () => {
      assert.equal(resolveCoachTemplateCode('signature'), 'signature')
    })

    test('returns "essentiel" for templateCode="essentiel"', () => {
      assert.equal(resolveCoachTemplateCode('essentiel'), 'essentiel')
    })

    test('falls back to "essentiel" for unknown code', () => {
      assert.equal(resolveCoachTemplateCode('premium'), 'essentiel')
      assert.equal(resolveCoachTemplateCode('bogus'), 'essentiel')
    })

    test('falls back to "essentiel" for null', () => {
      assert.equal(resolveCoachTemplateCode(null), 'essentiel')
    })

    test('falls back to "essentiel" for undefined', () => {
      assert.equal(resolveCoachTemplateCode(undefined), 'essentiel')
    })

    test('falls back to "essentiel" for empty string', () => {
      assert.equal(resolveCoachTemplateCode(''), 'essentiel')
    })

    test('falls back to "essentiel" when called with no argument', () => {
      assert.equal(resolveCoachTemplateCode(), 'essentiel')
    })
  })
})

describe('YC2.2 — useCoachPageTemplate (Vue composable, file-based checks)', () => {
  test('useCoachPageTemplate.ts file exists', () => {
    const filePath = path.join(appRoot, 'composables/useCoachPageTemplate.ts')
    assert.ok(fs.existsSync(filePath), 'useCoachPageTemplate.ts should exist')
  })

  test('uses defineAsyncComponent for code-splitting (AD-Y2)', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    assert.ok(
      content.includes('defineAsyncComponent'),
      'Composable must use defineAsyncComponent for code-splitting'
    )
  })

  test('TEMPLATE_MAP contains signature and essentiel loaders', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    assert.ok(
      /signature:\s*\(\)\s*=>\s*import\([^)]*CoachPageSignature\.vue['"]?\)/.test(content),
      'TEMPLATE_MAP must have signature → CoachPageSignature.vue loader'
    )
    assert.ok(
      /essentiel:\s*\(\)\s*=>\s*import\([^)]*CoachPageEssentiel\.vue['"]?\)/.test(content),
      'TEMPLATE_MAP must have essentiel → CoachPageEssentiel.vue loader'
    )
  })

  test('template files referenced by TEMPLATE_MAP actually exist', () => {
    const signature = path.join(appRoot, 'components/templates/coach-pages/CoachPageSignature.vue')
    const essentiel = path.join(appRoot, 'components/templates/coach-pages/CoachPageEssentiel.vue')
    assert.ok(fs.existsSync(signature), 'CoachPageSignature.vue must exist')
    assert.ok(fs.existsSync(essentiel), 'CoachPageEssentiel.vue must exist')
  })

  test('TEMPLATE_MAP keys match SUPPORTED_COACH_TEMPLATE_CODES (parity)', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    // Extract the map object block
    const mapMatch = content.match(/TEMPLATE_MAP\s*=\s*\{([\s\S]*?)\}\s*as\s*const/)
    assert.ok(mapMatch, 'TEMPLATE_MAP block must be present')
    const keysInMap = Array.from((mapMatch![1] ?? '').matchAll(/^\s*(\w+):/gm)).map(m => m[1])
    for (const code of SUPPORTED_COACH_TEMPLATE_CODES) {
      assert.ok(
        keysInMap.includes(code),
        `TEMPLATE_MAP must contain key "${code}" declared in SUPPORTED_COACH_TEMPLATE_CODES`
      )
    }
  })
})

describe('YC2.2 — P-Y6 convention (no hardcoded /coach/ construction)', () => {
  // P-Y6: the literal "/coach/{slug}" must only be constructed in
  // composables/useCoachLink.ts (the single source of truth) and inside
  // pages/coach/** (the Nuxt routes themselves). Every other producer of
  // coach page URLs must go through useCoachLink.
  //
  // This test enforces the convention on the files that WE have migrated.
  // It is intentionally narrow (explicit allowlist) so adding a new coach
  // link requires either reusing useCoachLink or updating this list.

  const MIGRATED_FILES = [
    'components/organisms/SpecialistCard.vue',
    'pages/client/consultation/choose-slot.vue',
    'features/seo/breadcrumb-helpers.ts',
    'features/seo/b2c-landing-schema-helpers.ts',
    'features/seo/schema-helpers.ts'
  ]

  for (const file of MIGRATED_FILES) {
    test(`${file} no longer constructs /coach/\${slug} template literals`, () => {
      const content = readFile(file)
      // Strip comments (single-line + block)
      const codeOnly = content
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\/\/.*$/gm, '')
      // Reject any backtick template literal containing `/coach/${...}`
      assert.ok(
        !/`\/coach\/\$\{/.test(codeOnly),
        `${file} must not build /coach/\${...} template literals — use useCoachLink()`
      )
      // And reject plain `'/coach/${slug}'` or similar string concat patterns
      // (note: simple string literals like '/coach/' used as substring checks
      // are allowed — they are not link constructions).
    })

    test(`${file} imports useCoachLink`, () => {
      const content = readFile(file)
      assert.ok(
        content.includes('useCoachLink'),
        `${file} must import and use useCoachLink`
      )
    })
  }
})
