/**
 * Keova Design System — Color Configuration for Nuxt UI v4
 *
 * Maps Nuxt UI semantic color roles to Crepuscule palette names.
 * These names must match the @theme color scales defined in main.css.
 *
 * - primary → crepuscule (violet)
 * - secondary → sunset (orange accent)
 * - neutral → neutral (violet-tinted grays)
 * - success/warning/error → semantic scales from main.css
 */
export const keovaColors = {
  primary: 'crepuscule',
  secondary: 'sunset',
  neutral: 'neutral',
  success: 'success',
  warning: 'sunset',
  error: 'error'
} as const

export type KeovaColorKey = keyof typeof keovaColors
