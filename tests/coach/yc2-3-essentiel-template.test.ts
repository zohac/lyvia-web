import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

function readTemplateBlock(relativePath: string): string {
  const content = readFile(relativePath)
  // Greedy match: the outer <template> may contain <template #header> slots
  // whose closing </template> would prematurely end a non-greedy capture.
  // Use greedy to reach the LAST </template>.
  const match = content.match(/<template>([\s\S]*)<\/template>/)
  return match?.[1] ?? ''
}

const ESSENTIEL_PATH = 'components/templates/coach-pages/CoachPageEssentiel.vue'
const VISIBILITY_COMPOSABLE = 'composables/useCoachSectionVisibility.ts'

describe('YC2.3 — useCoachSectionVisibility composable (DRY factorisation)', () => {
  test('composable file exists', () => {
    const full = path.join(appRoot, VISIBILITY_COMPOSABLE)
    assert.ok(fs.existsSync(full), 'useCoachSectionVisibility.ts must exist for DRY factorisation')
  })

  test('composable exports useCoachSectionVisibility function', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    assert.ok(
      /export\s+function\s+useCoachSectionVisibility/.test(content),
      'composable must export useCoachSectionVisibility as named function'
    )
  })

  test('composable implements the P-Y3 rule (toggle AND content non-empty)', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    // Each show* computed must combine isToggleOn + has*
    assert.ok(
      /showBenefits\s*=\s*computed\(\(\)\s*=>\s*isToggleOn\('benefits'\)\s*&&\s*hasBenefits\.value\)/.test(content),
      'showBenefits must combine isToggleOn("benefits") && hasBenefits.value'
    )
    assert.ok(
      /showPillars\s*=\s*computed\(\(\)\s*=>\s*isToggleOn\('pillars'\)\s*&&\s*hasPillars\.value\)/.test(content),
      'showPillars must combine isToggleOn("pillars") && hasPillars.value'
    )
    assert.ok(
      /showHowItWorks\s*=\s*computed\(\(\)\s*=>\s*isToggleOn\('howItWorks'\)\s*&&\s*hasHowItWorks\.value\)/.test(content),
      'showHowItWorks must combine isToggleOn("howItWorks") && hasHowItWorks.value'
    )
    assert.ok(
      /showFaq\s*=\s*computed\(\(\)\s*=>\s*isToggleOn\('faq'\)\s*&&\s*hasFaq\.value\)/.test(content),
      'showFaq must combine isToggleOn("faq") && hasFaq.value'
    )
  })

  test('composable returns show.benefits / show.pillars / show.faq etc.', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    for (const section of ['benefits', 'pillars', 'howItWorks', 'educationalContent', 'problemStatement', 'faq', 'miniTestimonial', 'testimonials']) {
      assert.ok(
        content.includes(`${section}:`),
        `composable public shape must expose "${section}" key`
      )
    }
  })

  test('composable isToggleOn treats missing toggle as true (default visible)', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    assert.ok(
      /if\s*\(\s*!config\s*\)\s*return\s+true/.test(content),
      'missing sectionsConfig must default to visible (return true)'
    )
    assert.ok(
      /config\[section\]\s*!==\s*false/.test(content),
      'toggle logic must compare strictly !== false (undefined === visible)'
    )
  })
})

describe('YC2.3 — CoachPageEssentiel wiring & props', () => {
  test('CoachPageEssentiel.vue exists', () => {
    assert.ok(fs.existsSync(path.join(appRoot, ESSENTIEL_PATH)), 'CoachPageEssentiel.vue must exist')
  })

  test('CoachPageEssentiel receives coachProfile as explicit prop', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /coachProfile:\s*PublicProviderProfile\s*\|\s*null/.test(content),
      'Essentiel must declare coachProfile prop typed as PublicProviderProfile | null'
    )
  })

  test('CoachPageEssentiel does NOT call useNuxtData (props only)', () => {
    const content = readFile(ESSENTIEL_PATH)
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.ok(
      !/useNuxtData\s*[<(]/.test(codeOnly),
      'Essentiel must not call useNuxtData — receive profile as explicit prop'
    )
  })

  test('CoachPageEssentiel has the same public prop signature as Signature (interchangeable)', () => {
    const content = readFile(ESSENTIEL_PATH)
    for (const prop of ['tenant', 'ctaTo', 'coachProfile', 'publicPrograms', 'consultationPlans', 'isAuthenticated', 'currentPath']) {
      assert.ok(
        new RegExp(`${prop}:`).test(content),
        `Essentiel must declare prop "${prop}" to be interchangeable with Signature`
      )
    }
  })
})

describe('YC2.3 — CoachPageEssentiel uses the shared visibility composable', () => {
  test('Essentiel imports useCoachSectionVisibility', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      content.includes('useCoachSectionVisibility'),
      'Essentiel must import useCoachSectionVisibility (DRY factorisation)'
    )
  })

  test('Essentiel calls composable with getter on props.coachProfile', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /useCoachSectionVisibility\(\s*\(\)\s*=>\s*props\.coachProfile\s*\)/.test(content),
      'Essentiel must call composable with reactive getter (() => props.coachProfile)'
    )
  })

  test('Essentiel does NOT redefine its own hasBenefits / hasPillars computeds (DRY)', () => {
    const content = readFile(ESSENTIEL_PATH)
    // The composable provides these — the template should not re-declare them.
    assert.ok(
      !/const\s+hasBenefits\s*=\s*computed/.test(content),
      'Essentiel must not re-declare hasBenefits — use composable'
    )
    assert.ok(
      !/const\s+hasPillars\s*=\s*computed/.test(content),
      'Essentiel must not re-declare hasPillars — use composable'
    )
    assert.ok(
      !/const\s+hasHowItWorks\s*=\s*computed/.test(content),
      'Essentiel must not re-declare hasHowItWorks — use composable'
    )
  })
})

describe('YC2.3 — Essentiel excludes Signature-only sections (AC-1.4)', () => {
  test('Essentiel does not render problemStatement (Signature exclusive)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      !/problemStatement/.test(template),
      'Essentiel must not render problemStatement — Signature exclusive section'
    )
  })

  test('Essentiel does not render educationalContent (Signature exclusive)', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      !/CoachEducationalContent/.test(content),
      'Essentiel must not import nor render CoachEducationalContent'
    )
    assert.ok(
      !/educationalContentJson/.test(content),
      'Essentiel must not reference educationalContentJson'
    )
  })

  test('Essentiel does not render miniTestimonial dispositif', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      !/showMiniTestimonial/.test(template),
      'Essentiel must not render the mini-testimonial dispositif'
    )
  })

  test('Essentiel does not use lead capture / exit intent / announcement bar', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(!/CoachLeadCapture/.test(content), 'Essentiel must not import CoachLeadCapture')
    assert.ok(!/useExitIntent/.test(content), 'Essentiel must not use useExitIntent')
    assert.ok(!/CoachAnnouncementBar/.test(content), 'Essentiel must not import CoachAnnouncementBar')
  })
})

describe('YC2.3 — Essentiel renders supported sections via organisms (DRY reuse)', () => {
  test('Essentiel imports and reuses the same organisms as Signature', () => {
    const content = readFile(ESSENTIEL_PATH)
    for (const organism of ['CoachHeroProfile', 'CoachTransformationBenefits', 'CoachPillars', 'CoachHowItWorks', 'CoachTestimonials', 'CoachPricing']) {
      assert.ok(
        content.includes(organism),
        `Essentiel must reuse <${organism}> organism (DRY)`
      )
    }
  })

  test('Essentiel gates Benefits on show.benefits', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /v-if="showBenefits"/.test(template),
      'Benefits section must be gated on showBenefits'
    )
  })

  test('Essentiel gates Pillars on show.pillars', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /CoachPillars[\s\S]{0,200}v-if="showPillars"|v-if="showPillars"[\s\S]{0,200}CoachPillars/.test(template),
      'Pillars section must be gated on showPillars'
    )
  })

  test('Essentiel gates HowItWorks on show.howItWorks', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /v-if="showHowItWorks"/.test(template),
      'HowItWorks section must be gated on showHowItWorks'
    )
  })

  test('Essentiel gates Testimonials on show.testimonials', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /v-if="showTestimonials"/.test(template),
      'Testimonials section must be gated on showTestimonials'
    )
  })

  test('Essentiel gates FAQ on show.faq', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /v-if="showFaq"/.test(template),
      'FAQ section must be gated on showFaq'
    )
  })
})

describe('YC2.3 — Essentiel is visually distinct (no dark sections) & always-on sections', () => {
  test('Essentiel has NO dark background section (differentiation vs Signature)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // Signature uses var(--color-crepuscule-950) as full-section bg (dark).
    // Essentiel stays fully light — no dark section background.
    assert.ok(
      !/bg-\[var\(--color-crepuscule-950\)\]/.test(template),
      'Essentiel must not use crepuscule-950 as a section background — stay lumineux'
    )
  })

  test('Essentiel uses restrained H2 scale (text-3xl, not text-5xl)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // Signature uses text-5xl on H2 headers; Essentiel caps at text-3xl / text-4xl.
    assert.ok(
      !/<h2[^>]*text-5xl/.test(template),
      'Essentiel must not use text-5xl on H2 — keep restrained scale'
    )
  })

  test('Hero is always rendered (never gated)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // No v-if on CoachHeroProfile
    assert.ok(
      /<CoachHeroProfile\s+v-bind="heroProps"\s*\/>/.test(template),
      'Hero must always render without v-if gate'
    )
  })

  test('Medical disclaimer is always rendered (FR-Y9)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /<AtomsMedicalDisclaimer\s*\/>/.test(template),
      'MedicalDisclaimer must always render on Essentiel'
    )
    // No v-if on disclaimer
    assert.ok(
      !/<AtomsMedicalDisclaimer[^/]*v-if/.test(template),
      'Disclaimer must NOT be gated by v-if (FR-Y9: non-désactivable)'
    )
  })

  test('Final CTA is always rendered (always-on per AC-1)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /data-final-cta/.test(template),
      'Essentiel must render a final CTA (data-final-cta marker)'
    )
  })
})

describe('YC2.3 — neutral fallbacks (FR-Y18, AC-5)', () => {
  test('Essentiel template block has NO Sophie/Anne M./Francoise L./Valerie D. references', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    for (const banned of ['Sophie', 'sophie', 'jouan', 'Anne M.', 'Francoise L.', 'Valerie D.']) {
      assert.ok(
        !template.includes(banned),
        `Essentiel template block must not contain "${banned}"`
      )
    }
  })

  test('Essentiel script block has NO Sophie references', () => {
    const content = readFile(ESSENTIEL_PATH)
    const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/)
    const script = scriptMatch?.[1] ?? ''
    for (const banned of ['jouan']) {
      assert.ok(
        !script.toLowerCase().includes(banned),
        `Essentiel script must not contain "${banned}"`
      )
    }
  })

  test('Essentiel fallback bio text is generic (no coach name)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // Fallback must contain "Spécialiste en accompagnement" generic phrasing,
    // without mentioning any specific coach name.
    assert.ok(
      /Spécialiste en accompagnement bien-être/.test(template),
      'Essentiel must have a neutral generic bio fallback'
    )
  })
})

describe('YC2.3 — useCoachPageTemplate resolution', () => {
  test('useCoachPageTemplate registers the "essentiel" code in its TEMPLATE_MAP', () => {
    const content = readFile('composables/useCoachPageTemplate.ts')
    assert.ok(
      /essentiel:\s*\(\)\s*=>\s*import\('~\/components\/templates\/coach-pages\/CoachPageEssentiel\.vue'\)/.test(content),
      'TEMPLATE_MAP must resolve "essentiel" to CoachPageEssentiel.vue'
    )
  })
})
