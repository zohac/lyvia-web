<template>
  <div
    class="grid gap-12"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
    <header class="grid gap-3 text-center">
      <ULink
        to="/"
        aria-label="Retour à l’accueil"
        class="mx-auto mb-12 inline-flex w-fit items-center justify-center"
      >
        <img
          src="/images/kaora-logo.png"
          alt="Kaora"
          class="h-10 w-auto"
          decoding="async"
        >
      </ULink>

      <h1
        ref="titleRef"
        tabindex="-1"
        class="font-serif text-4xl font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]"
      >
        Vérifiez votre boîte de réception
      </h1>
      <p class="text-base text-[color:var(--color-brand-secondary)]">
        Si un compte est associé à cette adresse, un e-mail vous sera envoyé.
      </p>
    </header>

    <div class="grid gap-4 text-center">
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[rgba(212,184,160,0.35)] text-[color:var(--color-brand-primary)]">
        <svg
          viewBox="0 0 24 24"
          class="h-7 w-7"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="M22 12v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-6" />
          <path d="M22 7.5V8a2 2 0 0 1-1 1.73l-8 4.27a2 2 0 0 1-2 0L3 9.73A2 2 0 0 1 2 8v-.5" />
          <path d="M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2" />
        </svg>
      </div>

      <p class="text-sm font-semibold text-[color:var(--color-brand-secondary)]">
        Adresse saisie
      </p>

      <p class="break-words rounded-[var(--radius-md)] border border-[rgba(231,229,228,0.9)] bg-white px-4 py-3 font-mono text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft">
        {{ email || '—' }}
      </p>

      <SystemAlert
        variant="info"
        description="Le lien expire dans un délai limité. Pensez à vérifier votre dossier Spam."
      />
    </div>

    <div class="grid gap-4">
      <UButton
        to="/login"
        label="Retour à la connexion"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />
      <ULink
        to="/"
        class="text-center text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
      >
        Revenir à l’accueil
      </ULink>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

const route = useRoute()
const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})

const titleRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.server) return
  titleRef.value?.focus()
})
</script>
