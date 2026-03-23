<script setup lang="ts">
/**
 * Lead capture form for B2C landing page.
 * Calls POST /public/lead-magnet-download with slug: 'keova'.
 * Anti-enumeration: same behavior whether email is new or already exists.
 */
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'

const toast = useToast()

const email = ref('')
const isSubmitting = ref(false)
const isSubmitted = ref(false)

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))
const canSubmit = computed(() => isValidEmail.value && !isSubmitting.value)

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true

  try {
    await apiFetch('/public/lead-magnet-download', {
      method: 'POST',
      withAuth: false,
      body: {
        email: email.value.trim(),
        slug: 'keova',
        consent: true
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
        title: 'Trop de tentatives.',
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
  <!-- Confirmation state -->
  <div
    v-if="isSubmitted"
    class="lead-capture-confirmed flex flex-col items-center gap-3 text-center"
  >
    <div class="grid size-14 place-items-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/30">
      <UIcon
        name="i-lucide-check-circle"
        class="size-7 text-emerald-400"
      />
    </div>
    <p class="text-lg font-semibold text-white">
      Vous êtes inscrite !
    </p>
    <p class="text-sm text-[#c4bdd0]">
      Vérifiez vos spams si vous ne recevez rien.
    </p>
  </div>

  <!-- Form — inline input+button inside a pill container -->
  <form
    v-else
    class="flex items-center rounded-xl bg-white/95 p-1.5 shadow-lg backdrop-blur-sm transition-shadow duration-300 focus-within:shadow-xl sm:rounded-full"
    @submit.prevent="handleSubmit"
  >
    <div class="relative flex-1">
      <UIcon
        name="i-lucide-mail"
        class="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#b5adc0]"
      />
      <input
        v-model="email"
        type="email"
        placeholder="Votre adresse email"
        :disabled="isSubmitting"
        class="w-full rounded-lg bg-transparent py-3 pl-11 pr-3 text-sm text-[#3d3250] outline-none placeholder:text-[#b5adc0] disabled:opacity-50 sm:rounded-full"
      >
    </div>
    <button
      type="submit"
      :disabled="!canSubmit || isSubmitting"
      class="shrink-0 cursor-pointer rounded-lg bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all duration-300 hover:from-[#4a3d5e] hover:to-[#6d5c82] hover:shadow-md disabled:pointer-events-none disabled:opacity-50 sm:rounded-full"
    >
      <UIcon
        v-if="isSubmitting"
        name="i-lucide-loader-2"
        class="size-5 animate-spin"
      />
      <span v-else>S'inscrire</span>
    </button>
  </form>
</template>

<style scoped>
.lead-capture-confirmed {
  animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
