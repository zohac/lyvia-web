<template>
  <div class="grid gap-12">
    <header class="grid gap-3">
      <NuxtLink
        to="/"
        aria-label="Retour à l’accueil"
        class="mb-12 inline-flex w-fit items-center justify-center"
      >
        <img
          src="/images/kaora-logo.png"
          alt="Kaora"
          class="h-10 w-auto"
          decoding="async"
        >
      </NuxtLink>

      <h1 class="font-serif text-4xl font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
        Nouveau <span class="italic text-[color:var(--color-brand-accent)]">mot de passe</span>
      </h1>
      <p class="text-base text-[color:var(--color-brand-secondary)]">
        Sécurisez votre compte avec un mot de passe fort.
      </p>
    </header>

    <SystemAlert
      v-if="error"
      variant="error"
      :description="error"
    />

    <div
      v-if="isTokenInvalid"
      class="grid gap-6"
    >
      <SystemAlert
        variant="warning"
        title="Lien expiré ou invalide"
        description="Par mesure de sécurité, ce lien de réinitialisation n’est plus valide."
      />

      <PrimaryButton
        to="/forgot-password"
        label="Demander un nouveau lien"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />

      <NuxtLink
        to="/login"
        class="text-center text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
      >
        Retour à la connexion
      </NuxtLink>
    </div>

    <form
      v-else
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <PasswordInput
        id="new-password"
        v-model="form.newPassword"
        label="Nouveau mot de passe"
        name="newPassword"
        autocomplete="new-password"
        :required="true"
        :disabled="isSubmitting"
        :described-by-ids="[criteriaId]"
        :error="passwordError"
        :elevated="true"
      />

      <PasswordCriteriaList
        :id="criteriaId"
        :password="form.newPassword"
      />

      <PasswordInput
        id="confirm-password"
        v-model="form.confirmPassword"
        label="Confirmer le mot de passe"
        name="confirmPassword"
        autocomplete="new-password"
        :required="true"
        :disabled="isSubmitting"
        :error="confirmError"
        :elevated="true"
      />

      <PrimaryButton
        type="submit"
        label="Enregistrer le nouveau mot de passe"
        loading-label="Enregistrement…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />
    </form>

    <NuxtLink
      v-if="!isTokenInvalid"
      to="/login"
      class="text-center text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
    >
      Retour à la connexion
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { ResetPasswordResponse } from '../features/auth/api/auth.contract'
import { isPasswordStrong } from '../features/auth/password/password-policy'
import { apiFetch } from '../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../services/api/api-error'

definePageMeta({
  layout: 'auth'
})

const criteriaId = 'new-password-criteria'

const route = useRoute()
const token = computed(() => {
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isTokenInvalid = ref(false)

const tokenIsWellFormed = computed(() => {
  if (!token.value) return false
  return /^[A-Za-z0-9_-]{30,}$/.test(token.value)
})

watchEffect(() => {
  if (import.meta.server) return
  if (!tokenIsWellFormed.value) {
    error.value = 'Le lien de réinitialisation est invalide ou expiré.'
    isTokenInvalid.value = true
  }
})

const passwordError = computed(() => {
  if (!form.newPassword) return null
  return isPasswordStrong(form.newPassword) ? null : 'Mot de passe trop faible.'
})

const confirmError = computed(() => {
  if (!form.confirmPassword) return null
  return form.confirmPassword === form.newPassword
    ? null
    : 'Les mots de passe ne correspondent pas.'
})

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  if (!token.value) return false
  if (!isPasswordStrong(form.newPassword)) return false
  if (form.newPassword !== form.confirmPassword) return false
  return true
})

watch(
  () => [form.newPassword, form.confirmPassword],
  () => {
    if (error.value) error.value = null
  }
)

async function onSubmit() {
  error.value = null
  isSubmitting.value = true

  if (!tokenIsWellFormed.value) {
    error.value = 'Le lien de réinitialisation est invalide ou expiré.'
    isTokenInvalid.value = true
    isSubmitting.value = false
    return
  }

  try {
    await apiFetch<ResetPasswordResponse>('/auth/reset-password', {
      method: 'POST',
      withAuth: false,
      body: { token: token.value, newPassword: form.newPassword }
    })

    await navigateTo({ path: '/login', query: { reset: 'success' } })
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      error.value = mapAuthErrorCodeToUserMessage(err.apiError.code)
      if (err.apiError.code === 'INVALID_PASSWORD_RESET_TOKEN') {
        isTokenInvalid.value = true
      }
      return
    }
    error.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
