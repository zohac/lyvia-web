<template>
  <AuthPageTemplate
    title="Nouveau mot de passe"
    subtitle="Sécurisez votre compte avec un mot de passe fort."
  >
    <template #alert>
      <SystemAlert
        v-if="error"
        variant="error"
        :description="error"
      />
    </template>

    <div
      v-if="isTokenInvalid"
      class="grid gap-6"
    >
      <SystemAlert
        variant="warning"
        title="Lien expiré ou invalide"
        description="Par mesure de sécurité, ce lien de réinitialisation n’est plus valide."
      />

      <NuxtLink
        to="/forgot-password"
        class="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-sm)] bg-[color:var(--color-accent-main)] px-6 text-[19px] font-bold text-[color:var(--color-accent-contrast)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-accent-hover)]"
      >
        Demander un nouveau lien
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
      />

      <PrimaryButton
        type="submit"
        label="Enregistrer le nouveau mot de passe"
        loading-label="Enregistrement…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
      />
    </form>

    <template #footer>
      <NuxtLink
        v-if="!isTokenInvalid"
        to="/login"
        class="font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
      >
        Retour à la connexion
      </NuxtLink>
    </template>
  </AuthPageTemplate>
</template>

<script setup lang="ts">
import type { ResetPasswordResponse } from '../features/auth/api/auth.contract'
import { isPasswordStrong } from '../features/auth/password/password-policy'
import { apiFetch } from '../services/api/apiFetch'
import { ApiFetchError, mapAuthErrorCodeToUserMessage } from '../services/api/api-error'

definePageMeta({
  layout: 'public',
  publicLayout: { hideHeader: true, hideFooter: true, fullBleed: true }
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
