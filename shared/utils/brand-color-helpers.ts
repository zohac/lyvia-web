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

/** CSS custom property names injected by useBrandColorInjection() / usePublicTenantBrand() */
export const BRAND_CSS_VARS = {
  primary: '--color-brand-primary',
  primaryLight: '--color-brand-primary-light',
  primaryDark: '--color-brand-primary-dark',
  primaryLightest: '--color-brand-primary-lightest',
  surfacePage: '--color-surface-page',
  surfaceHighlight: '--color-surface-highlight',
  crepuscule50: '--color-crepuscule-50',
  accent: '--color-brand-accent',
  accentHover: '--color-brand-accent-hover',
  textOnAccent: '--color-text-on-accent'
} as const

/**
 * Calculates relative luminance of an sRGB color per WCAG 2.1 specs.
 */
export function getRelativeLuminance(r: number, g: number, b: number): number {
  const [rs, gs, bs] = [r, g, b].map((c) => {
    const s = c / 255
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4)
  })
  return 0.2126 * rs! + 0.7152 * gs! + 0.0722 * bs!
}

/**
 * Calculates contrast ratio between two relative luminance values.
 */
export function getContrastRatio(lum1: number, lum2: number): number {
  const lighter = Math.max(lum1, lum2)
  const darker = Math.min(lum1, lum2)
  return (lighter + 0.05) / (darker + 0.05)
}

/**
 * Determines whether text on a background color should be white (#ffffff) or dark (#221d28)
 * to guarantee WCAG AA contrast (minimum 4.5:1).
 */
export function getAccessibleTextColor(hexColor: string): '#ffffff' | '#221d28' {
  const rgb = parseHex(hexColor)
  if (!rgb) return '#ffffff'
  const bgLuminance = getRelativeLuminance(rgb.r, rgb.g, rgb.b)
  const whiteLuminance = 1.0
  const darkLuminance = getRelativeLuminance(34, 29, 40) // #221d28

  const contrastWithWhite = getContrastRatio(bgLuminance, whiteLuminance)
  const contrastWithDark = getContrastRatio(bgLuminance, darkLuminance)

  return contrastWithWhite >= contrastWithDark ? '#ffffff' : '#221d28'
}

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
 * Derives light and dark variants from a brand primary color.
 *
 * Light: +10% lightness (capped at 0.9)
 * Dark:  -15% lightness (floored at 0.1)
 *
 * Mapping: crepuscule-500 (light) / crepuscule-600 (primary) / crepuscule-800 (dark)
 */
/**
 * Derives light, dark, and soft background tint variants from a brand primary color.
 *
 * Light:    +10% lightness (capped at 0.9)
 * Dark:     -15% lightness (floored at 0.1)
 * Lightest: Very pale, subtle pastel tint (lightness 0.97, soft saturation) for page/section backgrounds
 *
 * Mapping: crepuscule-500 (light) / crepuscule-600 (primary) / crepuscule-800 (dark) / crepuscule-50 (lightest/surface-page)
 */
export function deriveBrandVariants(brandColor: string): {
  primary: string
  primaryLight: string
  primaryDark: string
  primaryLightest: string
  surfaceHighlight: string
} {
  const rgb = parseHex(brandColor)
  if (!rgb) {
    return {
      primary: brandColor,
      primaryLight: brandColor,
      primaryDark: brandColor,
      primaryLightest: '#f9f8fa',
      surfaceHighlight: 'rgba(91, 75, 110, 0.04)'
    }
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)

  // Subtle pastel background tint: preserve brand hue, soften saturation (max 25%), very high lightness (97.5%)
  const softSaturation = Math.min(s, 0.25)
  const lightestHex = hslToHex(h, softSaturation, 0.975)
  const highlightRgba = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.04)`

  return {
    primary: brandColor,
    primaryLight: hslToHex(h, s, Math.min(0.9, l + 0.10)),
    primaryDark: hslToHex(h, s, Math.max(0.1, l - 0.15)),
    primaryLightest: lightestHex,
    surfaceHighlight: highlightRgba
  }
}

/**
 * Derives accent variants from a brand accent color (e.g. CTA).
 *
 * Hover: -8% lightness (floored at 0.1)
 */
export function deriveAccentVariants(brandAccentColor: string): {
  accent: string
  accentHover: string
  textOnAccent: '#ffffff' | '#221d28'
} {
  const rgb = parseHex(brandAccentColor)
  if (!rgb) {
    return {
      accent: brandAccentColor,
      accentHover: brandAccentColor,
      textOnAccent: '#ffffff'
    }
  }

  const { h, s, l } = rgbToHsl(rgb.r, rgb.g, rgb.b)

  return {
    accent: brandAccentColor,
    accentHover: hslToHex(h, s, Math.max(0.1, l - 0.08)),
    textOnAccent: getAccessibleTextColor(brandAccentColor)
  }
}

/**
 * Applies brand color CSS custom properties to the document root or element.
 */
export function applyBrandColors(
  style: CSSStyleSetter,
  brandColor?: string | null,
  brandAccentColor?: string | null
): void {
  if (brandColor && parseHex(brandColor)) {
    const variants = deriveBrandVariants(brandColor)
    style.setProperty(BRAND_CSS_VARS.primary, variants.primary)
    style.setProperty(BRAND_CSS_VARS.primaryLight, variants.primaryLight)
    style.setProperty(BRAND_CSS_VARS.primaryDark, variants.primaryDark)
    style.setProperty(BRAND_CSS_VARS.primaryLightest, variants.primaryLightest)
    style.setProperty(BRAND_CSS_VARS.surfacePage, variants.primaryLightest)
    style.setProperty(BRAND_CSS_VARS.crepuscule50, variants.primaryLightest)
    style.setProperty(BRAND_CSS_VARS.surfaceHighlight, variants.surfaceHighlight)
  } else {
    style.removeProperty(BRAND_CSS_VARS.primary)
    style.removeProperty(BRAND_CSS_VARS.primaryLight)
    style.removeProperty(BRAND_CSS_VARS.primaryDark)
    style.removeProperty(BRAND_CSS_VARS.primaryLightest)
    style.removeProperty(BRAND_CSS_VARS.surfacePage)
    style.removeProperty(BRAND_CSS_VARS.crepuscule50)
    style.removeProperty(BRAND_CSS_VARS.surfaceHighlight)
  }

  if (brandAccentColor && parseHex(brandAccentColor)) {
    const accentVariants = deriveAccentVariants(brandAccentColor)
    style.setProperty(BRAND_CSS_VARS.accent, accentVariants.accent)
    style.setProperty(BRAND_CSS_VARS.accentHover, accentVariants.accentHover)
    style.setProperty(BRAND_CSS_VARS.textOnAccent, accentVariants.textOnAccent)
  } else {
    style.removeProperty(BRAND_CSS_VARS.accent)
    style.removeProperty(BRAND_CSS_VARS.accentHover)
    style.removeProperty(BRAND_CSS_VARS.textOnAccent)
  }
}

/**
 * Removes brand color CSS custom properties.
 */
export function removeBrandColors(style: CSSStyleSetter): void {
  style.removeProperty(BRAND_CSS_VARS.primary)
  style.removeProperty(BRAND_CSS_VARS.primaryLight)
  style.removeProperty(BRAND_CSS_VARS.primaryDark)
  style.removeProperty(BRAND_CSS_VARS.primaryLightest)
  style.removeProperty(BRAND_CSS_VARS.surfacePage)
  style.removeProperty(BRAND_CSS_VARS.crepuscule50)
  style.removeProperty(BRAND_CSS_VARS.surfaceHighlight)
  style.removeProperty(BRAND_CSS_VARS.accent)
  style.removeProperty(BRAND_CSS_VARS.accentHover)
  style.removeProperty(BRAND_CSS_VARS.textOnAccent)
}
