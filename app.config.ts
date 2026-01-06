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
    button: {
      // 1) Slots: structure & règles universelles
      slots: {
        base: [
          // layout
          'inline-flex items-center justify-center gap-2',
          // typography (bold comme dans DS)
          'font-bold',
          // shape (Kaora organic radius)
          'rounded-[var(--radius-sm)]',
          // interaction
          'select-none',
          'transition-all duration-[var(--duration-normal)] ease-[var(--ease-smooth)]',
          // focus/disabled
          'disabled:cursor-not-allowed aria-disabled:cursor-not-allowed',
          'disabled:opacity-60 aria-disabled:opacity-60',
          // focus visible (global outline défini dans main.css, mais on peut l'override)
          'focus-visible:outline-[3px] focus-visible:outline-[rgba(212,184,160,0.9)] focus-visible:outline-offset-2'
        ].join(' '),

        leadingIcon: 'shrink-0',
        trailingIcon: 'shrink-0'
      },

      // 2) Variants: size/color/variant
      variants: {
        size: {
          // Tailles "Apple-grade" : targets confortables (44px min iOS)
          xs: {
            base: 'h-9 px-3 text-xs',
            leadingIcon: 'size-4',
            trailingIcon: 'size-4'
          },
          sm: {
            base: 'h-10 px-4 text-sm',
            leadingIcon: 'size-4',
            trailingIcon: 'size-4'
          },
          md: {
            base: 'h-12 px-5 text-sm',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          },
          lg: {
            base: 'h-14 px-6 text-base',
            leadingIcon: 'size-5',
            trailingIcon: 'size-5'
          },
          xl: {
            base: 'h-16 px-8 text-base',
            leadingIcon: 'size-6',
            trailingIcon: 'size-6'
          }
        },

        // Variants Nuxt UI: solid/outline/ghost/soft/link
        variant: {
          solid: { base: 'shadow-[var(--shadow-floating)]' },
          outline: { base: 'border shadow-[var(--shadow-card)] bg-[color:var(--color-surface-card)]' },
          ghost: { base: 'bg-transparent shadow-none' },
          soft: { base: 'shadow-[var(--shadow-card)]' },
          link: { base: 'bg-transparent shadow-none p-0 h-auto' }
        },

        // Colors: primary (kaora) / neutral (stone) / success / warning / error
        color: {
          primary: { base: '' },
          neutral: { base: '' },
          success: { base: '' },
          warning: { base: '' },
          error: { base: '' }
        }
      },

      // 3) Compound variants: la vérité visuelle Kaora
      compoundVariants: [
        // ===================================================================
        // NEUTRAL (stone) — PRIMARY CTA KAORA
        // ===================================================================
        // Solid = stone-900 background (CTA principal)
        {
          color: 'neutral',
          variant: 'solid',
          class: [
            'bg-[color:var(--color-accent-main)]',
            'text-[color:var(--color-accent-contrast)]',
            'hover:bg-[color:var(--color-accent-hover)]',
            'active:scale-[0.98]'
          ].join(' ')
        },

        // Outline = secondary action (stone border)
        {
          color: 'neutral',
          variant: 'outline',
          class: [
            'border-[color:var(--color-brand-subtle)]',
            'text-[color:var(--color-brand-primary)]',
            'hover:bg-[color:var(--color-surface-highlight)]',
            'active:scale-[0.98]'
          ].join(' ')
        },

        // Ghost = tertiary/discret
        {
          color: 'neutral',
          variant: 'ghost',
          class: [
            'text-[color:var(--color-brand-secondary)]',
            'hover:text-[color:var(--color-brand-primary)]',
            'hover:bg-[color:var(--color-surface-highlight)]',
            'px-3'
          ].join(' ')
        },

        // Soft = subtle background
        {
          color: 'neutral',
          variant: 'soft',
          class: [
            'bg-[color:var(--color-surface-highlight)]',
            'text-[color:var(--color-brand-primary)]',
            'hover:bg-[color:var(--color-brand-subtle)]',
            'border border-[color:var(--color-border-soft)]'
          ].join(' ')
        },

        // Link = inline text button
        {
          color: 'neutral',
          variant: 'link',
          class: [
            'text-[color:var(--color-brand-secondary)]',
            'hover:text-[color:var(--color-brand-primary)]',
            'hover:underline underline-offset-4'
          ].join(' ')
        },

        // ===================================================================
        // PRIMARY (kaora) — BRAND ACTIONS
        // ===================================================================
        // Solid = kaora accent (brand highlight)
        {
          color: 'primary',
          variant: 'solid',
          class: [
            'bg-[color:var(--ui-primary)]',
            'text-white',
            'hover:bg-[color:var(--color-kaora-700)]',
            'active:scale-[0.98]'
          ].join(' ')
        },

        // Outline = kaora border
        {
          color: 'primary',
          variant: 'outline',
          class: [
            'border-[color:var(--color-brand-accent)]',
            'text-[color:var(--color-brand-accent)]',
            'hover:bg-[color:rgba(212,184,160,0.08)]',
            'active:scale-[0.98]'
          ].join(' ')
        },

        // Ghost = brand link style
        {
          color: 'primary',
          variant: 'ghost',
          class: [
            'text-[color:var(--color-brand-accent)]',
            'hover:bg-[color:rgba(212,184,160,0.08)]',
            'px-3'
          ].join(' ')
        },

        // Soft = subtle kaora tint
        {
          color: 'primary',
          variant: 'soft',
          class: [
            'bg-[color:rgba(212,184,160,0.12)]',
            'text-[color:var(--color-brand-accent)]',
            'hover:bg-[color:rgba(212,184,160,0.18)]',
            'border border-[color:rgba(212,184,160,0.25)]'
          ].join(' ')
        },

        // Link = inline brand link
        {
          color: 'primary',
          variant: 'link',
          class: [
            'text-[color:var(--color-brand-accent)]',
            'hover:underline underline-offset-4'
          ].join(' ')
        },

        // ===================================================================
        // SUCCESS (sage green)
        // ===================================================================
        {
          color: 'success',
          variant: 'solid',
          class: [
            'bg-[color:var(--color-success)]',
            'text-[color:var(--color-brand-primary)]',
            'hover:opacity-95',
            'active:scale-[0.98]'
          ].join(' ')
        },
        {
          color: 'success',
          variant: 'outline',
          class: [
            'border-[color:rgba(181,192,163,0.35)]',
            'text-[color:var(--color-success)]',
            'hover:bg-[color:rgba(181,192,163,0.08)]'
          ].join(' ')
        },
        {
          color: 'success',
          variant: 'soft',
          class: [
            'bg-[color:rgba(181,192,163,0.12)]',
            'text-[color:var(--color-success)]',
            'hover:bg-[color:rgba(181,192,163,0.18)]',
            'border border-[color:rgba(181,192,163,0.25)]'
          ].join(' ')
        },

        // ===================================================================
        // WARNING (amber)
        // ===================================================================
        {
          color: 'warning',
          variant: 'solid',
          class: [
            'bg-[color:var(--color-warning)]',
            'text-white',
            'hover:opacity-95',
            'active:scale-[0.98]'
          ].join(' ')
        },
        {
          color: 'warning',
          variant: 'outline',
          class: [
            'border-[color:rgba(217,119,6,0.35)]',
            'text-[color:var(--color-warning)]',
            'hover:bg-[color:rgba(217,119,6,0.08)]'
          ].join(' ')
        },
        {
          color: 'warning',
          variant: 'soft',
          class: [
            'bg-[color:rgba(217,119,6,0.14)]',
            'text-[color:var(--color-warning)]',
            'hover:bg-[color:rgba(217,119,6,0.20)]',
            'border border-[color:rgba(217,119,6,0.25)]'
          ].join(' ')
        },

        // ===================================================================
        // ERROR (red) — DESTRUCTIVE
        // ===================================================================
        {
          color: 'error',
          variant: 'solid',
          class: [
            'bg-[color:var(--color-error)]',
            'text-white',
            'hover:opacity-90',
            'active:scale-[0.98]'
          ].join(' ')
        },
        {
          color: 'error',
          variant: 'outline',
          class: [
            'border-[color:rgba(239,68,68,0.35)]',
            'text-[color:var(--color-error)]',
            'hover:bg-[color:rgba(239,68,68,0.08)]'
          ].join(' ')
        },
        {
          color: 'error',
          variant: 'soft',
          class: [
            'bg-[color:rgba(239,68,68,0.1)]',
            'text-[color:var(--color-error)]',
            'hover:bg-[color:rgba(239,68,68,0.16)]',
            'border border-[color:rgba(239,68,68,0.22)]'
          ].join(' ')
        }
      ],

      // 4) Defaults: Kaora = neutral solid (stone-900) comme CTA principal
      defaultVariants: {
        color: 'neutral',
        variant: 'solid',
        size: 'md'
      }
    },

    // =========================================================================
    // BADGE — Organic Luxury Theme
    // =========================================================================
    badge: {
      slots: {
        base: [
          'inline-flex items-center justify-center gap-1.5',
          'font-bold text-xs',
          'rounded-full',
          'px-2.5 py-1',
          'border',
          'transition-all duration-[var(--duration-fast)]'
        ].join(' ')
      },

      variants: {
        color: {
          primary: { base: '' },
          neutral: { base: '' },
          success: { base: '' },
          warning: { base: '' },
          error: { base: '' }
        },

        variant: {
          solid: { base: '' },
          soft: { base: '' },
          outline: { base: 'bg-transparent' }
        }
      },

      compoundVariants: [
        // Neutral
        {
          color: 'neutral',
          variant: 'solid',
          class: 'bg-[color:var(--color-brand-primary)] text-white border-transparent'
        },
        {
          color: 'neutral',
          variant: 'soft',
          class: 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)] border-[color:var(--color-border-soft)]'
        },
        {
          color: 'neutral',
          variant: 'outline',
          class: 'text-[color:var(--color-brand-primary)] border-[color:var(--color-brand-subtle)]'
        },

        // Primary (kaora)
        {
          color: 'primary',
          variant: 'solid',
          class: 'bg-[color:var(--ui-primary)] text-white border-transparent'
        },
        {
          color: 'primary',
          variant: 'soft',
          class: 'bg-[color:rgba(212,184,160,0.12)] text-[color:var(--color-brand-accent)] border-[color:rgba(212,184,160,0.25)]'
        },
        {
          color: 'primary',
          variant: 'outline',
          class: 'text-[color:var(--color-brand-accent)] border-[color:rgba(212,184,160,0.35)]'
        },

        // Success
        {
          color: 'success',
          variant: 'solid',
          class: 'bg-[color:var(--color-success)] text-[color:var(--color-brand-primary)] border-transparent'
        },
        {
          color: 'success',
          variant: 'soft',
          class: 'bg-[color:rgba(181,192,163,0.18)] text-[color:var(--color-brand-primary)] border-[color:rgba(181,192,163,0.35)]'
        },
        {
          color: 'success',
          variant: 'outline',
          class: 'text-[color:var(--color-success)] border-[color:rgba(181,192,163,0.35)]'
        },

        // Warning
        {
          color: 'warning',
          variant: 'solid',
          class: 'bg-[color:var(--color-warning)] text-white border-transparent'
        },
        {
          color: 'warning',
          variant: 'soft',
          class: 'bg-[color:rgba(217,119,6,0.14)] text-[color:var(--color-warning)] border-[color:rgba(217,119,6,0.25)]'
        },
        {
          color: 'warning',
          variant: 'outline',
          class: 'text-[color:var(--color-warning)] border-[color:rgba(217,119,6,0.35)]'
        },

        // Error
        {
          color: 'error',
          variant: 'solid',
          class: 'bg-[color:var(--color-error)] text-white border-transparent'
        },
        {
          color: 'error',
          variant: 'soft',
          class: 'bg-[color:rgba(239,68,68,0.1)] text-[color:var(--color-error)] border-[color:rgba(239,68,68,0.22)]'
        },
        {
          color: 'error',
          variant: 'outline',
          class: 'text-[color:var(--color-error)] border-[color:rgba(239,68,68,0.35)]'
        }
      ],

      defaultVariants: {
        color: 'neutral',
        variant: 'soft'
      }
    },

    // =========================================================================
    // CARD — Organic Luxury Theme
    // =========================================================================
    card: {
      slots: {
        root: [
          'relative',
          'overflow-hidden',
          'bg-[color:var(--color-surface-card)]',
          'border border-[color:var(--color-border-soft)]',
          'shadow-[var(--shadow-card)]',
          'transition-all duration-[var(--duration-normal)]'
        ].join(' '),

        header: 'p-6 border-b border-[color:var(--color-border-soft)]',
        body: 'p-6',
        footer: 'p-6 border-t border-[color:var(--color-border-soft)]'
      },

      variants: {
        variant: {
          organic: { root: 'rounded-[var(--radius-lg)]' },
          glass: {
            root: [
              'rounded-[var(--radius-lg)]',
              'bg-[color:var(--color-surface-glass)]',
              'backdrop-blur-[12px]',
              'border-[color:rgba(255,255,255,0.6)]'
            ].join(' ')
          },
          flat: { root: 'rounded-[var(--radius-md)] shadow-none' }
        },

        padding: {
          none: { body: 'p-0' },
          sm: { body: 'p-4' },
          md: { body: 'p-6' },
          lg: { body: 'p-8' }
        }
      },

      defaultVariants: {
        variant: 'organic',
        padding: 'md'
      }
    },

    // =========================================================================
    // INPUT — Organic Luxury Theme
    // =========================================================================
    input: {
      slots: {
        root: 'relative w-full',
        base: [
          'w-full',
          'px-4 py-3',
          'rounded-[var(--radius-input)]',
          'border border-[color:var(--color-border-subtle)]',
          'bg-[color:var(--color-surface-card)]',
          'text-[color:var(--color-brand-primary)]',
          'placeholder:text-[color:var(--color-brand-muted)]',
          'transition-all duration-[var(--duration-normal)]',
          'focus:outline-none',
          'focus:border-[color:var(--color-brand-accent)]',
          'focus:ring-2 focus:ring-[color:rgba(212,184,160,0.2)]',
          'disabled:opacity-60 disabled:cursor-not-allowed',
          'font-medium'
        ].join(' ')
      },

      variants: {
        size: {
          sm: { base: 'h-10 px-3 py-2 text-sm' },
          md: { base: 'h-12 px-4 py-3 text-sm' },
          lg: { base: 'h-14 px-5 py-4 text-base' }
        }
      },

      defaultVariants: {
        size: 'md'
      }
    },

    // =========================================================================
    // ALERT — Organic Luxury Theme
    // =========================================================================
    alert: {
      slots: {
        root: [
          'relative',
          'p-4',
          'rounded-[var(--radius-md)]',
          'border',
          'flex items-start gap-3'
        ].join(' '),
        icon: 'shrink-0 size-5',
        title: 'font-bold text-sm',
        description: 'text-sm mt-1'
      },

      variants: {
        color: {
          primary: {
            root: [
              'bg-[color:rgba(212,184,160,0.08)]',
              'border-[color:rgba(212,184,160,0.25)]',
              'text-[color:var(--color-brand-accent)]'
            ].join(' ')
          },
          success: {
            root: [
              'bg-[color:rgba(181,192,163,0.12)]',
              'border-[color:rgba(181,192,163,0.35)]',
              'text-[color:var(--color-brand-primary)]'
            ].join(' ')
          },
          warning: {
            root: [
              'bg-[color:rgba(217,119,6,0.08)]',
              'border-[color:rgba(217,119,6,0.25)]',
              'text-[color:var(--color-warning)]'
            ].join(' ')
          },
          error: {
            root: [
              'bg-[color:rgba(239,68,68,0.08)]',
              'border-[color:rgba(239,68,68,0.22)]',
              'text-[color:var(--color-error)]'
            ].join(' ')
          },
          neutral: {
            root: [
              'bg-[color:var(--color-surface-highlight)]',
              'border-[color:var(--color-border-soft)]',
              'text-[color:var(--color-brand-primary)]'
            ].join(' ')
          }
        }
      },

      defaultVariants: {
        color: 'neutral'
      }
    }
  }
})
