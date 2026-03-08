<script setup lang="ts">
defineProps<{
  coachName?: string
}>()
</script>

<template>
  <div class="flex min-h-[60vh] flex-col items-center justify-center px-6 py-20 text-center">
    <div class="mx-auto max-w-md">
      <div class="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-crepuscule-100)]">
        <UIcon
          name="lucide:user-x"
          size="40"
          class="text-[color:var(--color-crepuscule-600)]"
        />
      </div>

      <h1 class="font-serif text-3xl italic text-[color:var(--color-brand-primary)]">
        Coach temporairement indisponible
      </h1>

      <p class="mt-4 text-lg text-[color:var(--color-brand-secondary)]">
        {{ coachName ? `${coachName} n'est` : 'Ce coach n\'est' }} pas disponible pour le moment.
      </p>

      <p class="mt-2 text-sm text-[color:var(--color-brand-muted)]">
        Si vous avez des questions, n'hésitez pas à nous contacter.
      </p>

      <div class="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <NuxtLink
          to="/"
          class="inline-flex items-center gap-2 rounded-full bg-[color:var(--color-crepuscule-800)] px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-[color:var(--color-crepuscule-900)]"
        >
          <UIcon
            name="lucide:home"
            size="16"
          />
          Retour à l'accueil
        </NuxtLink>

        <a
          href="mailto:contact@kaora.app"
          class="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border-subtle)] px-6 py-3 text-sm font-medium text-[color:var(--color-brand-secondary)] transition-colors hover:border-[color:var(--color-crepuscule-400)] hover:text-[color:var(--color-brand-primary)]"
        >
          <UIcon
            name="lucide:mail"
            size="16"
          />
          Contacter le support
        </a>
      </div>
    </div>
  </div>
</template>
