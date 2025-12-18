<template>
  <AuthPageTemplate
    title="Mot de passe oublié ?"
    subtitle="Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation."
  >
    <form
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        label="Adresse e-mail"
        :required="true"
        v-slot="slotProps"
      >
        <input
          ref="emailInputRef"
          v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          :disabled="isSubmitting"
          placeholder="vous@exemple.com"
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
          "
          :value="form.email"
          @input="form.email = ($event.target as HTMLInputElement).value"
        >
      </FormControl>

      <PrimaryButton
        type="submit"
        label="Envoyer le lien de réinitialisation"
        loading-label="Envoi en cours…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
      />
    </form>

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
  middleware: 'guest-only',
  publicLayout: { hideHeader: true, hideFooter: true, fullBleed: true }
})

import type { ForgotPasswordResponse } from '../features/auth/api/auth.contract'
import { apiFetch } from '../services/api/apiFetch'

const form = reactive({
  email: ''
})

const isSubmitting = ref(false)
const emailInputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  return form.email.trim().length > 0
})

onMounted(() => {
  if (import.meta.server) return
  const canFocus = window.matchMedia?.('(pointer: fine)').matches ?? false
  if (canFocus) emailInputRef.value?.focus()
})

async function onSubmit() {
  isSubmitting.value = true

  try {
    await apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
      method: 'POST',
      withAuth: false,
      body: { email: form.email }
    })
  } catch {
    // Anti user-enumeration: we always proceed to the confirmation page.
  } finally {
    isSubmitting.value = false
    await navigateTo({
      path: '/forgot-password/sent',
      query: { email: form.email }
    })
  }
}
</script>
