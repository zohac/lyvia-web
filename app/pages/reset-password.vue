<template>
  <div class="grid gap-12">
    <header class="grid gap-3">
      <ULink
        to="/"
        aria-label="Retour à l’accueil"
        class="mb-12 inline-flex w-fit items-center justify-center"
      >
        <NuxtImg
          src="/images/keova-logo.png"
          alt="Keova"
          class="h-10 w-auto"
          loading="eager"
        />
      </ULink>

      <h1 class="font-serif text-4xl font-bold leading-tight text-[#221d28]">
        Nouveau <span class="italic text-[#d4956a]">mot de passe</span>
      </h1>
      <p class="text-base text-[#4a4255]">
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

      <UButton
        to="/forgot-password"
        label="Demander un nouveau lien"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />

      <ULink
        to="/login"
        class="text-center text-sm font-semibold text-[#4a4255] hover:underline"
      >
        Retour à la connexion
      </ULink>
    </div>

    <form
      v-else
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="new-password"
        v-slot="slotProps"
        label="Nouveau mot de passe"
        :required="true"
        :error="passwordError"
        :described-by-ids="[criteriaId]"
      >
        <UInput
          v-model="form.newPassword"
          v-bind="slotProps?.inputAttrs ?? { id: 'new-password' }"
          name="newPassword"
          :type="showNewPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :disabled="isSubmitting"
          :ui="{ trailing: 'pe-1' }"
          size="xl"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showNewPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showNewPassword ? 'Masquer' : 'Afficher'"
              :aria-pressed="showNewPassword"
              aria-controls="new-password"
              @click="showNewPassword = !showNewPassword"
            />
          </template>
        </UInput>
      </FormControl>

      <PasswordCriteriaList
        :id="criteriaId"
        :password="form.newPassword"
      />

      <FormControl
        id="confirm-password"
        v-slot="slotProps"
        label="Confirmer le mot de passe"
        :required="true"
        :error="confirmError"
      >
        <UInput
          v-model="form.confirmPassword"
          v-bind="slotProps?.inputAttrs ?? { id: 'confirm-password' }"
          name="confirmPassword"
          :type="showConfirmPassword ? 'text' : 'password'"
          autocomplete="new-password"
          :disabled="isSubmitting"
          :ui="{ trailing: 'pe-1' }"
          size="xl"
        >
          <template #trailing>
            <UButton
              color="neutral"
              variant="link"
              size="sm"
              :icon="showConfirmPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              :aria-label="showConfirmPassword ? 'Masquer' : 'Afficher'"
              :aria-pressed="showConfirmPassword"
              aria-controls="confirm-password"
              @click="showConfirmPassword = !showConfirmPassword"
            />
          </template>
        </UInput>
      </FormControl>

      <UButton
        type="submit"
        label="Enregistrer le nouveau mot de passe"
        loading-label="Enregistrement…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />
    </form>

    <ULink
      v-if="!isTokenInvalid"
      to="/login"
      class="text-center text-sm font-semibold text-[#4a4255] hover:underline"
    >
      Retour à la connexion
    </ULink>
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
  // Priority: fragment (secure, not sent in HTTP Referer/logs), fallback to query (legacy links).
  if (import.meta.client) {
    const hash = window.location.hash || ''
    const match = /^#token=(.+)$/.exec(hash)
    if (match?.[1]) return decodeURIComponent(match[1])
  }
  const value = route.query.token
  return typeof value === 'string' ? value : ''
})

// Clean token from URL bar after reading (removes hash fragment from browser history).
onMounted(() => {
  if (token.value && window.location.hash) {
    window.history.replaceState(null, '', window.location.pathname)
  }
})

const form = reactive({
  newPassword: '',
  confirmPassword: ''
})

const isSubmitting = ref(false)
const error = ref<string | null>(null)
const isTokenInvalid = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)

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
