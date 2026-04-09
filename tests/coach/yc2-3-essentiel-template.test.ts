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
const ESSENTIEL_HEADER_PATH = 'components/templates/coach-pages/essentiel/CoachEssentielHeader.vue'
const ESSENTIEL_HERO_PATH = 'components/templates/coach-pages/essentiel/CoachEssentielHero.vue'
const VISIBILITY_COMPOSABLE = 'composables/useCoachSectionVisibility.ts'
const PUBLIC_LAYOUT_PATH = 'layouts/public.vue'

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
  test('Essentiel imports and reuses the same body organisms as Signature', () => {
    const content = readFile(ESSENTIEL_PATH)
    // Note: YC2.3 iter 2 replaced CoachHeroProfile with CoachEssentielHero
    // for the top hero section. The body organisms are still shared.
    for (const organism of ['CoachTransformationBenefits', 'CoachPillars', 'CoachHowItWorks', 'CoachTestimonials', 'CoachPricing']) {
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
    // YC2.3 iter 2: Essentiel uses its own CoachEssentielHero component.
    assert.ok(
      /<CoachEssentielHero\s+v-bind="heroProps"\s*\/>/.test(template),
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

  test('Essentiel bio has NO generic fallback text (section hidden when empty)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // Bio section is gated by showBio — when empty, it's hidden, not filled with placeholder.
    assert.ok(
      !/Spécialiste en accompagnement bien-être, je propose/.test(template),
      'Essentiel must NOT have a generic bio fallback (section hidden when bio is empty)'
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

// =============================================================================
// YC2.3 iteration 2 — dedicated header & hero components for Essentiel
// =============================================================================

describe('YC2.3 iter 2 — public.vue layout supports hide-layout-header state', () => {
  test('public layout declares hide-layout-header useState', () => {
    const content = readFile(PUBLIC_LAYOUT_PATH)
    assert.ok(
      /useState\(['"]hide-layout-header['"]/.test(content),
      'public.vue must expose a hide-layout-header useState (parallel to hide-layout-footer)'
    )
  })

  test('public layout showHeader computed honours hide-layout-header state', () => {
    const content = readFile(PUBLIC_LAYOUT_PATH)
    assert.ok(
      /showHeader\s*=\s*computed/.test(content) && /!hideHeaderState\.value/.test(content),
      'showHeader computed must combine route meta with !hideHeaderState.value'
    )
  })
})

describe('YC2.3 iter 2 — CoachEssentielHeader component', () => {
  test('CoachEssentielHeader.vue exists in essentiel/ subfolder', () => {
    assert.ok(
      fs.existsSync(path.join(appRoot, ESSENTIEL_HEADER_PATH)),
      'CoachEssentielHeader.vue must exist under components/templates/coach-pages/essentiel/'
    )
  })

  test('CoachEssentielHeader is sticky full-width (not dock pill)', () => {
    const template = readTemplateBlock(ESSENTIEL_HEADER_PATH)
    // Must be sticky top-0 w-full
    assert.ok(
      /sticky\s+top-0/.test(template),
      'Header must be sticky top-0'
    )
    assert.ok(
      /w-full/.test(template),
      'Header must be full-width'
    )
    // Must NOT use the dock floating pill pattern in the template markup
    // (rounded-full + max-w-5xl together, or fixed edge-to-edge pattern).
    assert.ok(
      !/rounded-full[^"]*max-w-5xl/.test(template) && !/max-w-5xl[^"]*rounded-full/.test(template),
      'Header template must not replicate dock pill layout (rounded-full max-w-5xl)'
    )
    assert.ok(
      !/\bfixed\s+left-0\s+right-0/.test(template),
      'Header template must not use fixed left-0 right-0 (dock pattern)'
    )
  })

  test('CoachEssentielHeader has a burger menu with USlideover for mobile', () => {
    const content = readFile(ESSENTIEL_HEADER_PATH)
    assert.ok(
      /<USlideover/.test(content),
      'Mobile nav must use USlideover from Nuxt UI v4'
    )
    assert.ok(
      /i-lucide-menu/.test(content),
      'Burger button must use i-lucide-menu icon'
    )
  })

  test('CoachEssentielHeader CTA uses DS Secondary Solid (no raw bg/text classes)', () => {
    const content = readFile(ESSENTIEL_HEADER_PATH)
    // DS rule: every interactive button MUST use color/variant via keovaButton.
    // Raw bg-[var(--color-brand-accent)] / rounded-lg overrides are forbidden.
    assert.ok(
      !/rounded-lg[^"]*bg-\[var\(--color-brand-accent\)\]/.test(content)
      && !/bg-\[var\(--color-brand-accent\)\][^"]*rounded-lg/.test(content),
      'Header CTA must NOT raw-style bg + rounded — must use DS color/variant'
    )
    // Must declare the DS Secondary Solid CTA
    assert.ok(
      /color="secondary"[\s\S]{0,80}variant="solid"/.test(content)
      || /variant="solid"[\s\S]{0,80}color="secondary"/.test(content),
      'Header CTA must declare color="secondary" variant="solid" (DS keovaButton)'
    )
  })

  test('CoachEssentielHeader uses the Keova image logo', () => {
    const content = readFile(ESSENTIEL_HEADER_PATH)
    assert.ok(
      /keova-logo\.png/.test(content),
      'Essentiel header must use keova-logo.png image for brand zone'
    )
  })

  test('CoachEssentielHeader declares the expected props API', () => {
    const content = readFile(ESSENTIEL_HEADER_PATH)
    for (const prop of ['brandLabel', 'coachName', 'navLinks', 'ctaLabel', 'ctaTo']) {
      assert.ok(
        new RegExp(`${prop}:`).test(content),
        `Header must declare prop "${prop}"`
      )
    }
  })
})

describe('YC2.3 iter 2 — CoachEssentielHero component', () => {
  test('CoachEssentielHero.vue exists in essentiel/ subfolder', () => {
    assert.ok(
      fs.existsSync(path.join(appRoot, ESSENTIEL_HERO_PATH)),
      'CoachEssentielHero.vue must exist under components/templates/coach-pages/essentiel/'
    )
  })

  test('CoachEssentielHero uses CoachHeroProps (interchangeable API)', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    assert.ok(
      /defineProps<CoachHeroProps>/.test(content),
      'Hero must use the shared CoachHeroProps type (interchangeable with CoachHeroProfile)'
    )
  })

  test('CoachEssentielHero does NOT use organic blob border-radius (distinct from Signature)', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    // Signature uses `border-radius: 40% 60% 70% 30%` organic blob
    assert.ok(
      !/border-radius:\s*40%\s+60%\s+70%\s+30%/.test(content),
      'Essentiel hero must not replicate Signature organic blob border-radius'
    )
    assert.ok(
      !/hero-photo-shape/.test(content),
      'Essentiel hero must not use .hero-photo-shape class (Signature blob)'
    )
  })

  test('CoachEssentielHero photo container is rounded-2xl (DS-compliant)', () => {
    const template = readTemplateBlock(ESSENTIEL_HERO_PATH)
    assert.ok(
      /rounded-2xl/.test(template),
      'Hero photo card must use rounded-2xl (DS rule: rounded-3xl is forbidden)'
    )
    assert.ok(
      !/rounded-3xl/.test(template),
      'Hero must NOT use rounded-3xl — DS forbids it (use rounded-2xl)'
    )
  })

  test('CoachEssentielHero does NOT use dramatic clamp typography', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    // Signature hero uses clamp(2.5rem,6vw,4.5rem)
    assert.ok(
      !/clamp\(2\.5rem,\s*6vw,\s*4\.5rem\)/.test(content),
      'Essentiel hero must not use Signature clamp(2.5rem,6vw,4.5rem)'
    )
  })

  test('CoachEssentielHero does NOT use min-h-[100svh]', () => {
    const template = readTemplateBlock(ESSENTIEL_HERO_PATH)
    assert.ok(
      !/min-h-\[100svh\]/.test(template),
      'Essentiel hero template must not be fullscreen — use proportional py-20'
    )
  })

  test('CoachEssentielHero has a "Bonjour, je suis" humanised H1', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    assert.ok(
      /Bonjour, je suis/.test(content),
      'Hero H1 must use the humanised "Bonjour, je suis {firstName}" format'
    )
  })

  test('CoachEssentielHero has a secondary "En savoir plus" anchor link', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    assert.ok(
      /En savoir plus/.test(content),
      'Hero must provide the "En savoir plus" secondary anchor link'
    )
    assert.ok(
      /href="#qui-suis-je"/.test(content),
      'Hero secondary link must anchor to #qui-suis-je'
    )
  })

  test('CoachEssentielHero does NOT reference "SOPHIE" eyebrow pattern', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    // Signature hero eyebrow uses "{displayName} - EI" hardcoded.
    // Essentiel derives the eyebrow from props.specialties[0].
    assert.ok(
      !/-\s*EI/.test(content),
      'Essentiel hero eyebrow must not use "PRÉNOM NOM - EI" pattern'
    )
  })

  // YC2.3 follow-up — eyebrow is data-driven from specialties (not hardcoded)
  test('CoachEssentielHero eyebrow is derived from props.specialties (no hardcoded label)', () => {
    const template = readTemplateBlock(ESSENTIEL_HERO_PATH)
    assert.ok(
      !template.includes('Praticienne bien-être'),
      'Essentiel hero must not hardcode "Praticienne bien-être" — derive from specialties'
    )
    const content = readFile(ESSENTIEL_HERO_PATH)
    assert.ok(
      /eyebrowLabel\s*=\s*computed/.test(content),
      'Hero must declare an eyebrowLabel computed'
    )
    assert.ok(
      /props\.specialties/.test(content),
      'eyebrowLabel must read from props.specialties'
    )
    assert.ok(
      /v-if="eyebrowLabel"/.test(template),
      'Eyebrow pill must be gated on v-if="eyebrowLabel" (hidden when none)'
    )
  })

  test('CoachEssentielHero declares optional specialties prop via CoachHeroProps', () => {
    const typesContent = readFile('features/coach/types/coach-page.types.ts')
    assert.ok(
      /specialties\?:\s*string\[\]/.test(typesContent),
      'CoachHeroProps must include optional specialties?: string[]'
    )
  })
})

describe('YC2.3 follow-up — micro-animations & scrolltelling', () => {
  test('CoachEssentielHero declares hero-anim entrance keyframes', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    assert.ok(
      /@keyframes\s+hero-fade-up/.test(content),
      'Hero must declare @keyframes hero-fade-up for entrance animation'
    )
    assert.ok(
      /\.hero-anim/.test(content),
      'Hero must define .hero-anim utility class'
    )
    assert.ok(
      /prefers-reduced-motion/.test(content),
      'Hero animations must respect prefers-reduced-motion'
    )
  })

  test('CoachEssentielHeader has always-visible bottom border via semantic token', () => {
    const template = readTemplateBlock(ESSENTIEL_HEADER_PATH)
    // Border must be visible at rest (no border-transparent fallback)
    assert.ok(
      !/border-b\s+border-transparent/.test(template),
      'Header must not use border-transparent at rest — always visible border'
    )
    // Must use the semantic token --color-border-subtle (DS), not raw crepuscule
    assert.ok(
      /border-\[color:var\(--color-border-subtle\)\]/.test(template),
      'Header bottom border must use the --color-border-subtle semantic token (DS)'
    )
  })

  test('CoachPageEssentiel uses useScrollReveal for scrolltelling', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /import\s*\{\s*useScrollReveal\s*\}\s*from\s*'~\/composables\/useScrollReveal'/.test(content),
      'Essentiel must import useScrollReveal'
    )
    assert.ok(
      /const\s*\{\s*reveal,\s*isReady\s*\}\s*=\s*useScrollReveal\(\)/.test(content),
      'Essentiel must call useScrollReveal() and destructure { reveal, isReady }'
    )
    assert.ok(
      /js-scroll-ready/.test(content),
      'Essentiel root must bind the js-scroll-ready class for SSR-safe reveal'
    )
  })

  test('CoachPageEssentiel applies scroll-reveal class to body sections', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    const matches = template.match(/scroll-reveal/g) ?? []
    // At least: bio, benefits (when shown), pillars, howItWorks, testimonials, pricing, cta final
    assert.ok(
      matches.length >= 6,
      `Essentiel must apply .scroll-reveal to multiple sections (found ${matches.length}, expected >= 6)`
    )
    assert.ok(
      /v-bind="reveal\(\)"/.test(template),
      'Essentiel must bind reveal() on at least one section'
    )
  })

  test('CoachPageEssentiel declares scroll-reveal CSS in scoped style', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /\.js-scroll-ready\s+\.scroll-reveal:not\(\.is-visible\)/.test(content),
      'Essentiel must declare hide-by-default scroll-reveal CSS'
    )
    assert.ok(
      /\.scroll-reveal\.is-visible/.test(content),
      'Essentiel must declare the visible state CSS'
    )
  })

  test('CoachPageEssentiel passes specialties to the hero props', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /specialties:\s*props\.coachProfile\?\.specialties\s*\?\?\s*\[\]/.test(content),
      'CoachPageEssentiel must forward props.coachProfile?.specialties to heroProps'
    )
  })
})

describe('YC2.3 follow-up — DS compliance (no raw classes overriding keovaButton)', () => {
  const FILES = [ESSENTIEL_PATH, ESSENTIEL_HERO_PATH, ESSENTIEL_HEADER_PATH]

  test('no rounded-3xl anywhere in Essentiel templates (DS forbids it)', () => {
    for (const file of FILES) {
      const template = readTemplateBlock(file)
      assert.ok(
        !/rounded-3xl/.test(template),
        `${file} template must not use rounded-3xl (DS rule: use rounded-2xl)`
      )
    }
  })

  test('no raw <button> tags — all interactive controls via UButton', () => {
    for (const file of FILES) {
      const template = readTemplateBlock(file)
      assert.ok(
        !/<button\b/.test(template),
        `${file} must not use raw <button> — wrap interactions in UButton (DS rule)`
      )
    }
  })

  test('no UButton with raw bg-[var(--color-brand-accent)] override', () => {
    for (const file of FILES) {
      const content = readFile(file)
      // A UButton must not be styled by hand with the brand-accent bg + rounding —
      // that's the keovaButton secondary-solid compound variant's job.
      assert.ok(
        !/<UButton[^>]*class="[^"]*bg-\[var\(--color-brand-accent\)\]/.test(content),
        `${file} must not override UButton with raw bg-[var(--color-brand-accent)] — use color="secondary" variant="solid"`
      )
    }
  })

  test('Essentiel final CTA uses DS Secondary Solid', () => {
    const content = readFile(ESSENTIEL_PATH)
    // The final CTA button must declare DS color/variant, not raw class overrides.
    // Capture the whole UButton block that owns the data-final-cta marker.
    const finalCtaBlock = content.match(/<UButton[\s\S]*?data-final-cta[\s\S]*?<\/UButton>/)?.[0] ?? ''
    assert.ok(finalCtaBlock.length > 0, 'Could not locate the data-final-cta UButton block')
    assert.ok(
      /color="secondary"/.test(finalCtaBlock) && /variant="solid"/.test(finalCtaBlock),
      'Final CTA must declare color="secondary" variant="solid" (DS keovaButton)'
    )
    assert.ok(
      !/bg-\[var\(--color-sunset-600\)\]/.test(finalCtaBlock),
      'Final CTA must not raw-override hover bg — DS handles it'
    )
  })

  test('semantic surface tokens used (no raw bg-[var(--color-neutral-50)] / crepuscule-100)', () => {
    for (const file of FILES) {
      const template = readTemplateBlock(file)
      assert.ok(
        !/bg-\[var\(--color-neutral-50\)\]/.test(template),
        `${file} must use bg-[color:var(--color-surface-page)] semantic token`
      )
      assert.ok(
        !/border-\[var\(--color-crepuscule-100\)\]/.test(template),
        `${file} must use border-[color:var(--color-border-subtle)] semantic token`
      )
    }
  })
})

describe('YC2.3 iter 2 — CoachPageEssentiel wires the new header & hero', () => {
  test('Essentiel imports CoachEssentielHeader and CoachEssentielHero', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      content.includes('import CoachEssentielHeader from \'~/components/templates/coach-pages/essentiel/CoachEssentielHeader.vue\''),
      'Essentiel must import CoachEssentielHeader with explicit path (convention A32)'
    )
    assert.ok(
      content.includes('import CoachEssentielHero from \'~/components/templates/coach-pages/essentiel/CoachEssentielHero.vue\''),
      'Essentiel must import CoachEssentielHero with explicit path (convention A32)'
    )
  })

  test('Essentiel does NOT import CoachHeroProfile anymore', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      !/import\s+CoachHeroProfile/.test(content),
      'Essentiel must not import CoachHeroProfile — use CoachEssentielHero'
    )
  })

  test('Essentiel mounts CoachEssentielHeader and CoachEssentielHero in its template', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /<CoachEssentielHeader[\s\S]*?\/>/.test(template),
      'Essentiel must mount <CoachEssentielHeader /> in template'
    )
    assert.ok(
      /<CoachEssentielHero[\s\S]*?\/>/.test(template),
      'Essentiel must mount <CoachEssentielHero /> in template'
    )
  })

  test('Essentiel activates hide-layout-header useState on mount', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /useState\(['"]hide-layout-header['"]/.test(content),
      'Essentiel must call useState("hide-layout-header") to hide the global PublicHeader'
    )
    assert.ok(
      /hideLayoutHeader\.value\s*=\s*true/.test(content),
      'Essentiel must set hideLayoutHeader.value = true synchronously at setup'
    )
    assert.ok(
      /onBeforeUnmount\(\(\)\s*=>\s*\{\s*hideLayoutHeader\.value\s*=\s*false/.test(content),
      'Essentiel must restore hideLayoutHeader.value = false on unmount'
    )
  })
})

describe('YC2.3 iter 2 — neutral fallbacks in new components (FR-Y18)', () => {
  const NEW_COMPONENTS = [ESSENTIEL_HEADER_PATH, ESSENTIEL_HERO_PATH]

  test('new header & hero template blocks have NO Sophie references', () => {
    for (const file of NEW_COMPONENTS) {
      const template = readTemplateBlock(file)
      for (const banned of ['Sophie', 'sophie', 'jouan', 'Anne M.', 'Francoise L.', 'Valerie D.']) {
        assert.ok(
          !template.includes(banned),
          `${file} template block must not contain "${banned}"`
        )
      }
    }
  })
})

// =====================================================================
// Review follow-up F1+F2: Bio visibility gate + behavioral assertions
// =====================================================================

describe('YC2.3 review — bio section obeys toggle/empty gate (AC-2, AC-3)', () => {
  test('composable exports show.bio and has.bio', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    assert.ok(/showBio/.test(content), 'composable must define showBio computed')
    assert.ok(/hasBio/.test(content), 'composable must define hasBio computed')
    assert.ok(/show:\s*\{[^}]*bio/.test(content), 'composable must expose show.bio in return')
    assert.ok(/has:\s*\{[^}]*bio/.test(content), 'composable must expose has.bio in return')
  })

  test('hasBio checks longBio and bio fields', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    assert.ok(/longBio/.test(content), 'hasBio must read profile.longBio')
    assert.ok(/\.bio\b/.test(content), 'hasBio must read profile.bio')
    assert.ok(/trim\(\)/.test(content), 'hasBio must trim content before checking')
  })

  test('showBio combines toggle AND hasBio', () => {
    const content = readFile(VISIBILITY_COMPOSABLE)
    assert.ok(
      /showBio\s*=\s*computed\(\(\)\s*=>\s*isToggleOn\('bio'\)\s*&&\s*hasBio\.value\)/.test(content),
      'showBio must be computed(() => isToggleOn("bio") && hasBio.value)'
    )
  })

  test('bio section in Essentiel is gated by v-if="showBio"', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /v-if="showBio"[\s\S]{0,200}id="qui-suis-je"/.test(template)
      || /id="qui-suis-je"[\s\S]{0,10}v-if="showBio"/.test(template),
      'bio section must have v-if="showBio" gate'
    )
  })

  test('nav link "Qui suis-je" is conditional on showBio', () => {
    const content = readFile(ESSENTIEL_PATH)
    assert.ok(
      /if\s*\(showBio\.value\)\s*links\.push\(\{[^}]*Qui suis-je/.test(content),
      'nav link "Qui suis-je" must be conditional on showBio.value'
    )
  })

  test('no generic fallback bio text when section should be hidden', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      !/Spécialiste en accompagnement bien-être, je propose/.test(template),
      'Essentiel must NOT have a generic bio fallback (section is hidden when empty, not filled with placeholder)'
    )
  })
})

describe('YC2.3 review — always-on sections with minimal profile (AC-1)', () => {
  test('hero is rendered without any v-if gate', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    // CoachEssentielHero must not have a v-if on it
    assert.ok(
      /<CoachEssentielHero/.test(template),
      'Hero component must be present in template'
    )
    // Ensure no v-if directly on the hero
    assert.ok(
      !/<CoachEssentielHero[^>]*v-if/.test(template),
      'Hero must NOT have a v-if gate — always rendered'
    )
  })

  test('final CTA is rendered without any show* gate', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /data-final-cta/.test(template),
      'Final CTA marker must be present'
    )
    // Find the <section that directly contains data-final-cta by looking backwards
    // from data-final-cta to the nearest <section opening tag.
    const idx = template.indexOf('data-final-cta')
    assert.ok(idx > 0, 'Could not locate data-final-cta in template')
    const before = template.slice(Math.max(0, idx - 1500), idx)
    const lastSectionOpen = before.match(/<section[^>]*>/g) ?? []
    assert.ok(lastSectionOpen.length > 0, 'Could not find the parent <section> of final CTA')
    const parentSection = lastSectionOpen[lastSectionOpen.length - 1]!
    assert.ok(
      !/v-if="show/.test(parentSection),
      'Final CTA parent section must NOT be gated by a show* computed'
    )
  })

  test('disclaimer is always rendered (FR-Y9)', () => {
    const template = readTemplateBlock(ESSENTIEL_PATH)
    assert.ok(
      /AtomsMedicalDisclaimer/.test(template),
      'Disclaimer must be present'
    )
    assert.ok(
      !/<AtomsMedicalDisclaimer[^>]*v-if/.test(template),
      'Disclaimer must NOT have a v-if gate'
    )
  })
})

describe('YC2.3 review — hero CTA uses primary solid (design refonte)', () => {
  test('hero CTA is color="primary" variant="solid"', () => {
    const content = readFile(ESSENTIEL_HERO_PATH)
    const heroCtaBlock = content.match(/<UButton[\s\S]*?data-hero-cta[\s\S]*?>/)?.[0] ?? ''
    assert.ok(heroCtaBlock.length > 0, 'Could not locate the data-hero-cta UButton')
    assert.ok(
      /color="primary"/.test(heroCtaBlock),
      'Hero CTA must use color="primary" (violet, not secondary orange)'
    )
    assert.ok(
      /variant="solid"/.test(heroCtaBlock),
      'Hero CTA must use variant="solid"'
    )
  })
})
