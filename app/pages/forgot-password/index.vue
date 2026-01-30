<template>
  <div class="grid gap-10">
    <!-- Brand mark -->
    <header class="grid gap-6">
      <ULink
        to="/"
        aria-label="Retour à l'accueil"
        class="group inline-flex w-fit items-center gap-3"
      >
        <div class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#5b4b6e] to-[#4d3f5c] shadow-lg transition-transform duration-300 group-hover:scale-105">
          <span class="font-serif text-xl font-bold text-white">
            K
          </span>
        </div>
        <span class="font-serif text-2xl tracking-tight text-[#3d3250]">
          Kaora
        </span>
      </ULink>

      <div class="space-y-2 pt-4">
        <h1 class="font-serif text-4xl leading-tight text-[#221d28]">
          Mot de passe
          <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">oublié</span> ?
        </h1>
        <p class="text-[#857d8c]">
          Entrez votre adresse e-mail pour recevoir un lien de réinitialisation.
        </p>
      </div>
    </header>

    <!-- Visual hint -->
    <div class="flex items-center gap-4 rounded-2xl border border-[#ebe7ef] bg-gradient-to-r from-[#f9f8fa] to-white p-4">
      <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-[#5b4b6e]/10">
        <UIcon
          name="i-lucide-mail"
          class="size-6 text-[#5b4b6e]"
        />
      </div>
      <p class="text-sm text-[#4a4255]">
        Un e-mail contenant un lien sécurisé vous sera envoyé pour créer un nouveau mot de passe.
      </p>
    </div>

    <!-- Form -->
    <form
      class="grid gap-5"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        v-slot="slotProps"
        label="Adresse e-mail"
        :required="true"
      >
        <UInput
          ref="emailInputRef"
          v-model="form.email"
          v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="email"
          placeholder="vous@exemple.com"
          :disabled="isSubmitting"
          size="xl"
          class="[&_input]:rounded-full"
          :ui="{
            base: 'transition-all duration-200'
          }"
        >
          <template #leading>
            <UIcon
              name="i-lucide-at-sign"
              class="size-5 text-[#9685ab]"
            />
          </template>
        </UInput>
      </FormControl>

      <UButton
        type="submit"
        size="xl"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="mt-2 w-full justify-center rounded-xl bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
      >
        <template #leading>
          <UIcon
            v-if="!isSubmitting"
            name="i-lucide-send"
            class="size-5"
          />
        </template>
        <span v-if="!isSubmitting">Recevoir le lien</span>
        <span v-else>Envoi en cours...</span>
      </UButton>
    </form>

    <!-- Divider -->
    <div class="relative py-2">
      <div class="absolute inset-0 flex items-center">
        <div class="w-full border-t border-[#ebe7ef]" />
      </div>
      <div class="relative flex justify-center">
        <span class="bg-[#f9f8fa] px-4 text-sm text-[#b9aac7]">ou</span>
      </div>
    </div>

    <!-- Back to login -->
    <div class="text-center">
      <ULink
        to="/login"
        class="group inline-flex items-center gap-2 text-sm font-semibold text-[#5b4b6e] transition-colors hover:text-[#d4956a]"
      >
        <UIcon
          name="i-lucide-arrow-left"
          class="size-4 transition-transform group-hover:-translate-x-1"
        />
        Retour à la connexion
      </ULink>
    </div>
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
const emailInputRef = ref<{ inputRef: { el: HTMLInputElement } } | null>(null)

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  return form.email.trim().length > 0
})

onMounted(() => {
  if (import.meta.server) return
  const canFocus = window.matchMedia?.('(pointer: fine)').matches ?? false
  if (canFocus) emailInputRef.value?.inputRef?.el?.focus()
})

async function onSubmit() {
  isSubmitting.value = true

  const email = form.email.trim()

  const emailState = useState<string | null>('forgot-password.email', () => null)
  emailState.value = email

  // Anti user-enumeration: we always proceed to the confirmation page.
  void apiFetch<ForgotPasswordResponse>('/auth/forgot-password', {
    method: 'POST',
    withAuth: false,
    body: { email }
  }).catch(() => {})

  try {
    await navigateTo({
      path: '/forgot-password/sent'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
