<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'

const toast = useToast()

const email = ref('')
const isSubmitting = ref(false)
const isSubmitted = ref(false)

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const canSubmit = computed(() => isValidEmail.value && !isSubmitting.value)

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true

  try {
    await apiFetch('/public/newsletter', {
      method: 'POST',
      withAuth: false,
      body: {
        email: email.value.trim(),
        source: 'landing_b2c'
      }
    })

    toast.add({
      title: 'Merci ! Vous recevrez bientôt nos conseils.',
      color: 'success'
    })
    isSubmitted.value = true
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && err.apiError.statusCode === 429) {
      toast.add({
        title: 'Trop de tentatives. Réessayez plus tard.',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Une erreur est survenue. Réessayez dans un instant.',
        color: 'error'
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Confirmation -->
  <div
    v-if="isSubmitted"
    class="text-center"
  >
    <UIcon
      name="i-lucide-check-circle"
      class="mx-auto size-10 text-emerald-500"
    />
    <p class="mt-3 text-base font-medium text-[#3d3250]">
      Vous êtes inscrite !
    </p>
    <p class="mt-1 text-sm text-[#857d8c]">
      Vérifiez vos spams si vous ne recevez rien.
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    class="flex flex-col items-center gap-3 sm:flex-row"
    @submit.prevent="handleSubmit"
  >
    <UInput
      v-model="email"
      type="email"
      placeholder="Votre adresse email"
      :disabled="isSubmitting"
      class="w-full sm:flex-1"
    />
    <UButton
      type="submit"
      :loading="isSubmitting"
      :disabled="!canSubmit"
      color="primary"
      size="md"
      class="w-full shrink-0 sm:w-auto"
    >
      S'inscrire
    </UButton>
  </form>
</template>
