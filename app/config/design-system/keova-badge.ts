export const keovaBadge = {
  slots: {
    base: 'font-medium inline-flex items-center',
    label: 'truncate',
    leadingIcon: 'shrink-0',
    leadingAvatar: 'shrink-0',
    leadingAvatarSize: '',
    trailingIcon: 'shrink-0'
  },
  variants: {
    fieldGroup: {
      horizontal:
        'not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]',
      vertical:
        'not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]'
    },
    color: {
      primary: '',
      secondary: '',
      success: '',
      info: '',
      warning: '',
      error: '',
      neutral: ''
    },
    variant: {
      solid: '',
      outline: '',
      soft: '',
      subtle: ''
    },
    size: {
      xs: {
        base: 'text-[8px]/3 px-1 py-0.5 gap-1 rounded-sm',
        leadingIcon: 'size-3',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-3'
      },
      sm: {
        base: 'text-[10px]/3 px-1.5 py-1 gap-1 rounded-sm',
        leadingIcon: 'size-3',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-3'
      },
      md: {
        base: 'text-xs px-2 py-1 gap-1 rounded-md',
        leadingIcon: 'size-4',
        leadingAvatarSize: '3xs',
        trailingIcon: 'size-4'
      },
      lg: {
        base: 'text-sm px-2 py-1 gap-1.5 rounded-md',
        leadingIcon: 'size-5',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-5'
      },
      xl: {
        base: 'text-base px-2.5 py-1 gap-1.5 rounded-md',
        leadingIcon: 'size-6',
        leadingAvatarSize: '2xs',
        trailingIcon: 'size-6'
      }
    },
    square: {
      true: ''
    }
  },
  compoundVariants: [
    {
      color: 'primary',
      variant: 'solid',
      class: 'bg-primary text-inverted'
    },
    {
      color: 'primary',
      variant: 'outline',
      class: 'text-primary ring ring-inset ring-primary/50'
    },
    {
      color: 'primary',
      variant: 'soft',
      class: 'bg-primary/10 text-primary'
    },
    {
      color: 'primary',
      variant: 'subtle',
      class: 'bg-primary/10 text-primary ring ring-inset ring-primary/25'
    },
    {
      color: 'neutral',
      variant: 'solid',
      class: 'text-inverted bg-inverted'
    },
    {
      color: 'neutral',
      variant: 'outline',
      class: 'ring ring-inset ring-accented text-default bg-default'
    },
    {
      color: 'neutral',
      variant: 'soft',
      class: 'text-default bg-elevated'
    },
    {
      color: 'neutral',
      variant: 'subtle',
      class: 'ring ring-inset ring-accented text-default bg-elevated'
    },
    {
      size: 'xs',
      square: true,
      class: 'p-0.5'
    },
    {
      size: 'sm',
      square: true,
      class: 'p-1'
    },
    {
      size: 'md',
      square: true,
      class: 'p-1'
    },
    {
      size: 'lg',
      square: true,
      class: 'p-1'
    },
    {
      size: 'xl',
      square: true,
      class: 'p-1'
    }
  ],
  defaultVariants: {
    color: 'primary',
    variant: 'solid',
    size: 'md'
  }
}
