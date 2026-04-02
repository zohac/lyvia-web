/**
 * Keova Design System — Button Component Configuration (Simplified)
 *
 * 9 compound variants using ONLY tokens defined in main.css:
 *
 * Action buttons (5):
 *   - primary solid: CTA principal (crépuscule-800 bg)
 *   - neutral outline: action secondaire (card bg, subtle border)
 *   - secondary solid: accent CTA (sunset-500 bg)
 *   - error solid: action destructive (error bg)
 *   - neutral ghost: action tertiaire discrète
 *
 * Semantic soft badges (4):
 *   - success soft, warning soft, error soft, info soft
 *
 * All other color+variant combinations fall through to Nuxt UI defaults.
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
    // =========================================================================
    // ACTION BUTTONS (5)
    // =========================================================================

    // 1. Primary solid — CTA principal
    {
      color: 'primary',
      variant: 'solid',
      class: [
        'bg-[color:var(--color-brand-primary-dark)]',
        'text-white',
        'hover:bg-[color:var(--color-brand-primary)]',
        'focus-visible:outline-[color:var(--color-brand-primary-dark)]',
        'active:scale-[0.98]',
        'disabled:bg-[color:var(--color-neutral-400)] disabled:text-white',
        'aria-disabled:bg-[color:var(--color-neutral-400)] aria-disabled:text-white'
      ].join(' ')
    },

    // 2. Neutral outline — action secondaire
    {
      color: 'neutral',
      variant: 'outline',
      class: [
        'border-2 border-[color:var(--color-brand-subtle)]',
        'bg-[color:var(--color-surface-card)]',
        'text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:border-[color:var(--color-neutral-300)] disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:border-[color:var(--color-neutral-300)] aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // 3. Secondary solid — accent CTA
    {
      color: 'secondary',
      variant: 'solid',
      class: [
        'bg-[color:var(--color-brand-accent)]',
        'text-white',
        'hover:bg-[color:var(--color-brand-accent-hover)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]',
        'active:scale-[0.98]'
      ].join(' ')
    },

    // 4. Error solid — action destructive
    {
      color: 'error',
      variant: 'solid',
      class: [
        'bg-[color:var(--color-error)]',
        'text-white',
        'hover:opacity-90',
        'focus-visible:outline-[color:var(--color-error)]',
        'active:scale-[0.98]'
      ].join(' ')
    },

    // 5. Neutral ghost — action tertiaire discrète
    {
      color: 'neutral',
      variant: 'ghost',
      class: [
        'text-[color:var(--color-brand-secondary)]',
        'hover:text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // =========================================================================
    // SEMANTIC SOFT BADGES (4)
    // =========================================================================

    // 6. Success soft
    {
      color: 'success',
      variant: 'soft',
      class: [
        'bg-[color:var(--color-success-50)]',
        'text-[color:var(--color-success-600)]',
        'hover:bg-[color:var(--color-success-100)]',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },

    // 7. Warning soft
    {
      color: 'warning',
      variant: 'soft',
      class: [
        'bg-[color:rgba(217,119,6,0.14)]',
        'text-[color:var(--color-warning)]',
        'hover:bg-[color:rgba(217,119,6,0.20)]',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },

    // 8. Error soft
    {
      color: 'error',
      variant: 'soft',
      class: [
        'bg-[color:var(--color-error-50)]',
        'text-[color:var(--color-error)]',
        'hover:bg-[color:var(--color-error-100)]',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },

    // 9. Info soft
    {
      color: 'info',
      variant: 'soft',
      class: [
        'bg-blue-50',
        'text-blue-700',
        'hover:bg-blue-100',
        'focus-visible:outline-blue-600'
      ].join(' ')
    }
  ],

  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
}
