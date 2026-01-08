export const kaoraInput = {
  slots: {
    root: "relative w-full",
    base: [
      "w-full",
      "px-4 py-3",
      "rounded-[var(--radius-input)]",
      "border border-[color:var(--color-border-subtle)]",
      "bg-[color:var(--color-surface-card)]",
      "text-[color:var(--color-brand-primary)]",
      "placeholder:text-[color:var(--color-brand-muted)]",
      "transition-all duration-[var(--duration-normal)]",
      "focus:outline-none",
      "focus:border-[color:var(--color-brand-accent)]",
      "focus:ring-2 focus:ring-[color:rgba(212,184,160,0.2)]",
      "disabled:opacity-60 disabled:cursor-not-allowed",
      "font-medium",
    ].join(" "),
  },

  variants: {
    size: {
      sm: { base: "h-10 px-3 py-2 text-sm" },
      md: { base: "h-12 px-4 py-3 text-sm" },
      lg: { base: "h-14 px-5 py-4 text-base" },
    },
  },

  defaultVariants: {
    size: "md",
  },
};
