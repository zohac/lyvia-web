/**
 * Keova Design System — Color Configuration
 *
 * Defines semantic color roles for Nuxt UI v4 components.
 *
 * ## Semantic Mapping
 *
 * - **primary**: Main CTA color (stone-900 for dark backgrounds)
 * - **secondary**: Accent/brand color (keova-700 for warm highlights)
 * - **neutral**: Neutral gray scale (stone palette)
 * - **success**: Positive state (sage green)
 * - **warning**: Attention state (amber)
 * - **error**: Negative state (red)
 *
 * ## Design System Reference
 *
 * @see docs/03_uiux/kaora/COLOR_SYSTEM.md
 * @see docs/03_uiux/kaora/exemples/design-system.css
 *
 * @architecture Clean Architecture — Configuration Layer
 * @author Remy Chopoya
 */
export const keovaColors = {
  // =========================================================================
  // SEMANTIC COLORS — Role-based palette mapping
  // =========================================================================

  /**
   * Primary CTA color
   * Used for main call-to-action buttons (solid variant)
   * Renders as stone-900 (#1c1917) with white text
   */
  primary: 'stone',

  /**
   * Secondary/accent color
   * Used for links, outlined buttons, and brand highlights
   * Renders as keova-700 (#7a6251)
   */
  secondary: 'keova',

  /**
   * Neutral gray scale
   * Used for borders, backgrounds, and subtle elements
   */
  neutral: 'stone',

  // =========================================================================
  // STATE COLORS
  // =========================================================================

  /**
   * Success/positive state
   * Sage green (#b5c0a3)
   */
  success: 'green',

  /**
   * Warning/attention state
   * Amber tone
   */
  warning: 'amber',

  /**
   * Error/danger state
   * Dark red (#b60010) for better contrast
   */
  error: 'red'
} as const

/**
 * Type-safe color keys
 */
export type KeovaColorKey = keyof typeof keovaColors
