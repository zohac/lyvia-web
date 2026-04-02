/**
 * Keova Design System — Button Component Configuration
 *
 * 7 colors × 6 variants = 42 compound variants.
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
    // =========================================================================
    // PRIMARY (Crepuscule-800) — CTA PRINCIPAL
    // =========================================================================
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
    {
      color: 'primary',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-brand-primary)]',
        'text-[color:var(--color-brand-primary)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-primary)]',
        'disabled:border-[color:var(--color-neutral-300)] disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:border-[color:var(--color-neutral-300)] aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },
    {
      color: 'primary',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-surface-highlight)]',
        'text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-brand-subtle)]',
        'focus-visible:outline-[color:var(--color-brand-primary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },
    {
      color: 'primary',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-surface-highlight)]',
        'text-[color:var(--color-brand-primary)]',
        'border border-[color:var(--color-brand-subtle)]',
        'hover:bg-[color:var(--color-brand-subtle)]',
        'focus-visible:outline-[color:var(--color-brand-primary)]',
        'disabled:text-[color:var(--color-neutral-400)] disabled:border-[color:var(--color-neutral-300)]',
        'aria-disabled:text-[color:var(--color-neutral-400)] aria-disabled:border-[color:var(--color-neutral-300)]'
      ].join(' ')
    },
    {
      color: 'primary',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-primary)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-surface-highlight)]',
        'focus-visible:outline-[color:var(--color-brand-primary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },
    {
      color: 'primary',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-primary)]',
        'bg-transparent',
        'hover:text-[color:var(--color-brand-primary-dark)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-brand-primary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // =========================================================================
    // SECONDARY (Sunset-500) — BRAND ACCENT
    // =========================================================================
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
    {
      color: 'secondary',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-brand-accent)]',
        'text-[color:var(--color-brand-accent)]',
        'bg-transparent',
        'hover:bg-[color:rgba(212,184,160,0.08)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]'
      ].join(' ')
    },
    {
      color: 'secondary',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(212,184,160,0.12)]',
        'text-[color:var(--color-brand-accent)]',
        'hover:bg-[color:rgba(212,184,160,0.18)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]'
      ].join(' ')
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(212,184,160,0.12)]',
        'text-[color:var(--color-brand-accent)]',
        'border border-[color:rgba(212,184,160,0.25)]',
        'hover:bg-[color:rgba(212,184,160,0.18)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]'
      ].join(' ')
    },
    {
      color: 'secondary',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-accent)]',
        'bg-transparent',
        'hover:bg-[color:rgba(212,184,160,0.08)]',
        'focus-visible:outline-[color:var(--color-brand-accent)]'
      ].join(' ')
    },
    {
      color: 'secondary',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-accent)]',
        'bg-transparent',
        'hover:text-[color:var(--color-brand-accent-hover)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-brand-accent)]'
      ].join(' ')
    },

    // =========================================================================
    // NEUTRAL (Crepuscule-400) — SECONDARY ACTIONS
    // =========================================================================
    {
      color: 'neutral',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-brand-secondary)]',
        'text-white',
        'hover:bg-[color:var(--color-brand-primary)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'active:scale-[0.98]',
        'disabled:bg-[color:var(--color-neutral-400)] disabled:text-white',
        'aria-disabled:bg-[color:var(--color-neutral-400)] aria-disabled:text-white'
      ].join(' ')
    },
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
    {
      color: 'neutral',
      variant: 'soft',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-surface-highlight)]',
        'text-[color:var(--color-brand-primary)]',
        'hover:bg-[color:var(--color-brand-subtle)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-surface-highlight)]',
        'text-[color:var(--color-brand-secondary)]',
        'border border-[color:var(--color-brand-subtle)]',
        'hover:bg-[color:var(--color-brand-subtle)]',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:text-[color:var(--color-neutral-400)] disabled:border-[color:var(--color-neutral-300)]',
        'aria-disabled:text-[color:var(--color-neutral-400)] aria-disabled:border-[color:var(--color-neutral-300)]'
      ].join(' ')
    },
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
    {
      color: 'neutral',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-brand-muted)]',
        'bg-transparent',
        'hover:text-[color:var(--color-brand-primary)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-brand-secondary)]',
        'disabled:text-[color:var(--color-neutral-400)]',
        'aria-disabled:text-[color:var(--color-neutral-400)]'
      ].join(' ')
    },

    // =========================================================================
    // SUCCESS — POSITIVE STATES
    // =========================================================================
    {
      color: 'success',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-success)]',
        'text-white',
        'hover:bg-[color:var(--color-success-600)]',
        'focus-visible:outline-[color:var(--color-success)]',
        'active:scale-[0.98]'
      ].join(' ')
    },
    {
      color: 'success',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-success)]',
        'text-[color:var(--color-success-600)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-success-50)]',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },
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
    {
      color: 'success',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-success-50)]',
        'text-[color:var(--color-success-600)]',
        'border border-[color:var(--color-success-200)]',
        'hover:bg-[color:var(--color-success-100)]',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },
    {
      color: 'success',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-success-600)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-success-50)]',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },
    {
      color: 'success',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-success-600)]',
        'bg-transparent',
        'hover:text-[color:var(--color-success-700)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-success)]'
      ].join(' ')
    },

    // =========================================================================
    // WARNING — ATTENTION STATES
    // =========================================================================
    {
      color: 'warning',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-warning)]',
        'text-white',
        'hover:opacity-90',
        'focus-visible:outline-[color:var(--color-warning)]',
        'active:scale-[0.98]'
      ].join(' ')
    },
    {
      color: 'warning',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-warning)]',
        'text-[color:var(--color-warning)]',
        'bg-transparent',
        'hover:bg-[color:rgba(217,119,6,0.08)]',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },
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
    {
      color: 'warning',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(217,119,6,0.14)]',
        'text-[color:var(--color-warning)]',
        'border border-[color:rgba(217,119,6,0.25)]',
        'hover:bg-[color:rgba(217,119,6,0.20)]',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },
    {
      color: 'warning',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-warning)]',
        'bg-transparent',
        'hover:bg-[color:rgba(217,119,6,0.08)]',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },
    {
      color: 'warning',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-warning)]',
        'bg-transparent',
        'hover:text-[color:var(--color-sunset-700)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-warning)]'
      ].join(' ')
    },

    // =========================================================================
    // ERROR — DESTRUCTIVE ACTIONS
    // =========================================================================
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
    {
      color: 'error',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-error)]',
        'text-[color:var(--color-error)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-error-50)]',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },
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
    {
      color: 'error',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-error-50)]',
        'text-[color:var(--color-error)]',
        'border border-[color:var(--color-error-200)]',
        'hover:bg-[color:var(--color-error-100)]',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },
    {
      color: 'error',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-error)]',
        'bg-transparent',
        'hover:bg-[color:var(--color-error-50)]',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },
    {
      color: 'error',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-error)]',
        'bg-transparent',
        'hover:text-[color:var(--color-error-700)]',
        'hover:underline underline-offset-4',
        'focus-visible:outline-[color:var(--color-error)]'
      ].join(' ')
    },

    // =========================================================================
    // INFO — INFORMATIONAL STATES
    // =========================================================================
    {
      color: 'info',
      variant: 'solid',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:var(--color-info)]',
        'text-white',
        'hover:opacity-90',
        'focus-visible:outline-[color:var(--color-info)]',
        'active:scale-[0.98]'
      ].join(' ')
    },
    {
      color: 'info',
      variant: 'outline',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'border-2 border-[color:var(--color-info)]',
        'text-[color:var(--color-info)]',
        'bg-transparent',
        'hover:bg-[color:rgba(91,123,158,0.08)]',
        'focus-visible:outline-[color:var(--color-info)]'
      ].join(' ')
    },
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
    },
    {
      color: 'info',
      variant: 'subtle',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'bg-[color:rgba(91,123,158,0.10)]',
        'text-[color:var(--color-info)]',
        'border border-[color:rgba(91,123,158,0.22)]',
        'hover:bg-[color:rgba(91,123,158,0.16)]',
        'focus-visible:outline-[color:var(--color-info)]'
      ].join(' ')
    },
    {
      color: 'info',
      variant: 'ghost',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-info)]',
        'bg-transparent',
        'hover:bg-[color:rgba(91,123,158,0.08)]',
        'focus-visible:outline-[color:var(--color-info)]'
      ].join(' ')
    },
    {
      color: 'info',
      variant: 'link',
      class: [
        'shadow-none [--tw-ring-shadow:0_0_rgb(0_0_0/0)]',
        'text-[color:var(--color-info)]',
        'bg-transparent',
        'hover:text-[color:rgba(91,123,158,0.8)]',
        'hover:underline underline-offset-4',
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
