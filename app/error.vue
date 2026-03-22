<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{
  error: NuxtError
}>()

const title = computed(() => {
  if (props.error.statusMessage) return props.error.statusMessage
  if (props.error.statusCode === 404) return 'Page introuvable'
  return 'Une erreur est survenue'
})

const description = computed(() => {
  if (props.error.statusCode === 404) {
    return 'Le lien est peut-être incorrect, ou la page a été déplacée.'
  }
  return 'Veuillez réessayer dans quelques instants.'
})

function goHome() {
  clearError({ redirect: '/' })
}
</script>

<template>
  <Head>
    <Meta
      name="robots"
      content="noindex"
    />
  </Head>
  <div class="min-h-[100svh] bg-[color:var(--color-surface-page)] px-4 py-12 sm:px-6">
    <div class="mx-auto w-full max-w-[640px] rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-8 text-center shadow-[var(--shadow-card)] sm:p-10">
      <p class="text-sm font-semibold tracking-wide text-[color:var(--color-brand-secondary)]">
        Erreur {{ error.statusCode ?? '' }}
      </p>
      <h1 class="mt-3 font-serif text-[2rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
        {{ title }}
      </h1>
      <p class="mt-3 text-[color:var(--color-brand-secondary)]">
        {{ description }}
      </p>

      <div class="mt-8 grid gap-3">
        <UButton
          color="primary"
          block
          @click="goHome"
        >
          Retour à l'accueil
        </UButton>
        <ULink
          to="/login"
          class="text-sm font-semibold text-[color:var(--color-brand-primary)] hover:underline"
        >
          Accéder à mon espace
        </ULink>
      </div>
    </div>
  </div>
</template>
