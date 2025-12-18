<template>
  <AuthPageTemplate
    title="Vérifiez votre boîte de réception"
    subtitle="Nous venons de traiter votre demande."
  >
    <div class="grid gap-4 text-center">
      <p class="text-[color:var(--color-brand-secondary)]">
        Si un compte est associé à l’adresse :
      </p>

      <p class="break-words rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)] px-3 py-2 font-semibold text-[color:var(--color-brand-primary)]">
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
  layout: 'auth',
  middleware: 'guest-only'
})

const route = useRoute()
const email = computed(() => {
  const value = route.query.email
  return typeof value === 'string' ? value : ''
})
</script>
