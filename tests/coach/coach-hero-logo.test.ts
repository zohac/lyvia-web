import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

/**
 * Story 0-27 — wiring tests for the brand logo display on the public coach
 * page (CoachHeroProfile.vue), driven by the new `logoUrl` prop on
 * `CoachHeroProps`.
 *
 * Convention A32: tests target the real Vue files so deleting/breaking the
 * markup or the prop wiring fails one of these assertions.
 */

const appRoot = path.resolve(process.cwd(), 'app')
const HERO_PATH = 'components/organisms/CoachHeroProfile.vue'
const HERO_PROPS_PATH = 'features/coach/types/coach-page.types.ts'
const SIGNATURE_TEMPLATE_PATH = 'components/templates/coach-pages/CoachPageSignature.vue'
const ESSENTIEL_TEMPLATE_PATH = 'components/templates/coach-pages/CoachPageEssentiel.vue'
const ESSENTIEL_HERO_PATH = 'components/templates/coach-pages/essentiel/CoachEssentielHero.vue'
const HUB_TEMPLATE_PATH = 'components/templates/coach-pages/CoachPageHub.vue'
const SHARED_LOGO_ATOM_PATH = 'components/atoms/CoachBrandLogo.vue'
const PUBLIC_CONTRACT_PATH = 'features/seo/api/public-provider-profile.contract.ts'

function read(p: string): string {
  return fs.readFileSync(path.join(appRoot, p), 'utf-8')
}

describe('0-27 — Brand logo on public coach page (CoachHeroProfile + Schema.org wiring)', () => {
  test('CoachHeroProps interface exposes optional logoUrl', () => {
    const source = read(HERO_PROPS_PATH)
    assert.match(
      source,
      /export interface CoachHeroProps[\s\S]*?logoUrl\?:\s*string\s*\|\s*null/,
      'CoachHeroProps must declare optional logoUrl: string | null'
    )
  })

  test('CoachBrandLogo atom (Codex CR1-F1) renders <NuxtImg> conditionally with max-h-15 + alt + data-testid', () => {
    const source = read(SHARED_LOGO_ATOM_PATH)
    // The atom must be conditional on `logoUrl` and use NuxtImg
    assert.match(
      source,
      /<NuxtImg[\s\S]*?v-if="logoUrl"[\s\S]*?:src="logoUrl"/,
      'CoachBrandLogo must render <NuxtImg v-if="logoUrl" :src="logoUrl">'
    )
    // AC-6 spec: max-h-15 (= 60px) constraint
    assert.match(
      source,
      /max-h-15/,
      'CoachBrandLogo must be constrained to max-h-15 (60px) per AC-6'
    )
    // Alt text built from displayName
    assert.match(
      source,
      /:alt="`Logo \$\{displayName\}`"/,
      'CoachBrandLogo must build alt text from displayName for accessibility'
    )
    // Shared data-testid for the 3 templates (Signature, Essentiel, Hub)
    assert.match(
      source,
      /data-testid="coach-brand-logo"/,
      'CoachBrandLogo must expose a unified data-testid="coach-brand-logo"'
    )
    // Eager + fetchpriority high (logo is part of LCP)
    assert.match(source, /loading="eager"/)
    assert.match(source, /fetchpriority="high"/)
  })

  test('CoachHeroProfile (Signature) does NOT render a local brand logo — header owns the logo (round 2026-05-02)', () => {
    const source = read(HERO_PATH)
    // Story 0-28 round terrain Simon — le logo a été retiré du hero pour
    // éviter la redondance avec le PublicHeader (qui rend déjà le logo
    // white-label). Les hero ne doivent plus importer ni mounter
    // `CoachBrandLogo`.
    assert.ok(
      !/import\s+CoachBrandLogo/.test(source),
      'Signature hero must NOT import CoachBrandLogo (logo lives in PublicHeader / preview header)'
    )
    assert.ok(
      !/<CoachBrandLogo\b/.test(source),
      'Signature hero must NOT render <CoachBrandLogo> (redundant with PublicHeader)'
    )
  })

  test('CoachEssentielHero does NOT render a local brand logo (round 2026-05-02)', () => {
    const source = read(ESSENTIEL_HERO_PATH)
    assert.ok(
      !/import\s+CoachBrandLogo/.test(source),
      'Essentiel hero must NOT import CoachBrandLogo (logo lives in PublicHeader / preview header)'
    )
    assert.ok(
      !/<CoachBrandLogo\b/.test(source),
      'Essentiel hero must NOT render <CoachBrandLogo>'
    )
  })

  test('CoachPageHub does NOT render a local brand logo (round 2026-05-02)', () => {
    const source = read(HUB_TEMPLATE_PATH)
    assert.ok(
      !/import\s+CoachBrandLogo/.test(source),
      'Hub template must NOT import CoachBrandLogo (logo lives in PublicHeader / preview header)'
    )
    assert.ok(
      !/<CoachBrandLogo\b/.test(source),
      'Hub template must NOT render <CoachBrandLogo>'
    )
  })

  test('CoachPageSignature passes logoUrl from PublicProviderProfile to heroProps', () => {
    const source = read(SIGNATURE_TEMPLATE_PATH)
    assert.match(
      source,
      /logoUrl:\s*props\.coachProfile\?\.logoUrl\s*\?\?\s*null/,
      'CoachPageSignature must wire heroProps.logoUrl from props.coachProfile.logoUrl'
    )
  })

  test('CoachPageEssentiel propagates logoUrl into heroProps (cross-template consistency)', () => {
    const source = read(ESSENTIEL_TEMPLATE_PATH)
    assert.match(
      source,
      /logoUrl:\s*props\.coachProfile\?\.logoUrl\s*\?\?\s*null/,
      'CoachPageEssentiel must propagate heroProps.logoUrl for future Essentiel hero rendering'
    )
  })

  test('PublicProviderProfile contract exposes logoUrl: string | null', () => {
    const source = read(PUBLIC_CONTRACT_PATH)
    assert.match(
      source,
      /logoUrl:\s*string\s*\|\s*null/,
      'PublicProviderProfile must expose logoUrl: string | null (Story 0-27 backend AC-7)'
    )
  })

  test('useCoachSchemaOrg injects Person.logo when logoUrl is set', () => {
    const useCoachSchemaOrg = fs.readFileSync(
      path.join(appRoot, 'features/seo/useCoachSchemaOrg.ts'),
      'utf-8'
    )
    // A reactive ref must be created for logoUrl
    assert.match(
      useCoachSchemaOrg,
      /const\s+logoUrl\s*=\s*ref<string\s*\|\s*undefined>/,
      'useCoachSchemaOrg must declare a reactive logoUrl ref'
    )
    // The Person schema raw JSON-LD must include `logo` via buildPersonLogo
    assert.match(
      useCoachSchemaOrg,
      /'logo':\s*\(\)\s*=>\s*buildPersonLogo\(logoUrl\.value\)/,
      'useCoachSchemaOrg must inject Person.logo via buildPersonLogo helper'
    )
    // mapProfileToSchemaRefs must receive the logoUrl ref
    assert.match(
      useCoachSchemaOrg,
      /mapProfileToSchemaRefs\([\s\S]*?logoUrl[\s\S]*?\)/,
      'useCoachSchemaOrg must propagate logoUrl ref through mapProfileToSchemaRefs'
    )
  })
})
