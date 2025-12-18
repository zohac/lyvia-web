<template>
  <main class="mx-auto w-full max-w-5xl px-6 py-16">
    <h1 class="font-serif text-3xl text-[color:var(--color-brand-primary)]">
      Espace Coach
    </h1>
    <p class="mt-3 max-w-prose text-[color:var(--color-brand-secondary)]">
      Dashboard en cours de construction.
    </p>
  </main>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider'
})
</script>
