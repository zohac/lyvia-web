export const kaoraLink = {
  base: 'focus-visible:outline-primary',
  variants: {
    active: {
      true: 'text-[color:var(--color-kaora-500)]',
      false: 'text-[color:var(--color-kaora-800)]'
    },
    disabled: {
      true: 'cursor-not-allowed opacity-75'
    }
  },
  compoundVariants: [
    {
      active: false,
      disabled: false,
      class: ['hover:text-[color:var(--color-kaora-600)]', 'transition-colors']
    }
  ]
}
