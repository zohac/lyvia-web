<script setup lang="ts">
defineProps<{
  title: string
  lastUpdated: string
  version?: string
}>()
</script>

<template>
  <div class="legal-content">
    <header class="mb-10 border-b border-[color:var(--color-brand-subtle)] pb-8">
      <h1 class="font-serif text-3xl font-semibold tracking-tight text-[color:var(--color-brand-primary)] sm:text-4xl">
        {{ title }}
      </h1>
      <div class="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[color:var(--color-brand-muted)]">
        <span>Dernière mise à jour : {{ lastUpdated }}</span>
        <span
          v-if="version"
          class="rounded-full bg-[color:var(--color-surface-highlight)] px-2.5 py-0.5 text-xs font-medium"
        >
          Version {{ version }}
        </span>
      </div>
    </header>

    <div class="prose prose-stone max-w-none">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.prose {
  --tw-prose-body: var(--color-brand-secondary);
  --tw-prose-headings: var(--color-brand-primary);
  --tw-prose-links: var(--color-brand-accent);
  --tw-prose-bold: var(--color-brand-primary);
  --tw-prose-counters: var(--color-brand-muted);
  --tw-prose-bullets: var(--color-brand-muted);
  --tw-prose-hr: var(--color-brand-subtle);
}

.prose :deep(h2) {
  font-family: var(--font-family-heading);
  font-size: 1.5rem;
  font-weight: 600;
  margin-top: 2.5rem;
  margin-bottom: 1rem;
  color: var(--color-brand-primary);
}

.prose :deep(h3) {
  font-family: var(--font-family-heading);
  font-size: 1.25rem;
  font-weight: 600;
  margin-top: 2rem;
  margin-bottom: 0.75rem;
  color: var(--color-brand-primary);
}

.prose :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.7;
  color: var(--color-brand-secondary);
}

.prose :deep(ul),
.prose :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.prose :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.6;
  color: var(--color-brand-secondary);
}

.prose :deep(a) {
  color: var(--color-brand-accent);
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

.prose :deep(a:hover) {
  color: var(--color-brand-primary);
}

.prose :deep(strong) {
  color: var(--color-brand-primary);
  font-weight: 600;
}

.prose :deep(hr) {
  margin: 2rem 0;
  border-color: var(--color-brand-subtle);
}
</style>
