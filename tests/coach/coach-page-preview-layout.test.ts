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
      /import\s+\{\s*useCoachPagePreviewProfile\s*\}\s+from\s+'~\/features\/coach\/useCoachPagePreviewProfile'/,
      'coach-page must import useCoachPagePreviewProfile'
    )
    assert.match(
      source,
      /import\s+\{\s*useCoachPagePreviewState\s*\}\s+from\s+'~\/features\/coach\/useCoachPagePreviewState'/,
      'coach-page must import useCoachPagePreviewState (localStorage open + device)'
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
    // The slideover state must be a separate ref (not the persisted one) — never auto-open mobile.
    assert.match(
      source,
      /const\s+previewMobileOpen\s*=\s*ref\(false\)/,
      'mobile slideover open state must default to false (no auto-open on mount)'
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
