export const kaoraButton = {
  slots: {
    base: [
      "rounded-full font-bold inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75",
      "transition-colors",
    ],
    label: "truncate",
    leadingIcon: "shrink-0",
    leadingAvatar: "shrink-0",
    leadingAvatarSize: "",
    trailingIcon: "shrink-0",
  },
  variants: {
    fieldGroup: {
      horizontal:
        "not-only:first:rounded-e-none not-only:last:rounded-s-none not-last:not-first:rounded-none focus-visible:z-[1]",
      vertical:
        "not-only:first:rounded-b-none not-only:last:rounded-t-none not-last:not-first:rounded-none focus-visible:z-[1]",
    },
    color: {
      primary: "",
      secondary: "",
      success: "",
      info: "",
      warning: "",
      error: "",
      neutral: "",
    },
    variant: {
      solid: "",
      outline: "",
      soft: "",
      subtle: "",
      ghost: "",
      link: "",
    },
    size: {
      xs: {
        base: "px-4 py-2 text-xs gap-1",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      sm: {
        base: "px-5 py-2 text-sm gap-1.5",
        leadingIcon: "size-4",
        leadingAvatarSize: "3xs",
        trailingIcon: "size-4",
      },
      md: {
        base: "px-5 py-2.5 text-md gap-1.5",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      lg: {
        base: "px-6 py-3 text-lg gap-2",
        leadingIcon: "size-5",
        leadingAvatarSize: "2xs",
        trailingIcon: "size-5",
      },
      xl: {
        base: "px-6 py-4 text-lg gap-2",
        leadingIcon: "size-6",
        leadingAvatarSize: "xs",
        trailingIcon: "size-6",
      },
    },
    block: {
      true: {
        base: "w-full justify-center",
        trailingIcon: "ms-auto",
      },
    },
    square: {
      true: "",
    },
    leading: {
      true: "",
    },
    trailing: {
      true: "",
    },
    loading: {
      true: "",
    },
    active: {
      true: {
        base: "",
      },
      false: {
        base: "",
      },
    },
  },
  compoundVariants: [
    {
      color: "primary",
      variant: "solid",
      class:
        "text-[color:var(--color-accent-contrast)] bg-primary hover:bg-primary/75 active:bg-primary/75 disabled:bg-primary aria-disabled:bg-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    },
    {
      color: "primary",
      variant: "outline",
      class:
        "ring ring-inset ring-primary/50 text-primary hover:bg-primary/10 active:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    },
    {
      color: "primary",
      variant: "soft",
      class:
        "text-primary bg-primary/10 hover:bg-primary/15 active:bg-primary/15 focus:outline-none focus-visible:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10",
    },
    {
      color: "primary",
      variant: "subtle",
      class:
        "text-primary ring ring-inset ring-primary/25 bg-primary/10 hover:bg-primary/15 active:bg-primary/15 disabled:bg-primary/10 aria-disabled:bg-primary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary",
    },
    {
      color: "primary",
      variant: "ghost",
      class:
        "text-primary hover:bg-primary/10 active:bg-primary/10 focus:outline-none focus-visible:bg-primary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent",
    },
    {
      color: "primary",
      variant: "link",
      class:
        "text-primary hover:text-primary/75 active:text-primary/75 disabled:text-primary aria-disabled:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary",
    },
    {
      color: "neutral",
      variant: "solid",
      class:
        "text-inverted bg-primary/10 hover:bg-primary/20 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted",
    },
    {
      color: "neutral",
      variant: "outline",
      class:
        "ring ring-inset ring-accented text-inverted bg-inverted hover:bg-elevated hover:text-default active:bg-elevated disabled:bg-default aria-disabled:bg-default focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted",
    },
    {
      color: "neutral",
      variant: "soft",
      class:
        "text-inverted bg-[color:var(--color-stone-100)] hover:bg-[color:var(--color-stone-200)] active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted",
    },
    {
      color: "neutral",
      variant: "subtle",
      class:
        "ring ring-inset ring-accented text-default bg-elevated hover:bg-accented/75 active:bg-accented/75 disabled:bg-elevated aria-disabled:bg-elevated focus:outline-none focus-visible:ring-2 focus-visible:ring-inverted",
    },
    {
      color: "neutral",
      variant: "ghost",
      class:
        "text-inverted bg-inverted hover:bg-primary/10 active:bg-inverted/90 disabled:bg-inverted aria-disabled:bg-inverted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-inverted",
    },
    {
      color: "neutral",
      variant: "link",
      class:
        "text-muted hover:text-default active:text-default disabled:text-muted aria-disabled:text-muted focus:outline-none focus-visible:ring-inset focus-visible:ring-2 focus-visible:ring-inverted",
    },
    // =========================================================================
    // SECONDARY (kaora) — BRAND ACCENT ACTIONS
    // =========================================================================
    {
      color: "secondary",
      variant: "solid",
      class:
        "text-white bg-secondary hover:bg-secondary/75 active:bg-secondary/75 disabled:bg-secondary aria-disabled:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary",
    },
    {
      color: "secondary",
      variant: "outline",
      class:
        "ring ring-inset ring-secondary/50 text-secondary hover:bg-secondary/10 active:bg-secondary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
    },
    {
      color: "secondary",
      variant: "soft",
      class:
        "text-secondary bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 focus:outline-none focus-visible:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10",
    },
    {
      color: "secondary",
      variant: "subtle",
      class:
        "text-secondary ring ring-inset ring-secondary/25 bg-secondary/10 hover:bg-secondary/15 active:bg-secondary/15 disabled:bg-secondary/10 aria-disabled:bg-secondary/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-secondary",
    },
    {
      color: "secondary",
      variant: "ghost",
      class:
        "text-secondary hover:bg-secondary/10 active:bg-secondary/10 focus:outline-none focus-visible:bg-secondary/10 disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent",
    },
    {
      color: "secondary",
      variant: "link",
      class:
        "text-secondary hover:text-secondary/75 active:text-secondary/75 disabled:text-secondary aria-disabled:text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-secondary",
    },
    {
      size: "xs",
      square: true,
      class: "p-1",
    },
    {
      size: "sm",
      square: true,
      class: "p-1.5",
    },
    {
      size: "md",
      square: true,
      class: "p-1.5",
    },
    {
      size: "lg",
      square: true,
      class: "p-2",
    },
    {
      size: "xl",
      square: true,
      class: "p-2",
    },
    {
      loading: true,
      leading: true,
      class: {
        leadingIcon: "animate-spin",
      },
    },
    {
      loading: true,
      leading: false,
      trailing: true,
      class: {
        trailingIcon: "animate-spin",
      },
    },
  ],
  defaultVariants: {
    color: "primary",
    variant: "solid",
    size: "md",
  },
};
