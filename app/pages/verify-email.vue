<template>
  <div class="grid gap-12">
    <header class="grid gap-3">
      <ULink
        to="/"
        aria-label="Retour à l'accueil"
        class="mb-12 inline-flex w-fit items-center justify-center"
      >
        <NuxtImg
          src="/images/kaora-logo.png"
          alt="Kaora"
          class="h-10 w-auto"
          decoding="async"
          loading="eager"
        />
      </ULink>

      <h1 class="font-serif text-4xl font-bold leading-tight text-[#221d28]">
        Vérification <span class="italic text-[#d4956a]">d'email</span>
      </h1>
    </header>

    <!-- Loading -->
    <div
      v-if="isLoading"
      class="space-y-4 text-center"
    >
      <div
        role="status"
        class="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-[#e8e3ed] border-t-[#5b4b6e]"
        aria-label="Vérification en cours"
      />
      <p class="text-sm text-[#857d8c]">
        Vérification en cours...
      </p>
    </div>

    <!-- Error -->
    <div
      v-else-if="error"
      class="grid gap-6"
    >
      <SystemAlert
        variant="error"
        :description="error"
      />

      <UButton
        label="Retour à la connexion"
        to="/login"
        variant="outline"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { VerifyEmailChangeResponse } from '../features/auth/api/auth.contract'
import { apiFetch } from '../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../services/api/api-error'

definePageMeta({
  layout: 'auth'
})

const route = useRoute()

const isLoading = ref(true)
const error = ref<string | null>(null)

const token = computed(() => {
  const q = route.query.token
  return typeof q === 'string' && q.length > 0 ? q : null
})

onMounted(async () => {
  if (!token.value) {
    error.value = 'Token manquant. Vérifiez le lien reçu par email.'
    isLoading.value = false
    return
  }

  try {
    await apiFetch<VerifyEmailChangeResponse>(
      '/auth/verify-email-change',
      {
        method: 'POST',
        withAuth: false,
        body: { token: token.value }
      }
    )
    await navigateTo({ path: '/login', query: { 'email-verified': 'success' } })
    return
  } catch (err: unknown) {
    error.value = err instanceof ApiFetchError
      ? mapAuthErrorCodeToUserMessage(err.apiError.code)
      : 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isLoading.value = false
  }
})
</script>
