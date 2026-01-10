/**
 * Kaora Design System — Cards (Organic / Glass / Ops)
 *
 * 3 familles de cards:
 * - organic: contenu principal (80% du produit)
 * - glass: panneaux premium, sidebars (parcimonieux)
 * - ops: items denses (RDV, logs, listes)
 *
 * Modifiers:
 * - ink: CTA sombre "Your Next Action" (1 max par écran)
 *
 * Densités:
 * - cozy: px-6 py-5 (défaut)
 * - compact: px-5 py-4
 * - tight: px-4 py-3 (ops items)
 *
 * États:
 * - interactive: hover:shadow-floating + micro-lift
 * - disabled: opacity-55 + cursor-not-allowed
 *
 * Rails (ops):
 * - rail + railColor pour border-l-4 coloré par statut
 *
 * Shape: utiliser class="rounded-blob-a|b|c|d" sur le composant
 */
export const kaoraCard = {
  slots: {
    root: [
      "relative",
      "border",
      "overflow-hidden",
      "transition-all duration-200 ease-out",
    ].join(" "),
    header: "px-6 py-5",
    body: "px-6 py-5",
    footer: "px-6 py-5",
  },

  variants: {
    // === Familles de cards ===
    variant: {
      // Organic: contenu principal (défaut)
      organic: {
        root: [
          "bg-[color:var(--color-surface-card)]",
          "border-[rgba(231,229,228,0.7)]",
          "shadow-[var(--shadow-card)]",
        ].join(" "),
      },

      // Glass: panneaux premium, sidebars
      glass: {
        root: [
          "bg-[rgba(255,255,255,0.75)]",
          "border-white/60",
          "shadow-[var(--shadow-card)]",
          "backdrop-blur-[12px]",
        ].join(" "),
      },

      // Ops: items denses (RDV, logs)
      ops: {
        root: [
          "bg-[rgba(255,255,255,0.6)]",
          "border-white/60",
          "shadow-[var(--shadow-card)]",
        ].join(" "),
      },

      // Ink: CTA sombre "Your Next Action" (1 max par écran)
      ink: {
        root: [
          "bg-[color:var(--color-ink)]",
          "border-[color:var(--color-ink)]",
          "text-white",
          "shadow-[var(--shadow-card)]",
        ].join(" "),
      },
    },

    // === Densités (padding) ===
    density: {
      cozy: {
        header: "px-6 py-5",
        body: "px-6 py-5",
        footer: "px-6 py-5",
      },
      compact: {
        header: "px-5 py-4",
        body: "px-5 py-4",
        footer: "px-5 py-4",
      },
      tight: {
        header: "px-4 py-3",
        body: "px-4 py-3",
        footer: "px-4 py-3",
      },
    },

    // === État interactif ===
    interactive: {
      true: {
        root: [
          "cursor-pointer",
          "hover:shadow-[var(--shadow-floating)]",
          "hover:-translate-y-px",
          "active:scale-[0.99]",
          "active:translate-y-0",
          "focus-visible:outline-2",
          "focus-visible:outline-offset-2",
          "focus-visible:outline-[color:var(--color-brand)]",
        ].join(" "),
      },
      false: {
        root: "",
      },
    },

    // === État désactivé ===
    disabled: {
      true: {
        root: "opacity-55 cursor-not-allowed pointer-events-none",
      },
      false: {
        root: "",
      },
    },

    // === Rail latéral (ops) ===
    rail: {
      true: {
        root: "border-l-4",
      },
      false: {
        root: "",
      },
    },

    // === Couleur du rail ===
    railColor: {
      neutral: {
        root: "border-l-[color:var(--color-stone-300)]",
      },
      brand: {
        root: "border-l-[color:var(--color-brand)]",
      },
      success: {
        root: "border-l-[color:var(--color-success)]",
      },
      warning: {
        root: "border-l-[color:var(--color-warning)]",
      },
      error: {
        root: "border-l-[color:var(--color-error)]",
      },
    },
  },

  compoundVariants: [
    // Rail actif seulement si rail=true
    {
      rail: false,
      railColor: "neutral",
      class: { root: "border-l-[rgba(231,229,228,0.7)]" },
    },
    {
      rail: false,
      railColor: "brand",
      class: { root: "border-l-[rgba(231,229,228,0.7)]" },
    },
    {
      rail: false,
      railColor: "success",
      class: { root: "border-l-[rgba(231,229,228,0.7)]" },
    },
    {
      rail: false,
      railColor: "warning",
      class: { root: "border-l-[rgba(231,229,228,0.7)]" },
    },
    {
      rail: false,
      railColor: "error",
      class: { root: "border-l-[rgba(231,229,228,0.7)]" },
    },

    // Ink + interactive: hover avec shadow mais pas de changement de bg
    {
      variant: "ink",
      interactive: true,
      class: {
        root: "hover:shadow-[var(--shadow-floating)]",
      },
    },
  ],

  defaultVariants: {
    variant: "organic",
    density: "cozy",
    interactive: false,
    disabled: false,
    rail: false,
  },
};
