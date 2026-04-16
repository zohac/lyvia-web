import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

// Tests run from compiled .tmp/test-dist/ — resolve from process.cwd() (/app)
const appRoot = path.resolve(process.cwd(), 'app')

function readFile(relativePath: string): string {
  return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
}

describe('YC2.1 — CoachPageSignature wiring (F1)', () => {
  test('CoachPageSignature.vue file exists', () => {
    const filePath = path.join(appRoot, 'components/templates/coach-pages/CoachPageSignature.vue')
    assert.ok(fs.existsSync(filePath), 'CoachPageSignature.vue should exist')
  })

  test('CoachPageSignature receives coachProfile as explicit prop', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    assert.ok(
      /coachProfile:\s*PublicProviderProfile\s*\|\s*null/.test(content),
      'Signature must declare coachProfile prop typed as PublicProviderProfile | null'
    )
  })

  test('CoachPageSignature does NOT call useNuxtData (only props)', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    // Strip comments so the rule "no useNuxtData" applies to code only
    const codeOnly = content
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
    assert.ok(
      !/useNuxtData\s*[<(]/.test(codeOnly),
      'Signature must not call useNuxtData — it must receive profile as explicit prop'
    )
  })

  test('CoachPublicPageTemplate delegates rendering with explicit coach-profile prop', () => {
    const content = readFile('components/templates/CoachPublicPageTemplate.vue')
    // YC2.2: rendering is now delegated via useCoachPageTemplate (dynamic
    // component resolution). The thin loader must still pass the profile
    // explicitly, whether via <CoachPageSignature> or <component :is="...">.
    assert.ok(
      content.includes('useCoachPageTemplate') || content.includes('CoachPageSignature'),
      'CoachPublicPageTemplate must delegate rendering (via useCoachPageTemplate or direct Signature mount)'
    )
    assert.ok(
      /:coach-profile=/.test(content),
      'CoachPublicPageTemplate must pass coach-profile prop explicitly to the resolved template'
    )
  })

  test('CoachPublicPageTemplate is a thin data loader (no big inline template sections)', () => {
    const content = readFile('components/templates/CoachPublicPageTemplate.vue')
    // Ensure no huge <section> hero/pricing blocks remain inline in the loader.
    // The file should be small (< 90 lines) now that rendering is delegated.
    const lineCount = content.split('\n').length
    assert.ok(
      lineCount < 100,
      `CoachPublicPageTemplate should be a thin loader (< 100 lines), got ${lineCount}`
    )
  })
})

describe('YC2.1 — P-Y3 visibility rule (F2)', () => {
  test('Signature implements toggle AND content non-empty gate', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    // show* computeds must exist for configurable sections
    const gates = [
      'showProblemStatement',
      'showBenefits',
      'showPillars',
      'showHowItWorks',
      'showEducationalContent',
      'showFaq'
    ]
    for (const gate of gates) {
      assert.ok(
        content.includes(gate),
        `Signature must define ${gate} visibility computed`
      )
    }
  })

  test('Signature delegates visibility rule to useCoachSectionVisibility (YC2.3 DRY)', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    // Since YC2.3, the P-Y3 rule is factorised in the composable and reused
    // by Signature + Essentiel. The template must import and call it.
    assert.ok(
      content.includes('useCoachSectionVisibility'),
      'Signature must import useCoachSectionVisibility composable'
    )
    assert.ok(
      /useCoachSectionVisibility\(\s*\(\)\s*=>\s*props\.coachProfile\s*\)/.test(content),
      'Signature must call useCoachSectionVisibility with a getter on props.coachProfile'
    )
  })

  test('CoachTransformationBenefits organism has NO DEFAULT fallback array', () => {
    const content = readFile('components/organisms/CoachTransformationBenefits.vue')
    assert.ok(
      !/const\s+DEFAULT_BENEFITS\s*=/.test(content),
      'Benefits organism must not define DEFAULT_BENEFITS — visibility is driven by template'
    )
  })

  test('CoachEducationalContent organism has NO DEFAULT fallback', () => {
    const content = readFile('components/organisms/CoachEducationalContent.vue')
    assert.ok(
      !/const\s+DEFAULT_PARAGRAPHS\s*=/.test(content),
      'Educational organism must not define DEFAULT_PARAGRAPHS'
    )
    assert.ok(
      !/const\s+DEFAULT_INSIGHT\s*=/.test(content),
      'Educational organism must not define DEFAULT_INSIGHT'
    )
  })

  test('CoachHowItWorks organism has NO DEFAULT steps fallback', () => {
    const content = readFile('components/organisms/CoachHowItWorks.vue')
    assert.ok(
      !/const\s+DEFAULT_STEPS\s*=/.test(content),
      'HowItWorks organism must not define DEFAULT_STEPS'
    )
  })
})

describe('YC2.1 — CoachPillars extraction (F3)', () => {
  test('CoachPillars.vue organism file exists', () => {
    const filePath = path.join(appRoot, 'components/organisms/CoachPillars.vue')
    assert.ok(fs.existsSync(filePath), 'CoachPillars.vue should exist as extracted organism')
  })

  test('CoachPillars consumes CoachPillarsProps', () => {
    const content = readFile('components/organisms/CoachPillars.vue')
    assert.ok(
      content.includes('CoachPillarsProps'),
      'CoachPillars must define props via CoachPillarsProps interface'
    )
  })

  test('CoachPageSignature imports and uses CoachPillars', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    assert.ok(
      content.includes('import CoachPillars from \'~/components/organisms/CoachPillars.vue\''),
      'Signature must import CoachPillars'
    )
    assert.ok(
      /<CoachPillars[\s\S]*?:pillars=/.test(content),
      'Signature must render <CoachPillars :pillars="..."/>'
    )
  })

  test('CoachPageSignature does NOT inline pillars rendering', () => {
    const content = readFile('components/templates/coach-pages/CoachPageSignature.vue')
    // After extraction the Signature must not contain the inline pillar-card markup
    const inlinePillarsCount = (content.match(/pillarItems/g) ?? []).length
    assert.equal(
      inlinePillarsCount,
      0,
      'Signature must not iterate pillarItems inline — use <CoachPillars> instead'
    )
  })
})

describe('YC2.1 — no hardcoded Sophie fallbacks (AC-5)', () => {
  const COACH_PAGE_FILES = [
    'components/templates/CoachPublicPageTemplate.vue',
    'components/templates/coach-pages/CoachPageSignature.vue',
    'components/organisms/CoachPillars.vue',
    'components/organisms/CoachTransformationBenefits.vue',
    'components/organisms/CoachEducationalContent.vue',
    'components/organisms/CoachHowItWorks.vue',
    'components/organisms/CoachHeroProfile.vue',
    'components/organisms/CoachPricing.vue'
  ]

  test('No hardcoded testimonials (Anne M., Francoise L., Valerie D.)', () => {
    for (const file of COACH_PAGE_FILES) {
      const content = readFile(file)
      assert.ok(!content.includes('Anne M.'), `${file} must not contain "Anne M." testimonial`)
      assert.ok(!content.includes('Francoise L.'), `${file} must not contain "Francoise L." testimonial`)
      assert.ok(!content.includes('Valerie D.'), `${file} must not contain "Valerie D." testimonial`)
    }
  })

  test('No hardcoded Sophie name in rendered markup of coach page components', () => {
    // Note: CoachPageSignature.vue may reference "Sophie" only in the doc header comment,
    // not in the <script> logic or <template> markup. We assert no Sophie string
    // leaks into <template> sections (the rendered output).
    for (const file of COACH_PAGE_FILES) {
      const content = readFile(file)
      // Extract <template>...</template> block
      const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/)
      if (templateMatch) {
        const templateBlock = templateMatch[1] ?? ''
        assert.ok(
          !templateBlock.includes('Sophie'),
          `${file} <template> block must not contain "Sophie"`
        )
      }
    }
  })
})

describe('YC2.1 — CoachHowItWorks type cleanup', () => {
  test('CoachHowItWorksProps no longer requires discoveryDurationMinutes', () => {
    const content = readFile('features/coach/types/coach-page.types.ts')
    // The interface should not declare discoveryDurationMinutes anymore
    const howItWorksBlock = content.match(/export interface CoachHowItWorksProps\s*\{([\s\S]*?)\}/)
    assert.ok(howItWorksBlock, 'CoachHowItWorksProps interface must exist')
    const block = howItWorksBlock![1] ?? ''
    assert.ok(
      !block.includes('discoveryDurationMinutes'),
      'CoachHowItWorksProps must not require discoveryDurationMinutes — dead prop'
    )
  })
})
