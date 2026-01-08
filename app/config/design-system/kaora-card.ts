export const kaoraCard = {
  slots: {
    root: [
      "relative",
      "overflow-hidden",
      "bg-[color:var(--color-surface-card)]",
      "border border-[color:var(--color-border-soft)]",
      "shadow-[var(--shadow-card)]",
      "transition-all duration-[var(--duration-normal)]",
    ].join(" "),

    header: "p-6 border-b border-[color:var(--color-border-soft)]",
    body: "p-6",
    footer: "p-6 border-t border-[color:var(--color-border-soft)]",
  },

  variants: {
    variant: {
      organic: { root: "rounded-[var(--radius-lg)]" },
      glass: {
        root: [
          "rounded-[var(--radius-lg)]",
          "bg-[color:var(--color-surface-glass)]",
          "backdrop-blur-[12px]",
          "border-[color:rgba(255,255,255,0.6)]",
        ].join(" "),
      },
      flat: { root: "rounded-[var(--radius-md)] shadow-none" },
    },

    padding: {
      none: { body: "p-0" },
      sm: { body: "p-4" },
      md: { body: "p-6" },
      lg: { body: "p-8" },
    },
  },

  defaultVariants: {
    variant: "organic",
    padding: "md",
  },
};
