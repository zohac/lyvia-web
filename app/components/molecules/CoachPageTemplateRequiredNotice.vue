<script setup lang="ts">
// LAB-R14 (rétro epic-lab, F14) — avis statique, aucun état ni prop : la page
// décide seule de le monter (`v-if="!selectedTemplateId"`).
//
// Ce commentaire n'est pas décoratif : `compileSfc` lève « has no <script setup>
// block » sur un SFC purement template comme sur un `<script setup>` réellement
// vide, ce qui interdirait au harnais de rendu (0-42) de le compiler.
</script>

<template>
  <div
    class="mb-10 rounded-xl border border-dashed border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-6 py-8 text-center"
    data-testid="coach-page-template-required"
  >
    <UIcon
      name="i-lucide-layout-template"
      class="mx-auto size-8 text-[color:var(--color-brand-muted)]"
    />
    <p class="mt-3 font-semibold text-[color:var(--color-text-primary)]">
      Choisissez d'abord un template
    </p>
    <p class="mx-auto mt-2 max-w-md text-sm text-[color:var(--color-brand-secondary)]">
      Les sections de votre page (Qui suis-je, Bénéfices, FAQ…) s'affichent ici
      une fois un template sélectionné ci-dessus.
    </p>
  </div>
</template>
