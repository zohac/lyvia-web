/**
 * Kaora Design System — Input Component Configuration
 *
 * This file configures the Nuxt UI v4 UInput component with Kaora's organic luxury
 * aesthetic. The configuration uses Tailwind Variants to define slots, variants,
 * and compound variants that transform the default input into Kaora-styled fields.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  NUXT UI v4 INPUT ARCHITECTURE                                               ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  UInput renders:                                                             ║
 * ║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
 * ║  │ <div> (root)                                                            │ ║
 * ║  │   ├─ <span> (leading) ─── Optional leading content container            │ ║
 * ║  │   │    └─ <UIcon> (leadingIcon) or <UAvatar> (leadingAvatar)            │ ║
 * ║  │   ├─ <input> (base) ─── The actual input element                        │ ║
 * ║  │   └─ <span> (trailing) ─── Optional trailing content container          │ ║
 * ║  │        └─ <UIcon> (trailingIcon)                                        │ ║
 * ║  └─────────────────────────────────────────────────────────────────────────┘ ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @see docs/03_uiux/kaora/design system/Kaora Design System — Dropdown - Filters.md
 * @see https://ui.nuxt.com/components/input (Nuxt UI v4 Input documentation)
 *
 * @architecture Clean Architecture — Configuration Layer
 * @author Remy Chopoya
 */

export const kaoraInput = {
  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SLOTS — Target specific parts of the Input component
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Slots define the base styling for each structural element of the component.
   * These classes are always applied and can be extended by variants.
   */
  slots: {
    /**
     * ROOT — The outermost wrapper <div>
     *
     * Purpose: Provides positioning context for absolutely positioned icons
     * HTML: <div class="relative ...">
     *
     * @default "relative inline-flex items-center"
     */
    root: "relative w-full inline-flex items-center",

    /**
     * BASE — The actual <input> element
     *
     * Purpose: Main text input styling including background, border, typography,
     * focus states, and disabled states.
     *
     * HTML: <input class="w-full rounded-full ..." />
     *
     * Design notes:
     * - rounded-full: Kaora signature pill shape
     * - border-stone-900/10: Subtle warm border
     * - bg-[--color-surface-card]: Organic cream background
     * - placeholder text uses muted brand color
     * - Focus ring uses warm amber tones (Kaora accent)
     *
     * @see design-system.css .filter-trigger (lines 1166-1193)
     */
    base: [
      // Layout & sizing
      "w-full",
      // Shape — Kaora signature pill/rounded form
      "rounded-full",
      // Border — Subtle warm stone border
      "border border-stone-900/10",
      // Background — Organic card surface
      "bg-[color:var(--color-surface-card)]",
      // Typography
      "text-[color:var(--color-brand-primary)]",
      "font-medium",
      // Placeholder — Muted brand color
      "placeholder:text-[color:var(--color-brand-muted)]",
      // Transitions — Smooth state changes
      "transition-all duration-[var(--duration-normal)]",
      // Disabled state
      "disabled:opacity-55 disabled:cursor-not-allowed",
      // Focus — Remove default, custom styling via variants
      "focus:outline-none",
    ],

    /**
     * LEADING — Container for leading icon/avatar
     *
     * Purpose: Absolutely positioned container at the start of the input.
     * Used for icons like search, user avatars, etc.
     *
     * HTML: <span class="absolute inset-y-0 start-0 ...">
     *
     * Design notes:
     * - Flex centering ensures icon is vertically centered
     * - pointer-events-none prevents icon from blocking input focus
     */
    leading: "absolute inset-y-0 start-0 flex items-center pointer-events-none",

    /**
     * LEADING ICON — The <UIcon> inside leading container
     *
     * Purpose: Styles the icon element itself (size, color).
     *
     * HTML: <UIcon class="shrink-0 text-muted ..." />
     */
    leadingIcon: "shrink-0 text-[color:var(--color-brand-muted)]",

    /**
     * LEADING AVATAR — The <UAvatar> inside leading container
     *
     * Purpose: Styles an avatar shown at the start of the input.
     * Useful for user-related inputs or contact pickers.
     *
     * HTML: <UAvatar class="shrink-0" />
     */
    leadingAvatar: "shrink-0",

    /**
     * TRAILING — Container for trailing icon
     *
     * Purpose: Absolutely positioned container at the end of the input.
     * Used for icons like clear button, loading spinner, validation status.
     *
     * HTML: <span class="absolute inset-y-0 end-0 ...">
     */
    trailing: "absolute inset-y-0 end-0 flex items-center pointer-events-none",

    /**
     * TRAILING ICON — The <UIcon> inside trailing container
     *
     * Purpose: Styles the trailing icon element.
     *
     * HTML: <UIcon class="shrink-0 text-muted ..." />
     */
    trailingIcon: "shrink-0 text-[color:var(--color-brand-muted)]",
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * VARIANTS — Conditional styling based on props
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Variants allow different styles based on component props.
   * Each variant key corresponds to a prop that can be passed to UInput.
   */
  variants: {
    /**
     * FIELD GROUP — Styling for inputs in button groups
     *
     * Purpose: Adjusts border-radius when input is part of a horizontal
     * or vertical group (e.g., search input + search button).
     *
     * @prop fieldGroup?: 'horizontal' | 'vertical'
     */
    fieldGroup: {
      /**
       * horizontal: Input is in a horizontal row with siblings.
       * First item keeps rounded start, last keeps rounded end.
       */
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      /**
       * vertical: Input is in a vertical stack with siblings.
       * First item keeps rounded top, last keeps rounded bottom.
       */
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]",
    },

    /**
     * SIZE — Controls input height, padding, and typography
     *
     * Purpose: Provides consistent sizing across the design system.
     * All sizes maintain accessible touch targets (minimum 40px height).
     *
     * @prop size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
     *
     * Design notes:
     * - xs/sm: Compact interfaces, data-dense UIs
     * - md: Default, balanced for most use cases (44px = Fitts' Law)
     * - lg/xl: Prominent inputs, landing pages, mobile-first
     */
    size: {
      /**
       * xs (40px): Most compact size, for dense admin interfaces
       */
      xs: {
        base: "h-10 px-3 py-2 text-xs gap-2",
        leading: "ps-3",
        trailing: "pe-3",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      /**
       * sm (44px): Compact but accessible, good for forms with many fields
       */
      sm: {
        base: "h-11 px-3.5 py-2 text-xs gap-2",
        leading: "ps-3.5",
        trailing: "pe-3.5",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      /**
       * md (44px): Default size, optimal touch target (Fitts' Law)
       * Provides comfortable typing experience with clear visual hierarchy.
       */
      md: {
        base: "h-11 px-4 py-3 text-sm gap-3",
        leading: "ps-4",
        trailing: "pe-4",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      /**
       * lg (48px): Larger inputs for emphasis, mobile-friendly
       */
      lg: {
        base: "h-12 px-5 py-3 text-sm gap-3",
        leading: "ps-5",
        trailing: "pe-5",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      /**
       * xl (56px): Prominent inputs, hero sections, landing pages
       */
      xl: {
        base: "h-14 px-6 py-4 text-base gap-3",
        leading: "ps-6",
        trailing: "pe-6",
        leadingIcon: "size-6",
        leadingAvatarSize: "xs",
        trailingIcon: "size-6",
      },
    },

    /**
     * VARIANT — Visual style variations
     *
     * Purpose: Different visual treatments for different contexts.
     * Nuxt UI v4 supports: outline, soft, subtle, ghost, none
     *
     * @prop variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
     */
    variant: {
      /**
       * outline: Default Kaora input style
       * - Card surface background
       * - Subtle stone border
       * - Shadow elevation
       */
      outline: [
        "bg-[color:var(--color-surface-card)]",
        "border border-stone-900/10",
        "shadow-card",
      ].join(" "),

      /**
       * soft: Softer appearance, less prominent
       * - Field-specific background
       * - Subtle field border
       * - No shadow
       */
      soft: [
        "bg-[color:var(--field-bg)]",
        "border border-[color:var(--field-border)]",
        "shadow-none",
      ].join(" "),

      /**
       * subtle: Minimal styling, blends with content
       * - Highlight surface background
       * - Very soft border
       */
      subtle: [
        "bg-[color:var(--color-surface-highlight)]",
        "border border-[color:var(--color-border-soft)]",
        "shadow-none",
      ].join(" "),

      /**
       * ghost: Transparent until interaction
       * - No background or border by default
       * - Shows styling on hover/focus
       */
      ghost: ["bg-transparent", "border border-transparent", "shadow-none"].join(" "),

      /**
       * none: Completely unstyled base
       * - Use for custom implementations
       */
      none: "bg-transparent border-none shadow-none",
    },

    /**
     * COLOR — Semantic color variations
     *
     * Purpose: Apply semantic colors for different states/meanings.
     * Primarily affects focus ring color via compoundVariants.
     *
     * @prop color?: 'primary' | 'secondary' | 'success' | 'info' | 'warning' | 'error' | 'neutral'
     */
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: "",
    },

    /**
     * LEADING — Whether leading content is present
     *
     * Purpose: Boolean flag set automatically when leading icon/avatar is used.
     * Triggers compoundVariants to add left padding for the icon.
     *
     * @internal Set automatically by Nuxt UI
     */
    leading: {
      true: "",
    },

    /**
     * TRAILING — Whether trailing content is present
     *
     * Purpose: Boolean flag set automatically when trailing icon is used.
     * Triggers compoundVariants to add right padding for the icon.
     *
     * @internal Set automatically by Nuxt UI
     */
    trailing: {
      true: "",
    },

    /**
     * LOADING — Loading state indicator
     *
     * Purpose: When true, shows a loading spinner in the icon position.
     * Uses compoundVariants to apply spin animation.
     *
     * @prop loading?: boolean
     */
    loading: {
      true: "",
    },

    /**
     * TYPE — Input type-specific styling
     *
     * Purpose: Special styling for specific input types like file inputs.
     *
     * @prop type?: 'file' | 'text' | 'email' | 'password' | etc.
     */
    type: {
      file: "file:me-1.5 file:font-medium file:text-[color:var(--color-brand-muted)] file:outline-none",
    },
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * COMPOUND VARIANTS — Complex conditional styling
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Compound variants apply styles when multiple conditions are met.
   * This enables sophisticated state combinations without prop explosion.
   */
  compoundVariants: [
    // =========================================================================
    // HOVER & FOCUS STATES BY VARIANT
    // =========================================================================

    /**
     * Outline variant hover/focus states
     * - Elevates shadow on hover
     * - Warm amber focus ring (Kaora signature)
     */
    {
      variant: "outline",
      class: [
        "hover:bg-[color:var(--field-bg-hover)]",
        "hover:border-[color:var(--field-border-hover)]",
        "hover:shadow-floating",
        "focus:border-[color:var(--field-border-focus)]",
        "focus:shadow-[0_0_0_4px_var(--field-ring),var(--shadow-floating)]",
      ].join(" "),
    },

    /**
     * Soft variant hover/focus states
     */
    {
      variant: "soft",
      class: [
        "hover:bg-[color:var(--field-bg-hover)]",
        "hover:border-[color:var(--field-border-hover)]",
        "hover:shadow-card",
        "focus:border-[color:var(--field-border-focus)]",
        "focus:shadow-[0_0_0_4px_var(--field-ring)]",
      ].join(" "),
    },

    /**
     * Subtle variant hover/focus states
     */
    {
      variant: "subtle",
      class: [
        "hover:bg-[color:var(--color-surface-card)]",
        "hover:border-[color:var(--color-border-subtle)]",
        "focus:border-[color:var(--field-border-focus)]",
        "focus:shadow-[0_0_0_4px_var(--field-ring)]",
      ].join(" "),
    },

    /**
     * Ghost variant hover/focus states
     * - Reveals background/border on interaction
     */
    {
      variant: "ghost",
      class: [
        "hover:bg-[color:var(--color-surface-highlight)]",
        "hover:border-[color:var(--color-border-soft)]",
        "focus:bg-[color:var(--color-surface-highlight)]",
        "focus:border-[color:var(--field-border-focus)]",
        "focus:shadow-[0_0_0_4px_var(--field-ring)]",
      ].join(" "),
    },

    // =========================================================================
    // ERROR STATE (color: error)
    // =========================================================================

    /**
     * Error state styling
     * - Red border and focus ring
     * - Visual feedback for validation errors
     */
    {
      color: "error",
      class: [
        "border-red-500/50",
        "focus:border-red-500",
        "focus:shadow-[0_0_0_4px_rgba(239,68,68,0.15)]",
      ].join(" "),
    },

    // =========================================================================
    // LEADING ICON PADDING ADJUSTMENTS
    // =========================================================================

    /**
     * When leading icon is present, add padding to prevent text overlap.
     * Padding scales with size to maintain visual balance.
     */
    { leading: true, size: "xs", class: "ps-9" },
    { leading: true, size: "sm", class: "ps-9" },
    { leading: true, size: "md", class: "ps-10" },
    { leading: true, size: "lg", class: "ps-11" },
    { leading: true, size: "xl", class: "ps-12" },

    // =========================================================================
    // TRAILING ICON PADDING ADJUSTMENTS
    // =========================================================================

    /**
     * When trailing icon is present, add padding to prevent text overlap.
     */
    { trailing: true, size: "xs", class: "pe-9" },
    { trailing: true, size: "sm", class: "pe-9" },
    { trailing: true, size: "md", class: "pe-10" },
    { trailing: true, size: "lg", class: "pe-11" },
    { trailing: true, size: "xl", class: "pe-12" },

    // =========================================================================
    // LOADING STATE ANIMATIONS
    // =========================================================================

    /**
     * Loading with leading icon: Spin the leading icon
     */
    {
      loading: true,
      leading: true,
      class: {
        leadingIcon: "animate-spin",
      },
    },

    /**
     * Loading with trailing icon (no leading): Spin the trailing icon
     */
    {
      loading: true,
      leading: false,
      trailing: true,
      class: {
        trailingIcon: "animate-spin",
      },
    },
  ],

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * DEFAULT VARIANTS — Applied when no prop is specified
   * ═══════════════════════════════════════════════════════════════════════════
   */
  defaultVariants: {
    /** Default size: md (44px) — Optimal touch target per Fitts' Law */
    size: "md",
    /** Default color: primary — Warm amber focus ring */
    color: "primary",
    /** Default variant: outline — Standard Kaora input appearance */
    variant: "outline",
  },
};
