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
const guideChoice = ref('perimenopause')
const consent = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

const guideOptions = [
  { value: 'perimenopause', label: 'Comprendre la périménopause' },
  { value: 'menopause', label: 'Vivre la ménopause au quotidien' },
  { value: 'post-menopause', label: 'Après la ménopause : prévenir et agir' }
]

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.value.trim()))
const canSubmit = computed(() => isValidEmail.value && consent.value && !isSubmitting.value)

async function handleSubmit() {
  if (!canSubmit.value) return
  isSubmitting.value = true

  try {
    await apiFetch('/public/lead-magnet-download', {
      method: 'POST',
      withAuth: false,
      body: {
        email: email.value.trim(),
        slug: `keova:guide-${guideChoice.value}`,
        consent: consent.value
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
    <div class="grid size-14 place-items-center rounded-full bg-[color:var(--color-success-50)]0/20 ring-2 ring-emerald-400/30">
      <UIcon
        name="i-lucide-check-circle"
        class="size-7 text-[color:var(--color-success-400)]"
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
    @submit.prevent="handleSubmit"
  >
    <!-- Guide choice (AC-10) -->
    <fieldset class="mb-4">
      <legend class="mb-2 block text-xs font-medium text-[#c4bdd0]">
        Choisissez votre guide
      </legend>
      <div class="space-y-2">
        <label
          v-for="opt in guideOptions"
          :key="opt.value"
          class="flex cursor-pointer items-center gap-3 rounded-xl bg-white/10 px-4 py-2.5 text-sm text-white/90 transition-all duration-200 hover:bg-white/15"
          :class="{ 'bg-white/20 ring-1 ring-[#d4956a]/40': guideChoice === opt.value }"
        >
          <input
            v-model="guideChoice"
            type="radio"
            name="guide-choice"
            :value="opt.value"
            class="size-4 accent-[#d4956a]"
          >
          <span>{{ opt.label }}</span>
        </label>
      </div>
    </fieldset>

    <label
      for="lead-capture-b2c-email"
      class="mb-2 block text-xs font-medium text-[#c4bdd0]"
    >Votre adresse email</label>
    <div class="flex items-center rounded-xl bg-white/95 p-1.5 shadow-lg backdrop-blur-sm transition-shadow duration-300 focus-within:shadow-xl sm:rounded-full">
      <div class="relative flex-1">
        <UIcon
          name="i-lucide-mail"
          class="absolute left-3.5 top-1/2 size-5 -translate-y-1/2 text-[#b5adc0]"
        />
        <input
          id="lead-capture-b2c-email"
          v-model="email"
          type="email"
          placeholder="votre@email.com"
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
    </div>

    <!-- RGPD consent -->
    <label class="mt-3 flex items-start gap-2.5">
      <input
        v-model="consent"
        type="checkbox"
        class="mt-0.5 size-4 shrink-0 cursor-pointer accent-[#d4956a]"
        :disabled="isSubmitting"
      >
      <span class="text-xs leading-relaxed text-[#c4bdd0]">
        J'accepte de recevoir le guide et des conseils par email. Désabonnement possible à tout moment.
        <NuxtLink
          to="/legal/confidentialite"
          class="underline hover:text-white"
        >Politique de confidentialité</NuxtLink>
      </span>
    </label>
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
