import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-28 — wiring tests for the live preview layout on
 * `/provider/coach-page` and the panel organism.
 *
 * Convention A32: assertions target the real `.vue` source. Removing the
 * grid wrapper, the FAB, the slideover, or the panel toolbar must fail one
 * of the assertions below.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const COACH_PAGE_PATH = 'pages/provider/coach-page.vue'
const PREVIEW_PANEL_PATH = 'components/organisms/CoachPagePreviewPanel.vue'

function read(p: string): string {
  return fs.readFileSync(path.join(appRoot, p), 'utf-8')
}

describe('0-28 — coach-page live preview layout (split desktop + slideover mobile)', () => {
  test('coach-page imports the preview panel + composables', () => {
    const source = read(COACH_PAGE_PATH)
    assert.match(
      source,
      /import\s+CoachPagePreviewPanel\s+from\s+'~\/components\/organisms\/CoachPagePreviewPanel\.vue'/,
      'coach-page must import the shared preview panel organism'
    )
    assert.match(
      source,
      /import\s+\{\s*useCoachPreview\s*\}\s+from\s+'~\/features\/coach\/useCoachPreview'/,
      'coach-page must import useCoachPreview'
    )
    assert.match(
      source,
      /import\s+\{\s*useCoachPublish\s*\}\s+from\s+'~\/features\/coach\/useCoachPublish'/,
      'coach-page must import useCoachPublish'
    )
  })

  test('coach-page activates an xl:grid 50/50 split when preview is open', () => {
    const source = read(COACH_PAGE_PATH)
    // Story 0-28 round terrain Simon — passé à 50/50 (xl:grid-cols-2) avec
    // zoom-out desktop pour donner une vue réduite réaliste plutôt qu'un
    // rendu compressé.
    assert.match(
      source,
      /previewOpen\s*\?\s*'xl:grid xl:grid-cols-2\s+xl:gap-8'/,
      'coach-page must activate xl:grid xl:grid-cols-2 xl:gap-8 when previewOpen (50/50 split)'
    )
    // Editor column must declare min-w-0 to allow shrink under xl:grid.
    assert.match(
      source,
      /xl:min-w-0/,
      'editor column must declare xl:min-w-0 to honour the grid shrink'
    )
  })

  test('coach-page renders the desktop sticky aside hidden under xl', () => {
    const source = read(COACH_PAGE_PATH)
    // Aside must use sticky top-0 + hidden xl:flex (not visible on mobile).
    assert.match(
      source,
      /<aside[\s\S]*?hidden[\s\S]*?xl:flex/,
      'desktop aside must be `hidden xl:flex` (no preview on mobile inline)'
    )
    assert.match(
      source,
      /<aside[\s\S]*?sticky\s+top-0/,
      'desktop aside must be sticky top-0'
    )
    assert.match(
      source,
      /data-testid="coach-page-preview-aside"/,
      'desktop aside must expose data-testid for browser verification'
    )
  })

  test('coach-page renders a mobile FAB only under xl + a desktop reopen FAB only when closed', () => {
    const source = read(COACH_PAGE_PATH)
    // Mobile FAB — xl:hidden (visible only under xl)
    assert.match(
      source,
      /data-testid="coach-page-preview-fab-mobile"[\s\S]*?xl:hidden|xl:hidden[\s\S]*?data-testid="coach-page-preview-fab-mobile"/,
      'mobile preview FAB must be hidden under xl breakpoint'
    )
    // Desktop reopen — visible only when `!previewOpen` AND xl breakpoint
    assert.match(
      source,
      /v-if="!loading && !previewOpen"[\s\S]*?xl:inline-flex/,
      'desktop reopen FAB must surface only when previewOpen===false at xl+'
    )
  })

  test('coach-page mounts a USlideover for mobile preview, decoupled from desktop persisted state', () => {
    const source = read(COACH_PAGE_PATH)
    assert.match(
      source,
      /<USlideover[\s\S]*?v-model:open="previewMobileOpen"[\s\S]*?side="right"/,
      'coach-page must render a USlideover with v-model:open="previewMobileOpen" side="right"'
    )
    // The slideover state is the composable's mobileOpen, aliased to
    // previewMobileOpen so the template keeps working (CPD.9).
    assert.match(
      source,
      /mobileOpen:\s*previewMobileOpen/,
      'mobile slideover open state must be aliased from the preview composable (default false)'
    )
  })

  test('CoachPagePreviewPanel toolbar exposes the verbatim "Aperçu" label + device sub-label + toggle pills', () => {
    const source = read(PREVIEW_PANEL_PATH)
    // Verbatim label "Aperçu" (AC-1)
    assert.match(
      source,
      />\s*Aperçu\s*</,
      'panel header must surface the verbatim "Aperçu" label'
    )
    // Device sub-label computed (Desktop · 1280px+ / Mobile · 375px) — AC-1
    assert.match(
      source,
      /Desktop\s*·\s*1280px\+/,
      'panel must surface the verbatim "Desktop · 1280px+" sub-label'
    )
    assert.match(
      source,
      /Mobile\s*·\s*375px/,
      'panel must surface the verbatim "Mobile · 375px" sub-label'
    )
    // Device toggle pills with aria-pressed
    assert.match(source, /data-testid="coach-preview-device-desktop"/)
    assert.match(source, /data-testid="coach-preview-device-mobile"/)
    assert.match(source, /:aria-pressed="device === 'desktop'"/)
    assert.match(source, /:aria-pressed="device === 'mobile'"/)
  })

  test('CoachPagePreviewPanel renders the template inside an inert wrapper (CTAs neutralised)', () => {
    const source = read(PREVIEW_PANEL_PATH)
    // Native HTML `inert` attribute on the frame — no per-CTA wrapper.
    assert.match(
      source,
      /<div[\s\S]*?:data-preview-device="device"[\s\S]*?inert/,
      'preview frame must be marked `inert` to neutralise CTAs / form submits'
    )
    // Preview-mode prop forwarded to the dynamic template
    assert.match(
      source,
      /:preview-mode="true"/,
      'panel must forward :preview-mode="true" to the resolved template'
    )
    // cta-to bound to "#" so any inert-bypassed click stays on the page
    assert.match(
      source,
      /cta-to="#"/,
      'panel must hardcode cta-to="#" so inert bypass does not navigate'
    )
  })

  test('CoachPagePreviewPanel applies a desktop zoom-out (zoom: 0.45) for the reduced preview view', () => {
    const source = read(PREVIEW_PANEL_PATH)
    // Story 0-28 round terrain Simon (2026-05-02) — desktop preview rendue
    // en miniature via CSS `zoom: 0.45`. Mobile : pas de zoom (frame déjà
    // 375px). Le ratio peut évoluer ; le test garde le marqueur device
    // gate explicite + la valeur courante pour catch toute régression
    // accidentelle vers la pleine taille.
    assert.match(
      source,
      /props\.device\s*===\s*'desktop'\s*\?\s*\{\s*zoom:\s*0\.45\s*\}\s*:\s*undefined/,
      'panel must apply zoom: 0.45 only when device==="desktop"'
    )
    assert.match(
      source,
      /data-testid="coach-preview-content-zoom"/,
      'zoom wrapper must expose data-testid for browser verification'
    )
    // The zoom wrapper must be applied to the inert content, not the frame
    // (otherwise the frame border would also be scaled down).
    assert.match(
      source,
      /:style="contentZoomStyle"/,
      'zoom must be applied via :style binding, not via class (zoom is a CSS property, not a Tailwind utility)'
    )
  })

  test('CR-1 — CoachPagePreviewPanel renders PublicHeader conditionally (excluded for templates owning their own header)', () => {
    const source = read(PREVIEW_PANEL_PATH)
    // Conditional flag must exist + the <PublicHeader> must use v-if to skip
    // for templates that own their internal header.
    assert.match(
      source,
      /const\s+showPreviewPublicHeader\s*=\s*computed/,
      'panel must declare a `showPreviewPublicHeader` computed gate'
    )
    // YB.1.2 — le gate n'est PLUS une double négation par code littéral : il
    // passe par le registre. Sans cela Alba y était traitée comme Signature
    // et l'aperçu montrait DEUX headers — défaut invisible au lint, au
    // typecheck et à tout test de rendu.
    assert.match(
      source,
      /!\s*templateRendersOwnHeader\(props\.coachProfile\?\.templateCode\)/,
      'gate must NEGATE the registry result — without the `!`, Alba gets a double header'
    )
    assert.equal(
      /\(props\.coachProfile\?\.templateCode[\s\S]*?\)\s*!==\s*'essentiel'/.test(source),
      false,
      'the per-code double negation must be retired in favour of the registry'
    )
    assert.match(
      source,
      /<PublicHeader[\s\S]*?v-if="showPreviewPublicHeader"/,
      'PublicHeader render must be guarded by v-if="showPreviewPublicHeader"'
    )
  })

  // YB.1.2 — the "Photo d'en-tête" thumbnail chain describes a hero BACKGROUND
  // (a `visuel` strata). Alba's hero is flat and renders the coach's PORTRAIT,
  // and it does not read `hero_image_disabled`. Without the guard, the editor
  // advertises a "Fond sombre" marker or an ambience image that Alba's page
  // never shows — the preview would lie about the page.
  //
  // BOTH branches must carry the condition: inverting `!==`, or dropping it from
  // one branch only, would pass every other check in this file.
  // CPD.7 — le markup a quitté la page pour `CoachPageHeroEditor.vue` : la
  // garde lit désormais la carte (le contrat est rendu par
  // `cpd-7-hero-editor.test.ts`), et la page doit encore dériver le signal.
  test('YB.1.2 — the hero-BACKGROUND thumbnail branches are skipped for Alba', () => {
    const source = read(COACH_PAGE_PATH)
    const card = read('components/organisms/CoachPageHeroEditor.vue')

    // CPD.9 — le signal est dérivé par `useCoachPreview` (source unique) et la
    // page le DESTRUCTURE : la page n'en garde plus un second computed, sinon
    // deux dérivations de la même règle Alba/visuel coexistent (revue CPD.9).
    const previewComposable = read('features/coach/useCoachPreview.ts')
    assert.match(
      previewComposable,
      /const isHeroBackgroundTemplate = computed<boolean>\(\s*\(\) => previewTemplateCode\.value !== ALBA_TEMPLATE_CODE\s*\)/,
      'the preview composable must derive isHeroBackgroundTemplate off the Alba template code'
    )
    assert.match(
      previewComposable,
      /import\s*\{\s*ALBA_TEMPLATE_CODE\s*\}\s*from\s*'(?:~\/features|\.\.\/\.\.\/features)\/plans\/domain\/template-lock'/,
      'ALBA_TEMPLATE_CODE must be imported, not inlined as a string literal'
    )
    assert.match(
      source,
      /^\s+isHeroBackgroundTemplate,$/m,
      'coach-page must destructure the signal from the preview composable'
    )
    assert.equal(
      /const isHeroBackgroundTemplate = computed/.test(source),
      false,
      'coach-page must NOT keep a second derivation of the hero-background signal'
    )
    assert.match(
      source,
      /:hero-is-background="isHeroBackgroundTemplate"/,
      'the page must hand the signal to the card (the card does not know the registry)'
    )

    // Branch 1 — the disabled marker (`hero_image_disabled`).
    assert.match(
      card,
      /v-if="isBackground && photoDisabledValue"/,
      'the disabled marker must be skipped for Alba — it reads a flag Alba ignores'
    )

    // Branch 2 — the hero photo itself.
    assert.match(
      card,
      /v-else-if="isBackground && displayedPhotoUrl"/,
      'the hero-image branch must be skipped for Alba — Alba renders the portrait'
    )

    // And the fall-through Alba takes: the portrait, while the Visuel default
    // stays Visuel-only.
    assert.match(
      card,
      /v-else-if="isVisuel"[\s\S]{0,200}?hero-default\.webp/,
      'the Visuel default background must remain gated on the visuel template alone'
    )
    assert.match(
      card,
      /v-else-if="profilePhotoUrl"[\s\S]{0,200}?Photo de profil/,
      'Alba must fall through to the coach portrait, not a background'
    )

    // Revue YB.1.2 — le BLOC DE CONTRÔLES (upload / retrait / rétablissement)
    // pilote le même champ « fond de hero » : il doit être sauté pour Alba au
    // même titre que la vignette. Sans cette garde, un bouton « Modifier la
    // photo » écrit une image de fond que la page d'Alba ne rend jamais.
    assert.match(
      card,
      /v-if="isBackground"\s+class="flex flex-col items-start gap-2"/,
      'the hero-photo control block must be skipped for Alba (it edits the background)'
    )
  })

  test('CR-4 — mobile slideover is fullscreen under xl (no sm:max-w-2xl cap)', () => {
    const source = read(COACH_PAGE_PATH)
    // The legacy `sm:max-w-2xl` cap must be gone (it clipped the preview on
    // tablet to a partial column instead of fullscreen as AC-2 requires).
    assert.ok(
      !/sm:max-w-2xl/.test(source),
      'coach-page must NOT cap the preview slideover at sm:max-w-2xl (CR-4)'
    )
    // The slideover must use a fullscreen content class.
    assert.match(
      source,
      /<USlideover[\s\S]*?w-screen[\s\S]*?max-w-none/,
      'coach-page slideover must use w-screen + max-w-none for fullscreen preview under xl'
    )
  })

  test('CR-5 — layout test stays aligned with the AC: 50/50 grid (xl:grid-cols-2)', () => {
    // Aligned with `coach-page activates an xl:grid 50/50 split when preview is open`
    // above. This sentinel makes the contradiction explicit if a future patch
    // re-introduces a 3fr_2fr (or any other ratio) without updating both the
    // ticket and the assertion.
    const source = read(COACH_PAGE_PATH)
    assert.match(source, /xl:grid-cols-2/, 'CR-5: ticket + tests + code must agree on xl:grid-cols-2')
    assert.ok(
      !/xl:grid-cols-\[3fr_2fr\]/.test(source),
      'CR-5: legacy 3fr_2fr ratio must be retired in favour of the documented 50/50'
    )
  })

  test('CoachPagePreviewPanel mobile frame uses Q2 brief style (max-w-375 + rounded-2xl + border-emphasis, no skeuomorphism)', () => {
    const source = read(PREVIEW_PANEL_PATH)
    // Mobile frame: max-w-[375px] + rounded-2xl + border-emphasis token
    assert.match(
      source,
      /max-w-\[375px\][\s\S]*?rounded-2xl[\s\S]*?border-\[color:var\(--color-border-emphasis\)\]/,
      'mobile frame must use max-w-[375px] + rounded-2xl + border-emphasis (Q2 retained)'
    )
    // Bans: no rounded-3xl (DESIGN.md absolute ban), no bezel/notch styling
    assert.ok(
      !/rounded-3xl/.test(source),
      'panel must NOT use rounded-3xl (DESIGN.md absolute ban)'
    )
  })
})
