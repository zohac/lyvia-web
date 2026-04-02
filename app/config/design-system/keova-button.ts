/**
 * Keova Design System — Button Component Configuration
 *
 * 9 compound variants — the ONLY supported color+variant combinations:
 *   5 action buttons: primary solid, neutral outline, secondary solid, error solid, neutral ghost
 *   4 semantic soft:  success soft, warning soft, error soft, info soft
 *
 * Any other color+variant combination falls back to Nuxt UI defaults.
 * All tokens are exclusively defined in main.css — zero ghost vars.
 *
 * IMPORTANT: Every variant includes `shadow-none [--tw-ring-shadow:...]` to cancel
 * Nuxt UI's default `ring ring-inset ring-{color}/50` which causes
 * a teal/blue ring bleeding through our custom borders.
 */
export const keovaButton = {
  slots: {
    base: [
      'rounded-full',
      'font-bold',
      'inline-flex items-center justify-center gap-2',
      'transition-all duration-[var(--duration-normal)]',
      'select-none',
      'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
      'focus-visible:outline-[3px] focus-visible:outline-offset-2'
    ],
    label: 'truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: 'shrink-0'
  },

  variants: {
    size: {
      xs: {
        base: 'px-4 py-2 text-xs gap-1.5',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      sm: {
        base: 'px-5 py-2.5 text-sm gap-2',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      md: {
        base: 'px-6 py-3 text-base gap-2',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      lg: {
        base: 'px-7 py-3.5 text-base gap-2.5',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      xl: {
        base: 'px-8 py-4 text-lg gap-3',
        leadingIcon: 'size-6',
        leadingAvatarSize: 'xs',
        trailingIcon: 'size-6'
      }
    },

    block: {
      true: {
        base: 'w-full justify-center',
        trailingIcon: 'ms-auto'
      }
    }
  },

  compoundVariants: [
    // === ACTION BUTTONS (5) ===

    // 1. Primary Solid — CTA principal (Crepuscule-800)
    {
      color: 'primary',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-brand-primary-dark)]',
        'text-white',
        'hover:bg-[color:var(--color-brand-primary)]',
        'focus-visible:outline-[color:var(--color-brand-primary-dark)]',
        'active:scale-[0.98]',
        'disabled:bg-[color:var(--color-neutral-400)] disabled:text-white',
        'aria-disabled:bg-[color:var(--color-neutral-400)] aria-disabled:text-white'
      ].join(' ')
    },

    // 2. Neutral Outline — actions secondaires
    {
      color: 'neutral',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-brand-subtle)]',
        'bg-[color:var(--color-surface-card)]',
        'text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:border-[color:var(--color-neutral-300)] disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:border-[color:var(--color-neutral-300)] aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // 3. Secondary Solid — CTA accent (Sunset-500)
    {
      color: 'secondary',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-brand-accent)]',
        'text-white',
        'hover:bg-[color:var(--color-brand-accent-hover)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]',
        'active:scale-[0.98]'
      ].join(' ')
    },

    // 4. Error Solid — actions destructives
    {
      color: 'error',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-error)]',
        'text-white',
        'hover:opacity-90',
        'focus-visible:outline-[color:var(--color-error)]',
        'active:scale-[0.98]'
      ].join(' ')
    },

    // 5. Neutral Ghost — actions tertiaires discrètes
    {
      color: 'neutral',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-secondary)]',
        'bg-transparent',
        'hover:text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // === SEMANTIC SOFT (4) ===

    // 6. Success Soft — états positifs
    {
      color: 'success',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-success-50)]',
        'text-[color:var(--color-success-600)]',
        'hover:bg-[color:var(--color-success-100)]',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },

    // 7. Warning Soft — alertes
    {
      color: 'warning',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(217,119,6,0.14)]',
        'text-[color:var(--color-warning)]',
        'hover:bg-[color:rgba(217,119,6,0.20)]',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },

    // 8. Error Soft — erreurs discrètes
    {
      color: 'error',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-error-50)]',
        'text-[color:var(--color-error)]',
        'hover:bg-[color:var(--color-error-100)]',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },

    // 9. Info Soft — informations
    {
      color: 'info',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(91,123,158,0.10)]',
        'text-[color:var(--color-info)]',
        'hover:bg-[color:rgba(91,123,158,0.16)]',
        'focus-visible:outline-[color:var(--color-info)]'
      ].join(' ')
    }
  ],

  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
}
