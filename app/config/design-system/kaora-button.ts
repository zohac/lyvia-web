/**
 * Kaora Design System — Button Component Configuration
 *
 * CRITICAL: Uses explicit CSS variables instead of Nuxt UI utility classes
 * to ensure correct color rendering aligned with design system spec.
 *
 * @architecture Clean Architecture — Configuration Layer
 * @author Remy Chopoya
 */

export const kaoraButton = {
  slots: {
    base: [
      // Layout
      "rounded-full",
      "font-bold",
      "inline-flex items-center justify-center gap-2",
      // Interaction
      "transition-all duration-[var(--duration-normal)]",
      "select-none",
      // Disabled states (cursor only, opacity handled per variant for better contrast)
      "disabled:cursor-not-allowed aria-disabled:cursor-not-allowed",
      // Focus
      "focus-visible:outline-[3px] focus-visible:outline-offset-2",
    ],
    label: "truncate",
    leadingIcon: "shrink-0",
    leadingAvatar: "shrink-0",
    leadingAvatarSize: "",
    trailingIcon: "shrink-0",
  },

  variants: {
    color: {
      primary: "",
      secondary: "",
      neutral: "",
      success: "",
      warning: "",
      error: "",
      info: "",
    },

    variant: {
      solid: "",
      outline: "",
      soft: "",
      subtle: "",
      ghost: "",
      link: "",
    },

    size: {
      xs: {
        base: "px-4 py-2 text-xs gap-1.5",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      sm: {
        base: "px-5 py-2.5 text-sm gap-2",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      md: {
        base: "px-6 py-3 text-base gap-2",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      lg: {
        base: "px-7 py-3.5 text-base gap-2.5",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      xl: {
        base: "px-8 py-4 text-lg gap-3",
        leadingIcon: "size-6",
        leadingAvatarSize: "xs",
        trailingIcon: "size-6",
      },
    },

    block: {
      true: {
        base: "w-full justify-center",
        trailingIcon: "ms-auto",
      },
    },
  },

  compoundVariants: [
    // =========================================================================
    // PRIMARY (STONE-900) — CTA PRINCIPAL
    // =========================================================================
    {
      color: "primary",
      variant: "solid",
      class: [
        "bg-[color:var(--color-accent-main)]",           // stone-900 (#1c1917)
        "text-[color:var(--color-accent-contrast)]",     // white
        "hover:bg-[color:var(--color-accent-hover)]",    // stone-800
        "focus-visible:outline-[color:var(--color-accent-main)]",
        "active:scale-[0.98]",
        // Disabled: lighter background with good contrast
        "disabled:bg-[color:var(--color-stone-400)]",     // stone-400 (#a8a29e) lighter
        "disabled:text-white",                             // white text maintained
        "aria-disabled:bg-[color:var(--color-stone-400)]",
        "aria-disabled:text-white",
      ].join(" "),
    },
    {
      color: "primary",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-brand-primary)]",
        "text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-surface-highlight)]",
        "focus-visible:outline-[color:var(--color-brand-primary)]",
        // Disabled: lighter border and text
        "disabled:border-[color:var(--color-stone-300)]",
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:border-[color:var(--color-stone-300)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "primary",
      variant: "soft",
      class: [
        "bg-[color:var(--color-surface-highlight)]",
        "text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-brand-subtle)]",
        "focus-visible:outline-[color:var(--color-brand-primary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "primary",
      variant: "subtle",
      class: [
        "bg-[color:var(--color-surface-highlight)]",
        "text-[color:var(--color-brand-primary)]",
        "border border-[color:var(--color-brand-subtle)]",
        "hover:bg-[color:var(--color-brand-subtle)]",
        "focus-visible:outline-[color:var(--color-brand-primary)]",
        // Disabled: lighter text and border
        "disabled:text-[color:var(--color-stone-400)]",
        "disabled:border-[color:var(--color-stone-300)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:border-[color:var(--color-stone-300)]",
      ].join(" "),
    },
    {
      color: "primary",
      variant: "ghost",
      class: [
        "text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-surface-highlight)]",
        "focus-visible:outline-[color:var(--color-brand-primary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "primary",
      variant: "link",
      class: [
        "text-[color:var(--color-brand-primary)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-brand-primary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },

    // =========================================================================
    // SECONDARY (KAORA-700) — BRAND ACCENT
    // =========================================================================
    {
      color: "secondary",
      variant: "solid",
      class: [
        "bg-[color:var(--color-brand-accent)]",         // kaora-700 (#7a6251)
        "text-white",
        "hover:bg-[color:var(--color-kaora-800)]",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
        "active:scale-[0.98]",
      ].join(" "),
    },
    {
      color: "secondary",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-brand-accent)]",
        "text-[color:var(--color-brand-accent)]",
        "hover:bg-[color:rgba(212,184,160,0.08)]",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
      ].join(" "),
    },
    {
      color: "secondary",
      variant: "soft",
      class: [
        "bg-[color:rgba(212,184,160,0.12)]",
        "text-[color:var(--color-brand-accent)]",
        "hover:bg-[color:rgba(212,184,160,0.18)]",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
      ].join(" "),
    },
    {
      color: "secondary",
      variant: "subtle",
      class: [
        "bg-[color:rgba(212,184,160,0.12)]",
        "text-[color:var(--color-brand-accent)]",
        "border border-[color:rgba(212,184,160,0.25)]",
        "hover:bg-[color:rgba(212,184,160,0.18)]",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
      ].join(" "),
    },
    {
      color: "secondary",
      variant: "ghost",
      class: [
        "text-[color:var(--color-brand-accent)]",
        "hover:bg-[color:rgba(212,184,160,0.08)]",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
      ].join(" "),
    },
    {
      color: "secondary",
      variant: "link",
      class: [
        "text-[color:var(--color-brand-accent)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-brand-accent)]",
      ].join(" "),
    },

    // =========================================================================
    // NEUTRAL (STONE) — SECONDARY ACTIONS
    // =========================================================================
    {
      color: "neutral",
      variant: "solid",
      class: [
        "bg-[color:var(--color-brand-secondary)]",     // stone-600
        "text-white",
        "hover:bg-[color:var(--color-brand-primary)]", // stone-900
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        "active:scale-[0.98]",
        // Disabled: lighter background with good contrast
        "disabled:bg-[color:var(--color-stone-400)]",     // stone-400 (#a8a29e)
        "disabled:text-white",
        "aria-disabled:bg-[color:var(--color-stone-400)]",
        "aria-disabled:text-white",
      ].join(" "),
    },
    {
      color: "neutral",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-brand-subtle)]",
        "bg-[color:var(--color-surface-card)]",
        "text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-surface-highlight)]",
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        // Disabled: lighter border and text
        "disabled:border-[color:var(--color-stone-300)]",
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:border-[color:var(--color-stone-300)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "neutral",
      variant: "soft",
      class: [
        "bg-[color:var(--color-surface-highlight)]",
        "text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-brand-subtle)]",
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "neutral",
      variant: "subtle",
      class: [
        "bg-[color:var(--color-surface-highlight)]",
        "text-[color:var(--color-brand-secondary)]",
        "border border-[color:var(--color-brand-subtle)]",
        "hover:bg-[color:var(--color-brand-subtle)]",
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        // Disabled: lighter text and border
        "disabled:text-[color:var(--color-stone-400)]",
        "disabled:border-[color:var(--color-stone-300)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:border-[color:var(--color-stone-300)]",
      ].join(" "),
    },
    {
      color: "neutral",
      variant: "ghost",
      class: [
        "text-[color:var(--color-brand-secondary)]",
        "hover:text-[color:var(--color-brand-primary)]",
        "hover:bg-[color:var(--color-surface-highlight)]",
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },
    {
      color: "neutral",
      variant: "link",
      class: [
        "text-[color:var(--color-brand-muted)]",
        "hover:text-[color:var(--color-brand-primary)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-brand-secondary)]",
        // Disabled: lighter text
        "disabled:text-[color:var(--color-stone-400)]",
        "aria-disabled:text-[color:var(--color-stone-400)]",
      ].join(" "),
    },

    // =========================================================================
    // SUCCESS (SAGE GREEN) — POSITIVE STATES
    // =========================================================================
    {
      color: "success",
      variant: "solid",
      class: [
        "bg-[color:var(--color-success)]",
        "text-[color:var(--color-success-800)]",    // Dark text for contrast
        "hover:opacity-90",
        "focus-visible:outline-[color:var(--color-success)]",
        "active:scale-[0.98]",
      ].join(" "),
    },
    {
      color: "success",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-success)]",
        "text-[color:var(--color-success-600)]",
        "hover:bg-[color:var(--color-success-50)]",
        "focus-visible:outline-[color:var(--color-success)]",
      ].join(" "),
    },
    {
      color: "success",
      variant: "soft",
      class: [
        "bg-[color:rgba(181,192,163,0.12)]",
        "text-[color:var(--color-success-600)]",
        "hover:bg-[color:rgba(181,192,163,0.18)]",
        "focus-visible:outline-[color:var(--color-success)]",
      ].join(" "),
    },
    {
      color: "success",
      variant: "subtle",
      class: [
        "bg-[color:rgba(181,192,163,0.12)]",
        "text-[color:var(--color-success-600)]",
        "border border-[color:rgba(181,192,163,0.25)]",
        "hover:bg-[color:rgba(181,192,163,0.18)]",
        "focus-visible:outline-[color:var(--color-success)]",
      ].join(" "),
    },
    {
      color: "success",
      variant: "ghost",
      class: [
        "text-[color:var(--color-success-600)]",
        "hover:bg-[color:var(--color-success-50)]",
        "focus-visible:outline-[color:var(--color-success)]",
      ].join(" "),
    },
    {
      color: "success",
      variant: "link",
      class: [
        "text-[color:var(--color-success-600)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-success)]",
      ].join(" "),
    },

    // =========================================================================
    // WARNING (AMBER) — ATTENTION STATES
    // =========================================================================
    {
      color: "warning",
      variant: "solid",
      class: [
        "bg-[color:var(--color-warning)]",
        "hover:opacity-90",
        "focus-visible:outline-[color:var(--color-warning)]",
        "active:scale-[0.98]",
      ].join(" "),
    },
    {
      color: "warning",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-warning)]",
        "text-[color:var(--color-warning)]",
        "hover:bg-[color:rgba(217,119,6,0.08)]",
        "focus-visible:outline-[color:var(--color-warning)]",
      ].join(" "),
    },
    {
      color: "warning",
      variant: "soft",
      class: [
        "bg-[color:rgba(217,119,6,0.14)]",
        "text-[color:var(--color-warning)]",
        "hover:bg-[color:rgba(217,119,6,0.20)]",
        "focus-visible:outline-[color:var(--color-warning)]",
      ].join(" "),
    },
    {
      color: "warning",
      variant: "subtle",
      class: [
        "bg-[color:rgba(217,119,6,0.14)]",
        "text-[color:var(--color-warning)]",
        "border border-[color:rgba(217,119,6,0.25)]",
        "hover:bg-[color:rgba(217,119,6,0.20)]",
        "focus-visible:outline-[color:var(--color-warning)]",
      ].join(" "),
    },
    {
      color: "warning",
      variant: "ghost",
      class: [
        "text-[color:var(--color-warning)]",
        "hover:bg-[color:rgba(217,119,6,0.08)]",
        "focus-visible:outline-[color:var(--color-warning)]",
      ].join(" "),
    },
    {
      color: "warning",
      variant: "link",
      class: [
        "text-[color:var(--color-warning)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-warning)]",
      ].join(" "),
    },

    // =========================================================================
    // ERROR (RED) — DESTRUCTIVE ACTIONS
    // =========================================================================
    {
      color: "error",
      variant: "solid",
      class: [
        "bg-[color:var(--color-error)]",
        "text-white",
        "hover:opacity-90",
        "focus-visible:outline-[color:var(--color-error)]",
        "active:scale-[0.98]",
      ].join(" "),
    },
    {
      color: "error",
      variant: "outline",
      class: [
        "border-2 border-[color:var(--color-error)]",
        "text-[color:var(--color-error)]",
        "hover:bg-[color:rgba(239,68,68,0.08)]",
        "focus-visible:outline-[color:var(--color-error)]",
      ].join(" "),
    },
    {
      color: "error",
      variant: "soft",
      class: [
        "bg-[color:rgba(239,68,68,0.1)]",
        "text-[color:var(--color-error)]",
        "hover:bg-[color:rgba(239,68,68,0.16)]",
        "focus-visible:outline-[color:var(--color-error)]",
      ].join(" "),
    },
    {
      color: "error",
      variant: "subtle",
      class: [
        "bg-[color:rgba(239,68,68,0.1)]",
        "text-[color:var(--color-error)]",
        "border border-[color:rgba(239,68,68,0.22)]",
        "hover:bg-[color:rgba(239,68,68,0.16)]",
        "focus-visible:outline-[color:var(--color-error)]",
      ].join(" "),
    },
    {
      color: "error",
      variant: "ghost",
      class: [
        "text-[color:var(--color-error)]",
        "hover:bg-[color:rgba(239,68,68,0.08)]",
        "focus-visible:outline-[color:var(--color-error)]",
      ].join(" "),
    },
    {
      color: "error",
      variant: "link",
      class: [
        "text-[color:var(--color-error)]",
        "hover:underline underline-offset-4",
        "focus-visible:outline-[color:var(--color-error)]",
      ].join(" "),
    },

    // =========================================================================
    // INFO (BLUE) — INFORMATIONAL STATES
    // =========================================================================
    {
      color: "info",
      variant: "solid",
      class: [
        "bg-blue-600",
        "text-white",
        "hover:bg-blue-700",
        "focus-visible:outline-blue-600",
        "active:scale-[0.98]",
      ].join(" "),
    },
    {
      color: "info",
      variant: "outline",
      class: [
        "border-2 border-blue-600",
        "text-blue-600",
        "hover:bg-blue-50",
        "focus-visible:outline-blue-600",
      ].join(" "),
    },
    {
      color: "info",
      variant: "soft",
      class: [
        "bg-blue-50",
        "text-blue-700",
        "hover:bg-blue-100",
        "focus-visible:outline-blue-600",
      ].join(" "),
    },
    {
      color: "info",
      variant: "subtle",
      class: [
        "bg-blue-50",
        "text-blue-700",
        "border border-blue-200",
        "hover:bg-blue-100",
        "focus-visible:outline-blue-600",
      ].join(" "),
    },
    {
      color: "info",
      variant: "ghost",
      class: [
        "text-blue-600",
        "hover:bg-blue-50",
        "focus-visible:outline-blue-600",
      ].join(" "),
    },
    {
      color: "info",
      variant: "link",
      class: [
        "text-blue-600",
        "hover:underline underline-offset-4",
        "focus-visible:outline-blue-600",
      ].join(" "),
    },
  ],

  defaultVariants: {
    color: "primary",
    variant: "solid",
    size: "md",
  },
};
