import * as assert from 'node:assert/strict'
import test from 'node:test'
import { effectScope, nextTick, ref } from 'vue'

import { getDomainContext } from '../../shared/utils/domain-context'
import type { CSSStyleSetter } from '../../shared/utils/brand-color-helpers'
import { bindBrandColorScope } from '../../shared/utils/brand-color-scope'
import {
  shouldInjectBrandColor,
  parseHex,
  rgbToHsl,
  hslToHex,
  deriveBrandVariants,
  applyBrandColors,
  removeBrandColors,
  BRAND_CSS_VARS
} from '../../shared/utils/brand-color-helpers'

const PLATFORM = 'keova.fr'
const PLATFORM_B2B = 'keova.app'

// =============================================================================
// shouldInjectBrandColor — decision logic
// =============================================================================

test('shouldInjectBrandColor: white-label + valid brandColor → true', () => {
  assert.equal(shouldInjectBrandColor(true, '#8B5CF6'), true)
})

test('shouldInjectBrandColor: white-label + null brandColor → false', () => {
  assert.equal(shouldInjectBrandColor(true, null), false)
})

test('shouldInjectBrandColor: white-label + undefined brandColor → false', () => {
  assert.equal(shouldInjectBrandColor(true, undefined), false)
})

test('shouldInjectBrandColor: white-label + empty string brandColor → false', () => {
  assert.equal(shouldInjectBrandColor(true, ''), false)
})

test('shouldInjectBrandColor: platform domain + valid brandColor → false', () => {
  assert.equal(shouldInjectBrandColor(false, '#8B5CF6'), false)
})

// =============================================================================
// Integration: domain context + shouldInjectBrandColor
// =============================================================================

test('white-label domain → isWhiteLabel true → injection enabled', () => {
  const ctx = getDomainContext('sophie-jouan.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(shouldInjectBrandColor(ctx.isWhiteLabel, '#8B5CF6'), true)
})

test('platform B2C → isWhiteLabel false → injection disabled', () => {
  const ctx = getDomainContext('keova.fr', PLATFORM, PLATFORM_B2B)
  assert.equal(shouldInjectBrandColor(ctx.isWhiteLabel, '#8B5CF6'), false)
})

test('platform B2B → isWhiteLabel false → injection disabled', () => {
  const ctx = getDomainContext('keova.app', PLATFORM, PLATFORM_B2B)
  assert.equal(shouldInjectBrandColor(ctx.isWhiteLabel, '#8B5CF6'), false)
})

test('localhost (dev) → isWhiteLabel false → injection disabled', () => {
  const ctx = getDomainContext('localhost', PLATFORM, PLATFORM_B2B)
  assert.equal(shouldInjectBrandColor(ctx.isWhiteLabel, '#8B5CF6'), false)
})

// =============================================================================
// parseHex
// =============================================================================

test('parseHex: valid hex → RGB object', () => {
  assert.deepEqual(parseHex('#5b4b6e'), { r: 91, g: 75, b: 110 })
})

test('parseHex: uppercase hex → RGB object', () => {
  assert.deepEqual(parseHex('#8B5CF6'), { r: 139, g: 92, b: 246 })
})

test('parseHex: black → (0,0,0)', () => {
  assert.deepEqual(parseHex('#000000'), { r: 0, g: 0, b: 0 })
})

test('parseHex: white → (255,255,255)', () => {
  assert.deepEqual(parseHex('#ffffff'), { r: 255, g: 255, b: 255 })
})

test('parseHex: invalid format → null', () => {
  assert.equal(parseHex('red'), null)
  assert.equal(parseHex('#GGG'), null)
  assert.equal(parseHex('123456'), null)
  assert.equal(parseHex('#12345'), null)
})

// =============================================================================
// rgbToHsl / hslToHex round-trip
// =============================================================================

test('RGB→HSL→Hex round-trip preserves color', () => {
  const colors = ['#5b4b6e', '#8B5CF6', '#FF0000', '#00FF00', '#0000FF', '#ffffff', '#000000']
  for (const hex of colors) {
    const rgb = parseHex(hex)!
    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b)
    const result = hslToHex(hsl.h, hsl.s, hsl.l)
    assert.equal(result.toLowerCase(), hex.toLowerCase(), `round-trip failed for ${hex}`)
  }
})

// =============================================================================
// deriveBrandVariants
// =============================================================================

test('deriveBrandVariants: primary matches input', () => {
  const variants = deriveBrandVariants('#8B5CF6')
  assert.equal(variants.primary, '#8B5CF6')
})

test('deriveBrandVariants: light is lighter than primary', () => {
  const variants = deriveBrandVariants('#8B5CF6')
  const primaryL = rgbToHsl(...Object.values(parseHex(variants.primary)!) as [number, number, number]).l
  const lightL = rgbToHsl(...Object.values(parseHex(variants.primaryLight)!) as [number, number, number]).l
  assert.ok(lightL > primaryL, `light (${lightL}) should be lighter than primary (${primaryL})`)
})

test('deriveBrandVariants: dark is darker than primary', () => {
  const variants = deriveBrandVariants('#8B5CF6')
  const primaryL = rgbToHsl(...Object.values(parseHex(variants.primary)!) as [number, number, number]).l
  const darkL = rgbToHsl(...Object.values(parseHex(variants.primaryDark)!) as [number, number, number]).l
  assert.ok(darkL < primaryL, `dark (${darkL}) should be darker than primary (${primaryL})`)
})

test('deriveBrandVariants: invalid hex → all three return input', () => {
  const variants = deriveBrandVariants('invalid')
  assert.equal(variants.primary, 'invalid')
  assert.equal(variants.primaryLight, 'invalid')
  assert.equal(variants.primaryDark, 'invalid')
})

// =============================================================================
// applyBrandColors / removeBrandColors — DOM simulation
// =============================================================================

function createMockStyle(): CSSStyleSetter & { _store: Record<string, string> } {
  const store: Record<string, string> = {}
  return {
    _store: store,
    setProperty(name: string, value: string) {
      store[name] = value
    },
    removeProperty(name: string) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete -- mock CSSStyleDeclaration behavior
      delete store[name]
      return ''
    },
    getPropertyValue(name: string) {
      return store[name] || ''
    }
  } as CSSStyleSetter & { _store: Record<string, string> }
}

test('applyBrandColors: sets all 3 CSS variables on document', () => {
  const style = createMockStyle()
  applyBrandColors(style, '#8B5CF6')

  assert.ok(style._store[BRAND_CSS_VARS.primary], 'primary should be set')
  assert.ok(style._store[BRAND_CSS_VARS.primaryLight], 'primaryLight should be set')
  assert.ok(style._store[BRAND_CSS_VARS.primaryDark], 'primaryDark should be set')
  assert.equal(style._store[BRAND_CSS_VARS.primary], '#8B5CF6')
})

test('removeBrandColors: clears all 3 CSS variables', () => {
  const style = createMockStyle()
  applyBrandColors(style, '#8B5CF6')

  // Verify they're set
  assert.ok(style._store[BRAND_CSS_VARS.primary])

  // Remove
  removeBrandColors(style)

  assert.equal(style._store[BRAND_CSS_VARS.primary], undefined)
  assert.equal(style._store[BRAND_CSS_VARS.primaryLight], undefined)
  assert.equal(style._store[BRAND_CSS_VARS.primaryDark], undefined)
})

test('isolation: removeBrandColors after applyBrandColors leaves clean state', () => {
  const style = createMockStyle()

  // Simulate layout mount: apply brand colors
  applyBrandColors(style, '#FF5733')

  // Simulate layout unmount: remove brand colors
  removeBrandColors(style)

  // After cleanup, no brand CSS vars should remain (public page would see CSS defaults)
  assert.deepEqual(style._store, {})
})

test('bindBrandColorScope: reacts to brand color changes with a real watch', async () => {
  const style = createMockStyle()
  const brandColor = ref<string | null>('#8B5CF6')
  const scope = effectScope()

  scope.run(() => {
    bindBrandColorScope(style, brandColor)
  })

  await nextTick()
  assert.equal(style._store[BRAND_CSS_VARS.primary], '#8B5CF6')

  brandColor.value = '#FF5733'
  await nextTick()
  assert.equal(style._store[BRAND_CSS_VARS.primary], '#FF5733')

  brandColor.value = null
  await nextTick()
  assert.deepEqual(style._store, {})

  scope.stop()
})

test('bindBrandColorScope: scope cleanup removes injected variables', async () => {
  const style = createMockStyle()
  const brandColor = ref<string | null>('#FF5733')
  const scope = effectScope()

  scope.run(() => {
    bindBrandColorScope(style, brandColor)
  })

  await nextTick()
  assert.ok(style._store[BRAND_CSS_VARS.primary], 'brand color should be injected before cleanup')

  scope.stop()

  assert.deepEqual(style._store, {})
})

// =============================================================================
// CSS variable names contract
// =============================================================================

test('BRAND_CSS_VARS match main.css token names', () => {
  assert.equal(BRAND_CSS_VARS.primary, '--color-brand-primary')
  assert.equal(BRAND_CSS_VARS.primaryLight, '--color-brand-primary-light')
  assert.equal(BRAND_CSS_VARS.primaryDark, '--color-brand-primary-dark')
})
