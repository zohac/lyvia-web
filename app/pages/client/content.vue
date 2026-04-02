<template>
  <section class="grid gap-6">
    <AtomsDsPageHeader
      title="Ressources"
      subtitle="Retrouvez bientôt vos contenus et supports d’accompagnement."
    />

    <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] shadow-[var(--shadow-card)]">
      <AtomsDsEmptyState
        icon="i-lucide-book-open"
        title="Contenus à venir"
        description="Cette section sera bientôt alimentée avec vos ressources et recommandations."
      />
    </div>
  </section>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Ressources'
})
</script>
