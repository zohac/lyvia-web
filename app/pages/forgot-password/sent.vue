<template>
  <AuthPageTemplate
    title="Vérifiez votre boîte de réception"
    subtitle="Nous venons de traiter votre demande."
    :autofocus-title="true"
  >
    <div
      class="grid gap-4 text-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)]">
        <svg
          viewBox="0 0 24 24"
          class="h-7 w-7 text-[color:var(--color-brand-secondary)]"
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

      <p class="text-[color:var(--color-brand-secondary)]">
        Si un compte est associé à l’adresse :
      </p>

      <p class="break-words rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)] px-3 py-2 font-mono font-semibold text-[color:var(--color-brand-primary)]">
        {{ email || '—' }}
      </p>

      <p class="text-[color:var(--color-brand-secondary)]">
        vous recevrez un e-mail contenant les instructions de réinitialisation.
      </p>

      <SystemAlert
        variant="info"
        description="Le lien expire dans un délai limité. Pensez à vérifier votre dossier Spam."
      />
    </div>

    <template #footer>
      <NuxtLink
        to="/login"
        class="font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
      >
        Retour à la connexion
      </NuxtLink>
    </template>
  </AuthPageTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'public',
  publicLayout: { hideHeader: true, hideFooter: true, fullBleed: true },
  pageTransition: { name: 'fade', mode: 'out-in' }
})

const route = useRoute()
const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})
</script>
