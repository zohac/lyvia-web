export const kaoraAlert = {
  slots: {
    root: [
      "relative",
      "p-4",
      "rounded-[var(--radius-md)]",
      "border",
      "flex items-start gap-3",
    ].join(" "),
    icon: "shrink-0 size-5",
    title: "font-bold text-sm",
    description: "text-sm mt-1",
  },

  variants: {
    color: {
      primary: {
        root: [
          "bg-[color:rgba(212,184,160,0.08)]",
          "border-[color:rgba(212,184,160,0.25)]",
          "text-[color:var(--color-brand-accent)]",
        ].join(" "),
      },
      success: {
        root: [
          "bg-[color:rgba(181,192,163,0.12)]",
          "border-[color:rgba(181,192,163,0.35)]",
          "text-[color:var(--color-brand-primary)]",
        ].join(" "),
      },
      warning: {
        root: [
          "bg-[color:rgba(217,119,6,0.08)]",
          "border-[color:rgba(217,119,6,0.25)]",
          "text-[color:var(--color-warning)]",
        ].join(" "),
      },
      error: {
        root: [
          "bg-[color:rgba(239,68,68,0.08)]",
          "border-[color:rgba(239,68,68,0.22)]",
          "text-[color:var(--color-error)]",
        ].join(" "),
      },
      neutral: {
        root: [
          "bg-[color:var(--color-surface-highlight)]",
          "border-[color:var(--color-border-soft)]",
          "text-[color:var(--color-brand-primary)]",
        ].join(" "),
      },
    },
  },

  defaultVariants: {
    color: "neutral",
  },
};
