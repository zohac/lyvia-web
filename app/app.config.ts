import { keovaButton } from './config/design-system/keova-button'
import { keovaCard } from './config/design-system/keova-card'

export default defineAppConfig({
  ui: {
    // =========================================================================
    // COLORS — Keova Design System (Semantic Mapping)
    // =========================================================================
    // Aligned with design system spec:
    //   - primary: stone (CTA → stone-900 background + white text)
    //   - secondary: keova (accents/links → keova-700 text/border)
    //
    // @see app/config/design-system/keova-colors.ts
    // @see docs/03_uiux/kaora/COLOR_SYSTEM.md
    // =========================================================================
    // colors: keovaColors,

    // =========================================================================
    // BUTTON — Keova DS (9 compound variants)
    // =========================================================================
    button: keovaButton,

    // =========================================================================
    // BADGE — Organic Luxury Theme
    // =========================================================================
    // badge: keovaBadge,

    // =========================================================================
    // CARD — Keova DS (2 variants: base + featured)
    // =========================================================================

    // link: keovaLink,

    // =========================================================================
    // CARD — Keova DS (2 variants: base + featured)
    // =========================================================================
    card: keovaCard

    // =========================================================================
    // INPUT — Organic Luxury Theme
    // =========================================================================
    // input: keovaInput,

    // =========================================================================
    // ALERT — Organic Luxury Theme
    // =========================================================================
    // alert: keovaAlert,

    // =========================================================================
    // SELECT — Organic Luxury Theme
    // =========================================================================
    // select: keovaSelect,

    // =========================================================================
    // Tabs — Organic Luxury Theme
    // =========================================================================
    // tabs: keovaTabs
  }
})
