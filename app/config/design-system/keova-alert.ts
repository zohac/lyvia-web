/**
 * Keova Design System — Alert / Toast Component Configuration
 *
 * Aligned with design system spec:
 * @see docs/03_uiux/kaora/design system/Kaora Design System — Notifications - Toasts.md
 * @see docs/03_uiux/kaora/exemples/toasts.html
 *
 * Intent system:
 * - Success: Action réussie (sage green)
 * - Info: Information système (keova accent)
 * - Warning: Attention préventive (amber)
 * - Error: Échec d'action (red, persistant)
 *
 * @architecture Clean Architecture — Configuration Layer
 * @author Remy Chopoya
 */

export const keovaAlert = {
  slots: {
    // =========================================================================
    // ROOT (.toast from toasts.html line 49-61)
    // =========================================================================
    root: [
      // Layout
      'relative overflow-hidden w-full',
      'flex gap-4 items-start',
      // Spacing (from .toast padding: 1.25rem)
      'p-5',
      // Shape (from .toast border-radius: var(--radius-lg))
      'rounded-[var(--radius-lg)]',
      // Surface (from .toast background + backdrop-filter)
      'bg-[rgba(255,255,255,0.85)]',
      'backdrop-blur-[12px]',
      // Border (from .toast border: 1px solid rgba(231, 229, 228, 0.8))
      'border border-[rgba(231,229,228,0.8)]',
      // Shadow (from .toast box-shadow: var(--shadow-card))
      'shadow-card'
    ].join(' '),

    // =========================================================================
    // WRAPPER (content container)
    // =========================================================================
    wrapper: 'min-w-0 flex-1 flex flex-col',

    // =========================================================================
    // TITLE (.toast-title from toasts.html line 86-91)
    // =========================================================================
    title: [
      'text-sm font-bold',
      'text-[color:var(--color-brand-primary)]'
    ].join(' '),

    // =========================================================================
    // DESCRIPTION (.toast-message from toasts.html line 93-97)
    // =========================================================================
    description: [
      'text-sm',
      'text-[color:var(--color-brand-secondary)]',
      'leading-[1.4]'
    ].join(' '),

    // =========================================================================
    // ICON (.toast-icon from toasts.html line 74-84)
    // =========================================================================
    icon: [
      // Size (from .toast-icon width/height: 28px)
      'shrink-0 size-7',
      // Shape
      'rounded-full',
      // Layout
      'flex items-center justify-center',
      // Typography for icon content
      'text-sm font-bold'
    ].join(' '),

    // Avatar slot
    avatar: 'shrink-0',
    avatarSize: 'md',

    // =========================================================================
    // ACTIONS (.toast-action from toasts.html line 99-112)
    // =========================================================================
    actions: [
      'flex flex-wrap gap-2 shrink-0',
      'mt-3'
    ].join(' '),

    // =========================================================================
    // CLOSE (.toast-close from toasts.html line 114-121)
    // =========================================================================
    close: [
      'p-0',
      'text-[1.1rem] leading-none',
      'text-[color:var(--color-brand-muted)]',
      'hover:text-[color:var(--color-brand-primary)]',
      'transition-colors'
    ].join(' ')
  },

  variants: {
    // =========================================================================
    // COLOR VARIANTS (Intent system)
    // =========================================================================
    color: {
      // Primary (Keova accent)
      primary: '',
      // Secondary
      secondary: '',
      // Success (.toast--success from toasts.html line 127-130)
      success: '',
      // Info (.toast--info from toasts.html line 132-135)
      info: '',
      // Warning (.toast--warning from toasts.html line 137-140)
      warning: '',
      // Error (.toast--error from toasts.html line 142-149)
      error: '',
      // Neutral
      neutral: ''
    },

    // =========================================================================
    // VARIANT STYLES
    // =========================================================================
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: ''
    },

    // =========================================================================
    // ORIENTATION
    // =========================================================================
    orientation: {
      horizontal: {
        root: 'items-center',
        actions: 'items-center mt-0 ms-auto'
      },
      vertical: {
        root: 'items-start',
        actions: 'items-start mt-3'
      }
    },

    // =========================================================================
    // TITLE PRESENCE
    // =========================================================================
    title: {
      true: {
        description: 'mt-1'
      }
    }
  },

  compoundVariants: [
    // =========================================================================
    // SUCCESS VARIANTS (.toast--success from toasts.html)
    // Icon: rgba(181, 192, 163, 0.35) bg, primary text
    // =========================================================================
    {
      color: 'success',
      variant: 'solid',
      class: {
        root: 'bg-[rgba(181,192,163,0.95)] border-[rgba(181,192,163,0.5)]',
        icon: 'bg-white/50 text-[color:var(--color-brand-primary)]',
        title: 'text-[color:var(--color-brand-primary)]',
        description: 'text-[color:var(--color-brand-primary)] opacity-80'
      }
    },
    {
      color: 'success',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(181,192,163,0.15)] border-[rgba(181,192,163,0.35)]',
        icon: 'bg-[rgba(181,192,163,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'success',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(181,192,163,0.5)]',
        icon: 'bg-[rgba(181,192,163,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'success',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(181,192,163,0.6)] border-2',
        icon: 'bg-[rgba(181,192,163,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },

    // =========================================================================
    // INFO VARIANTS (.toast--info from toasts.html)
    // Icon: rgba(212, 184, 160, 0.35) bg (Keova accent), primary text
    // =========================================================================
    {
      color: 'info',
      variant: 'solid',
      class: {
        root: 'bg-[rgba(212,184,160,0.95)] border-[rgba(212,184,160,0.5)]',
        icon: 'bg-white/50 text-[color:var(--color-brand-primary)]',
        title: 'text-[color:var(--color-brand-primary)]',
        description: 'text-[color:var(--color-brand-primary)] opacity-80'
      }
    },
    {
      color: 'info',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(212,184,160,0.15)] border-[rgba(212,184,160,0.35)]',
        icon: 'bg-[rgba(212,184,160,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'info',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(212,184,160,0.5)]',
        icon: 'bg-[rgba(212,184,160,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'info',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(212,184,160,0.6)] border-2',
        icon: 'bg-[rgba(212,184,160,0.35)] text-[color:var(--color-brand-primary)]'
      }
    },

    // =========================================================================
    // WARNING VARIANTS (.toast--warning from toasts.html)
    // Icon: rgba(217, 119, 6, 0.25) bg, primary text
    // =========================================================================
    {
      color: 'warning',
      variant: 'solid',
      class: {
        root: 'bg-[rgba(217,119,6,0.9)] border-[rgba(217,119,6,0.5)]',
        icon: 'bg-white/50 text-[color:var(--color-brand-primary)]',
        title: 'text-white',
        description: 'text-white opacity-90'
      }
    },
    {
      color: 'warning',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(217,119,6,0.12)] border-[rgba(217,119,6,0.25)]',
        icon: 'bg-[rgba(217,119,6,0.25)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'warning',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(217,119,6,0.4)]',
        icon: 'bg-[rgba(217,119,6,0.25)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'warning',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(217,119,6,0.5)] border-2',
        icon: 'bg-[rgba(217,119,6,0.25)] text-[color:var(--color-brand-primary)]'
      }
    },

    // =========================================================================
    // ERROR VARIANTS (.toast--error from toasts.html)
    // Root: border-color: rgba(239, 68, 68, 0.35)
    // Icon: rgba(239, 68, 68, 0.18) bg, primary text
    // =========================================================================
    {
      color: 'error',
      variant: 'solid',
      class: {
        root: 'bg-[rgba(239,68,68,0.9)] border-[rgba(239,68,68,0.5)]',
        icon: 'bg-white/50 text-[color:var(--color-brand-primary)]',
        title: 'text-white',
        description: 'text-white opacity-90'
      }
    },
    {
      color: 'error',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(239,68,68,0.1)] border-[rgba(239,68,68,0.25)]',
        icon: 'bg-[rgba(239,68,68,0.18)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'error',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(239,68,68,0.35)]',
        icon: 'bg-[rgba(239,68,68,0.18)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'error',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(239,68,68,0.5)] border-2',
        icon: 'bg-[rgba(239,68,68,0.18)] text-[color:var(--color-brand-primary)]'
      }
    },

    // =========================================================================
    // PRIMARY VARIANTS (Keova brand)
    // =========================================================================
    {
      color: 'primary',
      variant: 'solid',
      class: {
        root: 'bg-[color:var(--color-brand-primary)] border-[color:var(--color-brand-primary)]',
        icon: 'bg-white/20 text-white',
        title: 'text-white',
        description: 'text-white opacity-90'
      }
    },
    {
      color: 'primary',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(28,25,23,0.08)] border-[rgba(28,25,23,0.15)]',
        icon: 'bg-[rgba(28,25,23,0.12)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'primary',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(28,25,23,0.25)]',
        icon: 'bg-[rgba(28,25,23,0.12)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'primary',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(28,25,23,0.4)] border-2',
        icon: 'bg-[rgba(28,25,23,0.12)] text-[color:var(--color-brand-primary)]'
      }
    },

    // =========================================================================
    // SECONDARY VARIANTS
    // =========================================================================
    {
      color: 'secondary',
      variant: 'solid',
      class: {
        root: 'bg-[color:var(--color-brand-accent)] border-[color:var(--color-brand-accent)]',
        icon: 'bg-white/20 text-white',
        title: 'text-white',
        description: 'text-white opacity-90'
      }
    },
    {
      color: 'secondary',
      variant: 'soft',
      class: {
        root: 'bg-[rgba(122,98,81,0.1)] border-[rgba(122,98,81,0.25)]',
        icon: 'bg-[rgba(122,98,81,0.2)] text-[color:var(--color-brand-accent)]'
      }
    },
    {
      color: 'secondary',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[rgba(122,98,81,0.35)]',
        icon: 'bg-[rgba(122,98,81,0.2)] text-[color:var(--color-brand-accent)]'
      }
    },
    {
      color: 'secondary',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[rgba(122,98,81,0.5)] border-2',
        icon: 'bg-[rgba(122,98,81,0.2)] text-[color:var(--color-brand-accent)]'
      }
    },

    // =========================================================================
    // NEUTRAL VARIANTS
    // =========================================================================
    {
      color: 'neutral',
      variant: 'solid',
      class: {
        root: 'bg-[color:var(--color-brand-secondary)] border-[color:var(--color-brand-secondary)]',
        icon: 'bg-white/20 text-white',
        title: 'text-white',
        description: 'text-white opacity-90'
      }
    },
    {
      color: 'neutral',
      variant: 'soft',
      class: {
        root: 'bg-[color:var(--color-surface-highlight)] border-[color:var(--color-border-soft)]',
        icon: 'bg-[rgba(168,162,158,0.25)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: {
        root: 'bg-[rgba(255,255,255,0.85)] border-[color:var(--color-border-subtle)]',
        icon: 'bg-[rgba(168,162,158,0.25)] text-[color:var(--color-brand-primary)]'
      }
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: {
        root: 'bg-transparent border-[color:var(--color-border-subtle)] border-2',
        icon: 'bg-[rgba(168,162,158,0.25)] text-[color:var(--color-brand-primary)]'
      }
    }
  ],

  defaultVariants: {
    color: 'info',
    variant: 'subtle',
    orientation: 'vertical'
  }
}
