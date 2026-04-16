/**
 * Keova Design System — Cards (Simplified)
 *
 * 2 variants:
 * - base: standard card — white bg, subtle shadow (default, ~90% usage)
 * - featured: accent bar top gradient for highlighted content
 *
 * Shape: use class="rounded-blob-a|b|c|d" on the component if needed.
 */
export const keovaCard = {
  slots: {
    root: [
      'relative',
      'border',
      'overflow-hidden',
      'transition-all duration-200 ease-out'
    ].join(' '),
    header: 'px-6 py-5',
    body: 'px-6 py-5',
    footer: 'px-6 py-5'
  },

  variants: {
    variant: {
      base: {
        root: [
          'bg-[color:var(--color-surface-card)]',
          'border-[rgba(231,229,228,0.7)]',
          'shadow-[var(--shadow-card)]'
        ].join(' ')
      },

      featured: {
        root: [
          'bg-[color:var(--color-surface-card)]',
          'border-[rgba(231,229,228,0.7)]',
          'shadow-[var(--shadow-card)]',
          'border-t-2',
          'border-t-[color:var(--color-brand-accent)]'
        ].join(' ')
      }
    }
  },

  defaultVariants: {
    variant: 'base'
  }
}
