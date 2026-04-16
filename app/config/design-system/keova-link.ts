export const keovaLink = {
  base: 'focus-visible:outline-primary',
  variants: {
    active: {
      true: 'text-[color:var(--color-brand-primary-light)]',
      false: 'text-[color:var(--color-brand-primary-dark)]'
    },
    disabled: {
      true: 'cursor-not-allowed opacity-75'
    }
  },
  compoundVariants: [
    {
      active: false,
      disabled: false,
      class: ['hover:text-[color:var(--color-brand-primary)]', 'transition-colors']
    }
  ]
}
