/**
 * Keova Design System — Select Component Configuration
 *
 * This file configures the Nuxt UI v4 USelect component with Keova's organic luxury
 * aesthetic. The configuration uses Tailwind Variants to define slots, variants,
 * and compound variants that transform the default select into Keova-styled dropdowns.
 *
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  NUXT UI v4 SELECT ARCHITECTURE                                              ║
 * ╠══════════════════════════════════════════════════════════════════════════════╣
 * ║  USelect renders two main structures:                                        ║
 * ║                                                                              ║
 * ║  TRIGGER (closed state):                                                     ║
 * ║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
 * ║  │ <button> (base)                                                         │ ║
 * ║  │   ├─ <span> (leading) ─── Optional leading content container            │ ║
 * ║  │   │    └─ <UIcon> (leadingIcon) or <UAvatar> (leadingAvatar)            │ ║
 * ║  │   ├─ <span> (value/placeholder) ─── Selected value or placeholder       │ ║
 * ║  │   └─ <span> (trailing) ─── Trailing content + arrow                     │ ║
 * ║  │        ├─ <UIcon> (trailingIcon)                                        │ ║
 * ║  │        └─ <UIcon> (arrow) ─── Dropdown caret                            │ ║
 * ║  └─────────────────────────────────────────────────────────────────────────┘ ║
 * ║                                                                              ║
 * ║  DROPDOWN PANEL (open state):                                                ║
 * ║  ┌─────────────────────────────────────────────────────────────────────────┐ ║
 * ║  │ <div> (content) ─── Floating panel container                            │ ║
 * ║  │   └─ <div> (viewport) ─── Scrollable area                               │ ║
 * ║  │        ├─ <div> (group) ─── Option group wrapper                        │ ║
 * ║  │        │    ├─ <span> (label) ─── Group label                           │ ║
 * ║  │        │    └─ <div> (separator) ─── Group separator                    │ ║
 * ║  │        ├─ <div> (item) ─── Individual option                            │ ║
 * ║  │        │    ├─ <UIcon> (itemLeadingIcon)                                │ ║
 * ║  │        │    ├─ <UAvatar> (itemLeadingAvatar)                            │ ║
 * ║  │        │    ├─ <UChip> (itemLeadingChip)                                │ ║
 * ║  │        │    ├─ <div> (itemWrapper)                                      │ ║
 * ║  │        │    │    ├─ <span> (itemLabel)                                  │ ║
 * ║  │        │    │    └─ <span> (itemDescription)                            │ ║
 * ║  │        │    └─ <span> (itemTrailing)                                    │ ║
 * ║  │        │         └─ <UIcon> (itemTrailingIcon)                          │ ║
 * ║  │        └─ <div> (empty) ─── Shown when no options match                 │ ║
 * ║  └─────────────────────────────────────────────────────────────────────────┘ ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 *
 * @see docs/03_uiux/kaora/design system/Kaora Design System — Dropdown - Filters.md
 * @see docs/03_uiux/kaora/exemples/dropdown-filters.html
 * @see docs/03_uiux/kaora/exemples/design-system.css (lines 1166-1368)
 * @see https://ui.nuxt.com/components/select (Nuxt UI v4 Select documentation)
 *
 * Source of truth: .filter-trigger, .dropdown-panel, .dropdown-item classes
 *
 * @architecture Clean Architecture — Configuration Layer
 * @author Remy Chopoya
 */

export const keovaSelect = {
  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * SLOTS — Target specific parts of the Select component
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Slots define the base styling for each structural element of the component.
   * These classes are always applied and can be extended by variants.
   */
  slots: {
    // =========================================================================
    // TRIGGER SLOTS — The clickable button that opens the dropdown
    // =========================================================================

    /**
     * BASE — The trigger <button> element
     *
     * Purpose: Main select trigger styling including background, border, typography,
     * focus states, and disabled states. Based on .filter-trigger (line 1166-1193).
     *
     * HTML: <button class="relative group rounded-full ..." />
     *
     * Design notes:
     * - rounded-full: Keova signature pill shape
     * - border-stone-900/10: Subtle warm border
     * - font-semibold: Bolder text for filter prominence
     * - group class: Enables child hover states
     */
    base: [
      // Layout & shape (from .filter-trigger line 1166-1193)
      'relative group rounded-full inline-flex items-center justify-between',
      'w-full',
      // Typography
      'font-semibold text-[color:var(--color-brand-primary)]',
      // Interaction
      'transition-all duration-[var(--duration-normal)]',
      'cursor-pointer',
      // Border
      'border border-stone-900/10',
      // Disabled
      'disabled:cursor-not-allowed disabled:opacity-55',
      // Focus (removed default outline, handled in compoundVariants)
      'focus:outline-none'
    ],

    /**
     * LEADING — Container for leading icon/avatar
     *
     * Purpose: Absolutely positioned container at the start of the trigger.
     * Used for icons like category indicators, status icons.
     *
     * HTML: <span class="absolute inset-y-0 start-0 ...">
     */
    leading: 'absolute inset-y-0 start-0 flex items-center',

    /**
     * LEADING ICON — The <UIcon> inside leading container
     *
     * Purpose: Styles the leading icon element (size, color).
     * Uses secondary brand color for visual hierarchy.
     *
     * HTML: <UIcon class="shrink-0 text-secondary ..." />
     */
    leadingIcon: 'shrink-0 text-[color:var(--color-brand-secondary)]',

    /**
     * LEADING AVATAR — The <UAvatar> inside leading container
     *
     * Purpose: Styles an avatar shown at the start of the trigger.
     * Useful for user selection or contact pickers.
     *
     * HTML: <UAvatar class="shrink-0" />
     */
    leadingAvatar: 'shrink-0',

    /**
     * LEADING AVATAR SIZE — Avatar size class name
     *
     * Purpose: Specifies the size variant for the leading avatar.
     * Controlled via size variants (2xs, 3xs, xs).
     *
     * @internal Mapped by size variant
     */
    leadingAvatarSize: '',

    /**
     * TRAILING — Container for trailing icon and arrow
     *
     * Purpose: Absolutely positioned container at the end of the trigger.
     * Contains optional trailing icon and the dropdown arrow.
     *
     * HTML: <span class="absolute inset-y-0 end-0 ...">
     */
    trailing: 'absolute inset-y-0 end-0 flex items-center',

    /**
     * TRAILING ICON — The <UIcon> inside trailing container
     *
     * Purpose: Optional trailing icon (e.g., clear button, status indicator).
     * Uses secondary brand color.
     *
     * HTML: <UIcon class="shrink-0 text-secondary ..." />
     */
    trailingIcon: 'shrink-0 text-[color:var(--color-brand-secondary)]',

    /**
     * VALUE — The displayed selected value text
     *
     * Purpose: Styles the text showing the current selection.
     * Truncates with ellipsis to prevent overflow.
     *
     * HTML: <span class="truncate ...">Selected Option</span>
     */
    value: 'truncate pointer-events-none',

    /**
     * PLACEHOLDER — The placeholder text when no value selected
     *
     * Purpose: Styles the placeholder text shown before selection.
     * Uses muted color for visual distinction from actual values.
     *
     * HTML: <span class="truncate text-muted ...">Select...</span>
     */
    placeholder: 'truncate text-default',

    /**
     * ARROW — The dropdown caret/chevron icon
     *
     * Purpose: Indicates dropdown functionality. Rotates when open.
     * Based on .filter-caret (line 1227-1241).
     *
     * HTML: <UIcon class="fill-secondary ..." name="chevron-down" />
     */
    arrow: 'fill-[color:var(--color-brand-secondary)]',

    // =========================================================================
    // DROPDOWN PANEL SLOTS — The floating dropdown container
    // =========================================================================

    /**
     * CONTENT — The floating panel wrapper
     *
     * Purpose: Main dropdown panel containing all options.
     * Based on .dropdown-panel (line 1244-1257).
     *
     * HTML: <div class="max-h-60 bg-surface-card rounded-[1.25rem] ..." />
     *
     * Design notes:
     * - max-h-60: Limits height for scrolling
     * - w-(--reka-select-trigger-width): Matches trigger width (Reka UI variable)
     * - rounded-[1.25rem]: Keova signature rounded corners
     * - shadow-floating: Elevated floating effect
     * - p-[0.85rem]: Generous internal padding
     *
     * Animation:
     * - scale-in/scale-out: Subtle zoom animation on open/close
     * - origin from Reka UI transform origin variable
     */
    content: [
      'max-h-60 w-(--reka-select-trigger-width)',
      // Surface (from .dropdown-panel)
      'bg-[color:var(--color-surface-card)]',
      'border border-stone-900/10',
      'rounded-[1.25rem]',
      'shadow-floating',
      // Spacing
      'p-[0.85rem]',
      // Animation
      'data-[state=open]:animate-[scale-in_100ms_ease-out]',
      'data-[state=closed]:animate-[scale-out_100ms_ease-in]',
      'origin-(--reka-select-content-transform-origin)',
      // Layout
      'overflow-hidden pointer-events-auto flex flex-col'
    ].join(' '),

    /**
     * VIEWPORT — Scrollable area containing options
     *
     * Purpose: Inner scrollable container for the options list.
     * Provides vertical scrolling when options exceed max height.
     *
     * HTML: <div class="relative overflow-y-auto ..." />
     *
     * Design notes:
     * - space-y-[0.35rem]: Gap between items (from .dropdown-panel gap)
     * - scroll-py-1: Scroll padding for smooth scrolling
     */
    viewport: [
      'relative',
      'scroll-py-1 overflow-y-auto flex-1',
      // Gap between items (from .dropdown-panel gap: 0.35rem)
      'space-y-[0.35rem]'
    ].join(' '),

    /**
     * GROUP — Container for grouped options
     *
     * Purpose: Wraps a group of related options with optional label.
     * Creates visual separation between option categories.
     *
     * HTML: <div class="p-1 isolate">
     */
    group: 'p-1 isolate',

    /**
     * EMPTY — Shown when no options match search/filter
     *
     * Purpose: Empty state message when dropdown has no results.
     * Provides user feedback for failed searches.
     *
     * HTML: <div class="text-center py-8 ...">No results found</div>
     */
    empty: 'text-center text-[color:var(--color-brand-muted)] py-8 text-sm',

    /**
     * LABEL — Group label/header text
     *
     * Purpose: Labels for option groups (e.g., "Recent", "Popular").
     * Uses uppercase tracking for clear categorization.
     *
     * HTML: <span class="font-bold text-xs uppercase ...">Group Name</span>
     */
    label: 'font-bold text-xs uppercase tracking-[0.22em] text-default px-3 py-2',

    /**
     * SEPARATOR — Horizontal divider between groups
     *
     * Purpose: Visual separator line between option groups.
     * Subtle rgba border for organic feel.
     *
     * HTML: <div class="-mx-1 my-1 h-px bg-..." />
     */
    separator: '-mx-1 my-1 h-px bg-[rgba(28,25,23,0.06)]',

    // =========================================================================
    // ITEM SLOTS — Individual dropdown options
    // =========================================================================

    /**
     * ITEM — Individual option element
     *
     * Purpose: Styles each selectable option in the dropdown.
     * Based on .dropdown-item (line 1299-1360).
     *
     * HTML: <div class="group relative w-full flex items-center ..." />
     *
     * Design notes:
     * - min-h-[44px]: Accessible touch target (Fitts' Law)
     * - rounded-[0.95rem]: Slightly tighter radius than panel
     * - data-highlighted: Keyboard navigation / hover state
     * - aria-selected: Currently selected option
     *
     * States:
     * - Default: transparent background
     * - Highlighted (hover/keyboard): subtle warm background
     * - Selected: warm amber tint with inset shadow border
     * - Disabled: reduced opacity, no pointer events
     */
    item: [
      // Layout (from .dropdown-item)
      'group relative w-full flex items-center justify-between',
      'min-h-[44px]',
      'px-4',
      'gap-3',
      'rounded-[0.95rem]',
      // Typography
      'text-sm font-semibold text-[color:var(--color-brand-primary)]',
      'text-left',
      // Interaction
      'select-none outline-none cursor-pointer',
      'transition-all duration-[var(--duration-fast)]',
      // Background & border
      'border border-transparent bg-transparent',
      // States handled via compoundVariants and data attributes
      'data-disabled:cursor-not-allowed data-disabled:opacity-45',
      // Highlighted state (hover/keyboard nav) - from .dropdown-item:hover line 1327
      'data-highlighted:not-data-disabled:bg-[rgba(245,245,244,0.9)]',
      // Selected state - from .dropdown-item[aria-selected="true"] line 1335
      '[&[aria-selected=\'true\']]:bg-[rgba(212,184,160,0.18)]',
      '[&[aria-selected=\'true\']]:shadow-[inset_0_0_0_1px_rgba(212,184,160,0.38)]',
      '[&[aria-selected=\'true\']]:font-bold',
      // Before pseudo for animations
      'before:absolute before:z-[-1] before:inset-px before:rounded-md',
      'before:transition-colors'
    ].join(' '),

    /**
     * ITEM LEADING ICON — Icon at the start of an option
     *
     * Purpose: Leading icon for options (category, status, etc.).
     * Changes color on highlight state.
     *
     * HTML: <UIcon class="shrink-0 text-secondary ..." />
     */
    itemLeadingIcon: [
      'shrink-0 text-[color:var(--color-brand-secondary)]',
      'group-data-highlighted:not-group-data-disabled:text-[color:var(--color-brand-primary)]',
      'transition-colors'
    ].join(' '),

    /**
     * ITEM LEADING AVATAR — Avatar at the start of an option
     *
     * Purpose: User/contact avatar for options.
     *
     * HTML: <UAvatar class="shrink-0" />
     */
    itemLeadingAvatar: 'shrink-0',

    /**
     * ITEM LEADING AVATAR SIZE — Avatar size class name
     *
     * Purpose: Specifies the size variant for item avatars.
     *
     * @internal Mapped by size variant
     */
    itemLeadingAvatarSize: '',

    /**
     * ITEM LEADING CHIP — Color chip at the start of an option
     *
     * Purpose: Color indicator chip for options (status, category colors).
     *
     * HTML: <UChip class="shrink-0" />
     */
    itemLeadingChip: 'shrink-0',

    /**
     * ITEM LEADING CHIP SIZE — Chip size class name
     *
     * Purpose: Specifies the size variant for item chips.
     *
     * @internal Mapped by size variant
     */
    itemLeadingChipSize: '',

    /**
     * ITEM TRAILING — Container for trailing content in options
     *
     * Purpose: Contains trailing metadata (count, shortcut, icon).
     * Based on .dropdown-meta (line 1355-1360).
     *
     * HTML: <span class="ms-auto inline-flex gap-1.5 ...">
     *
     * Design notes:
     * - ms-auto: Pushes to end
     * - tabular-nums: Consistent number width
     */
    itemTrailing:
      'ms-auto inline-flex gap-1.5 items-center text-xs font-bold text-[color:var(--color-brand-muted)] tabular-nums',

    /**
     * ITEM TRAILING ICON — Icon in the trailing area
     *
     * Purpose: Trailing icon for options (checkmark, chevron, etc.).
     *
     * HTML: <UIcon class="shrink-0" />
     */
    itemTrailingIcon: 'shrink-0',

    /**
     * ITEM WRAPPER — Container for label and description
     *
     * Purpose: Flex container holding the option text content.
     * Enables vertical stacking of label + description.
     *
     * HTML: <div class="flex-1 flex flex-col min-w-0">
     */
    itemWrapper: 'flex-1 flex flex-col min-w-0',

    /**
     * ITEM LABEL — Main text of the option
     *
     * Purpose: Primary option text, truncates on overflow.
     *
     * HTML: <span class="truncate">Option Label</span>
     */
    itemLabel: 'truncate',

    /**
     * ITEM DESCRIPTION — Secondary text for the option
     *
     * Purpose: Optional description below the label.
     * Uses secondary color for visual hierarchy.
     *
     * HTML: <span class="truncate text-xs text-secondary">Description</span>
     */
    itemDescription: 'truncate text-xs text-[color:var(--color-brand-secondary)]'
  },

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * VARIANTS — Conditional styling based on props
   * ═══════════════════════════════════════════════════════════════════════════
   *
   * Variants allow different styles based on component props.
   * Each variant key corresponds to a prop that can be passed to USelect.
   */
  variants: {
    /**
     * FIELD GROUP — Styling for selects in button groups
     *
     * Purpose: Adjusts border-radius when select is part of a horizontal
     * or vertical group (e.g., filter row).
     *
     * @prop fieldGroup?: 'horizontal' | 'vertical'
     */
    fieldGroup: {
      /**
       * horizontal: Select is in a horizontal row with siblings.
       * First item keeps rounded start, last keeps rounded end.
       */
      horizontal:
        'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      /**
       * vertical: Select is in a vertical stack with siblings.
       * First item keeps rounded top, last keeps rounded bottom.
       */
      vertical:
        'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
    },

    /**
     * SIZE — Controls trigger height, padding, typography, and item sizing
     *
     * Purpose: Provides consistent sizing across the design system.
     * All sizes maintain accessible touch targets (minimum 36px height).
     *
     * @prop size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
     *
     * Design notes:
     * - xs/sm: Compact interfaces, toolbars, data tables
     * - md: Default, balanced for most use cases (44px = Fitts' Law)
     * - lg/xl: Prominent selects, landing pages, mobile-first
     */
    size: {
      /**
       * xs (40px): Most compact size, for dense admin interfaces
       */
      xs: {
        base: 'h-10 px-3 text-xs gap-2',
        leading: 'ps-3',
        trailing: 'pe-3',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4',
        label: 'p-1.5 text-[10px]/3 gap-1.5',
        item: 'px-3 py-1.5 text-xs gap-2 min-h-[36px]',
        itemLeadingIcon: 'size-4',
        itemLeadingAvatarSize: '3xs',
        itemLeadingChip: 'size-4',
        itemLeadingChipSize: 'sm',
        itemTrailingIcon: 'size-4',
        empty: 'p-6 text-xs'
      },
      /**
       * sm (44px): Compact but accessible, good for filter bars
       */
      sm: {
        base: 'h-11 px-3.5 text-xs gap-2',
        leading: 'ps-3.5',
        trailing: 'pe-3.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4',
        label: 'p-1.5 text-[10px]/3 gap-1.5',
        item: 'px-3.5 py-2 text-xs gap-2 min-h-[40px]',
        itemLeadingIcon: 'size-4',
        itemLeadingAvatarSize: '3xs',
        itemLeadingChip: 'size-4',
        itemLeadingChipSize: 'sm',
        itemTrailingIcon: 'size-4',
        empty: 'p-6 text-xs'
      },
      /**
       * md (44px): Default size, optimal touch target (Fitts' Law)
       * This is the 44px height from the design system spec.
       */
      md: {
        base: 'h-11 px-4 text-sm gap-3',
        leading: 'ps-4',
        trailing: 'pe-4',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5',
        label: 'px-3 py-2 text-xs gap-2',
        item: 'px-4 py-2 text-sm gap-3 min-h-[44px]',
        itemLeadingIcon: 'size-5',
        itemLeadingAvatarSize: '2xs',
        itemLeadingChip: 'size-5',
        itemLeadingChipSize: 'md',
        itemTrailingIcon: 'size-5',
        empty: 'p-8 text-sm'
      },
      /**
       * lg (48px): Larger selects for emphasis, mobile-friendly
       */
      lg: {
        base: 'h-12 px-5 text-sm gap-3',
        leading: 'ps-5',
        trailing: 'pe-5',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5',
        label: 'px-3 py-2.5 text-sm gap-2.5',
        item: 'px-5 py-2.5 text-sm gap-3 min-h-[48px]',
        itemLeadingIcon: 'size-5',
        itemLeadingAvatarSize: '2xs',
        itemLeadingChip: 'size-5',
        itemLeadingChipSize: 'md',
        itemTrailingIcon: 'size-5',
        empty: 'p-10 text-sm'
      },
      /**
       * xl (56px): Prominent selects, hero sections, landing pages
       */
      xl: {
        base: 'h-14 px-6 text-base gap-3',
        leading: 'ps-6',
        trailing: 'pe-6',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-6',
        label: 'px-4 py-3 text-sm gap-3',
        item: 'px-6 py-3 text-base gap-3 min-h-[52px]',
        itemLeadingIcon: 'size-6',
        itemLeadingAvatarSize: 'xs',
        itemLeadingChip: 'size-6',
        itemLeadingChipSize: 'lg',
        itemTrailingIcon: 'size-6',
        empty: 'p-12 text-base'
      }
    },

    /**
     * VARIANT — Visual style variations for the trigger
     *
     * Purpose: Different visual treatments for different contexts.
     * Nuxt UI v4 supports: outline, soft, subtle, ghost, none
     *
     * @prop variant?: 'outline' | 'soft' | 'subtle' | 'ghost' | 'none'
     */
    variant: {
      /**
       * outline: Default Keova select style (.filter-trigger--ops line 1220-1224)
       * - Card surface background
       * - Subtle stone border
       * - Shadow elevation
       */
      outline: [
        'bg-[color:var(--field-bg)]',
        'border border-stone-900/10',
        'shadow-card'
      ].join(' '),

      /**
       * soft: Softer appearance, less prominent
       * - Field-specific background
       * - Subtle field border
       * - No shadow
       */
      soft: [
        'bg-[color:var(--field-bg)]',
        'border border-[color:var(--field-border)]',
        'shadow-none'
      ].join(' '),

      /**
       * subtle: Minimal styling, for inline/embedded selects
       * - Highlight surface background
       * - Very soft border
       */
      subtle: [
        'bg-[color:var(--color-surface-highlight)]',
        'border border-[color:var(--color-border-soft)]',
        'shadow-none'
      ].join(' '),

      /**
       * ghost: Transparent until interaction
       * - No background or border by default
       * - Shows styling on hover/focus
       */
      ghost: [
        'bg-transparent',
        'border border-transparent',
        'shadow-none'
      ].join(' '),

      /**
       * none: Completely unstyled base
       * - Use for custom implementations
       */
      none: 'bg-transparent border-none shadow-none'
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
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
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
      true: ''
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
      true: ''
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
      true: ''
    },

    /**
     * HIGHLIGHT — Visual highlight state
     *
     * Purpose: Adds a ring highlight to indicate active/selected state.
     * Used in conjunction with color variants.
     *
     * @prop highlight?: boolean
     */
    highlight: {
      true: ''
    },

    /**
     * TYPE — Input type-specific styling
     *
     * Purpose: Special styling for file-type inputs (rarely used with select).
     *
     * @prop type?: 'file'
     */
    type: {
      file: 'file:me-1.5 file:font-medium file:text-[color:var(--color-brand-muted)] file:outline-none'
    }
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
     * Based on .filter-trigger:hover, :focus (line 1200-1210)
     * - Elevates shadow on hover
     * - Warm amber focus ring (Keova signature)
     */
    {
      variant: 'outline',
      class: [
        'hover:bg-[color:var(--field-bg-hover)]',
        'hover:border-[color:var(--field-border-hover)]',
        'hover:shadow-floating',
        'focus:border-[color:var(--field-border-focus)]',
        'focus:shadow-[0_0_0_4px_var(--field-ring),var(--shadow-floating)]'
      ].join(' ')
    },

    /**
     * Soft variant hover/focus states
     */
    {
      variant: 'soft',
      class: [
        'hover:bg-[color:var(--field-bg-hover)]',
        'hover:border-[color:var(--field-border-hover)]',
        'hover:shadow-card',
        'focus:border-[color:var(--field-border-focus)]',
        'focus:shadow-[0_0_0_4px_var(--field-ring)]'
      ].join(' ')
    },

    /**
     * Subtle variant hover/focus states
     */
    {
      variant: 'subtle',
      class: [
        'hover:bg-[color:var(--color-surface-card)]',
        'hover:border-[color:var(--color-border-subtle)]',
        'focus:border-[color:var(--field-border-focus)]',
        'focus:shadow-[0_0_0_4px_var(--field-ring)]'
      ].join(' ')
    },

    /**
     * Ghost variant hover/focus states
     * - Reveals background/border on interaction
     */
    {
      variant: 'ghost',
      class: [
        'hover:bg-[color:var(--color-surface-highlight)]',
        'hover:border-[color:var(--color-border-soft)]',
        'focus:bg-[color:var(--color-surface-highlight)]',
        'focus:border-[color:var(--field-border-focus)]',
        'focus:shadow-[0_0_0_4px_var(--field-ring)]'
      ].join(' ')
    },

    // =========================================================================
    // COLOR-SPECIFIC FOCUS RINGS
    // =========================================================================

    /**
     * Primary color focus ring (warm Keova ring)
     */
    {
      color: 'primary',
      variant: ['outline', 'subtle'],
      class: 'focus:ring-primary'
    },

    /**
     * Primary color without highlight: subtle inset ring
     */
    {
      color: 'primary',
      highlight: false,
      class: 'ring ring-inset ring-stone-900/10'
    },

    /**
     * Neutral color focus ring
     */
    {
      color: 'neutral',
      variant: ['outline', 'subtle'],
      class: 'focus:ring-[rgba(231,229,228,0.5)]'
    },

    /**
     * Neutral color with highlight: subtle inset ring
     */
    {
      color: 'neutral',
      highlight: true,
      class: 'ring ring-inset ring-[color:var(--color-border-subtle)]'
    },

    // =========================================================================
    // LEADING ICON PADDING ADJUSTMENTS
    // =========================================================================

    /**
     * When leading icon is present, add padding to prevent text overlap.
     * Padding scales with size to maintain visual balance.
     */
    { leading: true, size: 'xs', class: 'ps-9' },
    { leading: true, size: 'sm', class: 'ps-9' },
    { leading: true, size: 'md', class: 'ps-10' },
    { leading: true, size: 'lg', class: 'ps-11' },
    { leading: true, size: 'xl', class: 'ps-12' },

    // =========================================================================
    // TRAILING ICON PADDING ADJUSTMENTS
    // =========================================================================

    /**
     * When trailing icon is present, add padding to prevent text overlap.
     */
    { trailing: true, size: 'xs', class: 'pe-9' },
    { trailing: true, size: 'sm', class: 'pe-9' },
    { trailing: true, size: 'md', class: 'pe-10' },
    { trailing: true, size: 'lg', class: 'pe-11' },
    { trailing: true, size: 'xl', class: 'pe-12' },

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
        leadingIcon: 'animate-spin'
      }
    },

    /**
     * Loading with trailing icon (no leading): Spin the trailing icon
     */
    {
      loading: true,
      leading: false,
      trailing: true,
      class: {
        trailingIcon: 'animate-spin'
      }
    }
  ],

  /**
   * ═══════════════════════════════════════════════════════════════════════════
   * DEFAULT VARIANTS — Applied when no prop is specified
   * ═══════════════════════════════════════════════════════════════════════════
   */
  defaultVariants: {
    /** Default size: md (44px) — Optimal touch target per Fitts' Law */
    size: 'md',
    /** Default color: primary — Warm amber focus ring */
    color: 'primary',
    /** Default variant: outline — Standard Keova select appearance */
    variant: 'outline'
  }
}
