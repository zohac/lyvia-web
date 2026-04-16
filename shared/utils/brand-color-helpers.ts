/**
 * Pure helpers for white-label brand color injection.
 *
 * Convention 5 (Retro T2): composable SEO/brand logic must be extracted
 * into pure testable helpers.
 */

/** Minimal interface for CSS style manipulation (avoids CSSStyleDeclaration dependency in SSR) */
export interface CSSStyleSetter {
  setProperty(name: string, value: string): void
  removeProperty(name: string): string
}

/** CSS custom property names injected by useBrandColorInjection() */
export const BRAND_CSS_VARS = {
  primary: '--color-brand-primary',
  primaryLight: '--color-brand-primary-light',
  primaryDark: '--color-brand-primary-dark'
} as const

/**
 * Determines whether brand color injection should happen.
 */
export function shouldInjectBrandColor(isWhiteLabel: boolean, brandColor: string | null | undefined): brandColor is string {
  return isWhiteLabel && typeof brandColor === 'string' && brandColor.length > 0
}

/**
 * Parses a hex color string (#RRGGBB) into RGB components.
 * Returns null if the format is invalid.
 */
export function parseHex(hex: string): { r: number, g: number, b: number } | null {
  const match = /^#([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/.exec(hex)
  if (!match) return null
  return {
    r: parseInt(match[1]!, 16),
    g: parseInt(match[2]!, 16),
    b: parseInt(match[3]!, 16)
  }
}

/**
 * Converts RGB to HSL.
 * Returns h in [0,360], s and l in [0,1].
 */
export function rgbToHsl(r: number, g: number, b: number): { h: number, s: number, l: number } {
  r /= 255
  g /= 255
  b /= 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2

  if (max === min) return { h: 0, s: 0, l }

  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  let h = 0

  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6
  else if (max === g) h = ((b - r) / d + 2) / 6
  else h = ((r - g) / d + 4) / 6

  return { h: h * 360, s, l }
}

/**
 * Converts HSL to hex string (#RRGGBB).
 * h in [0,360], s and l in [0,1].
 */
export function hslToHex(h: number, s: number, l: number): string {
  h = ((h % 360) + 360) % 360
  s = Math.max(0, Math.min(1, s))
  l = Math.max(0, Math.min(1, l))

  const c = (1 - Math.abs(2 * l - 1)) * s
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
  const m = l - c / 2

  let r = 0
  let g = 0
  let b = 0
  if (h < 60) {
    r = c
    g = x
  } else if (h < 120) {
    r = x
    g = c
  } else if (h < 180) {
    g = c
    b = x
  } else if (h < 240) {
    g = x
    b = c
  } else if (h < 300) {
    r = x
    b = c
  } else {
    r = c
    b = x
  }

  const toHex = (v: number) => Math.round((v + m) * 255).toString(16).padStart(2, '0')
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`
}

/**
 * Derives light and dark variants from a brand color.
 *
 * Light: +10% lightness (capped at 0.9)
 * Dark:  -15% lightness (floored at 0.1)
 *
 * Mapping: crepuscule-500 (light) / crepuscule-600 (primary) / crepuscule-800 (dark)
 * Delta in default palette: 500→600 is ~-8% lightness, 600→800 is ~-15% lightness.
 */
export function deriveBrandVariants(brandColor: string): {
  primary: string
  primaryLight: string
  primaryDark: string
} {
  const rgb = parseHex(brandColor)
  if (!rgb) {
    return { primary: brandColor, primaryLight: brandColor, primaryDark: brandColor }
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)

  return {
    primary: brandColor,
    primaryLight: hslToHex(h, s, Math.min(0.9, l + 0.10)),
    primaryDark: hslToHex(h, s, Math.max(0.1, l - 0.15))
  }
}

/**
 * Applies brand color CSS custom properties to the document root.
 */
export function applyBrandColors(style: CSSStyleSetter, brandColor: string): void {
  const variants = deriveBrandVariants(brandColor)
  style.setProperty(BRAND_CSS_VARS.primary, variants.primary)
  style.setProperty(BRAND_CSS_VARS.primaryLight, variants.primaryLight)
  style.setProperty(BRAND_CSS_VARS.primaryDark, variants.primaryDark)
}

/**
 * Removes brand color CSS custom properties from the document root.
 */
export function removeBrandColors(style: CSSStyleSetter): void {
  style.removeProperty(BRAND_CSS_VARS.primary)
  style.removeProperty(BRAND_CSS_VARS.primaryLight)
  style.removeProperty(BRAND_CSS_VARS.primaryDark)
}
