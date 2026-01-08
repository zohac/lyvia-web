import { kaoraAlert } from "./config/design-system/kaora-alert";
import { kaoraBadge } from "./config/design-system/kaora-badge";
import { kaoraButton } from "./config/design-system/kaora-button";
import { kaoraCard } from "./config/design-system/kaora-card";
import { kaoraInput } from "./config/design-system/kaora-input";
import { kaoraLink } from "./config/design-system/kaora-link";

export default defineAppConfig({
  ui: {
    // =========================================================================
    // COLORS — Kaora Design System
    // =========================================================================
    // NOTE: Despite `primary: 'kaora'` here, main.css overrides --ui-primary
    // to use stone-900 (#1c1917) to match the design system CTA specification.
    // Kaora palette is exposed as --ui-color-accent-* for links/highlights.
    // =========================================================================
    colors: {
      primary: 'kaora',  // Overridden in main.css → stone-900 for CTAs
      neutral: 'stone'
    },

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
  }
})
