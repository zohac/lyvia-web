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
        Mot de passe <span class="italic text-[color:var(--color-brand-accent)]">oublié</span> ?
      </h1>
      <p class="text-base text-[color:var(--color-brand-secondary)]">
        Saisissez votre adresse e-mail pour recevoir un lien de réinitialisation.
      </p>
    </header>

    <SystemAlert
      v-if="isSubmitting"
      variant="info"
      description="Nous traitons votre demande. Vous allez être redirigé vers l’écran de confirmation."
    />

    <form
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        v-slot="slotProps"
        label="Adresse e-mail"
        :required="true"
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
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-white px-4 text-lg text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-muted)] shadow-soft transition-[border-color,box-shadow,transform] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[rgba(231,229,228,0.9)] focus:border-[color:var(--color-brand-solid)] focus:ring-[rgba(212,184,160,0.35)]'
          "
          :value="form.email"
          @input="form.email = ($event.target as HTMLInputElement).value"
        >
      </FormControl>

      <PrimaryButton
        type="submit"
        label="Recevoir le lien"
        loading-label="Envoi en cours…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />
    </form>

    <NuxtLink
      to="/login"
      class="text-center text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
    >
      Retour à la connexion
    </NuxtLink>
  </div>
</template>

<script setup lang="ts">
import type { ForgotPasswordResponse } from '../../features/auth/api/auth.contract'
import { apiFetch } from '../../services/api/apiFetch'

definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

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

  const email = form.email.trim()

  // Anti user-enumeration: we always proceed to the confirmation page.
  void apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    withAuth: false,
    body: { email }
  }).catch(() => {})

  try {
    await navigateTo({
      path: '/forgot-password/sent',
      query: { email }
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
