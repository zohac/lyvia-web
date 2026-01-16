import { kaoraAlert } from './config/design-system/kaora-alert'
import { kaoraBadge } from './config/design-system/kaora-badge'
import { kaoraButton } from './config/design-system/kaora-button'
import { kaoraCard } from './config/design-system/kaora-card'
import { kaoraColors } from './config/design-system/kaora-colors'
import { kaoraInput } from './config/design-system/kaora-input'
import { kaoraLink } from './config/design-system/kaora-link'
import { kaoraSelect } from './config/design-system/kaora-select'
import { kaoraTabs } from './config/design-system/kaora-tabs'

export default defineAppConfig({
  ui: {
    // =========================================================================
    // COLORS — Kaora Design System (Semantic Mapping)
    // =========================================================================
    // Aligned with design system spec:
    //   - primary: stone (CTA → stone-900 background + white text)
    //   - secondary: kaora (accents/links → kaora-700 text/border)
    //
    // @see app/config/design-system/kaora-colors.ts
    // @see docs/03_uiux/kaora/COLOR_SYSTEM.md
    // =========================================================================
    colors: kaoraColors,

    // =========================================================================
    // BUTTON — Organic Luxury Theme
    // =========================================================================
    button: kaoraButton,

    // =========================================================================
    // BADGE — Organic Luxury Theme
    // =========================================================================
    badge: kaoraBadge,

    // =========================================================================
    // CARD — Organic Luxury Theme
    // =========================================================================

    link: kaoraLink,

    // =========================================================================
    // CARD — Organic Luxury Theme
    // =========================================================================
    card: kaoraCard,

    // =========================================================================
    // INPUT — Organic Luxury Theme
    // =========================================================================
    input: kaoraInput,

    // =========================================================================
    // ALERT — Organic Luxury Theme
    // =========================================================================
    alert: kaoraAlert,

    // =========================================================================
    // SELECT — Organic Luxury Theme
    // =========================================================================
    select: kaoraSelect,

    // =========================================================================
    // Tabs — Organic Luxury Theme
    // =========================================================================
    tabs: kaoraTabs
  }
})
