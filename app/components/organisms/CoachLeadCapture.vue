<script setup lang="ts">
/**
 * Y2.6 AC-3/AC-4/AC-5: Lead capture with lead magnet PDF download.
 * Captures email via POST /public/newsletter, then triggers PDF download.
 * Anti-enumeration: same behavior whether email is new or already exists.
 */
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'

const props = defineProps<{
  slug: string
  leadMagnetUrl: string
  leadMagnetTitle: string
}>()

const toast = useToast()

const email = ref('')
const firstName = ref('')
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
        source: `lead_magnet_${props.slug}`.slice(0, 50),
        ...(firstName.value.trim() ? { firstName: firstName.value.trim() } : {})
      }
    })

    toast.add({
      title: 'Merci ! Votre guide est en cours de téléchargement.',
      color: 'success'
    })

    // Download PDF
    window.open(props.leadMagnetUrl, '_blank')

    // Mark as downloaded for exit intent
    if (import.meta.client) {
      sessionStorage.setItem(`lead_magnet_downloaded_${props.slug}`, 'true')
    }

    isSubmitted.value = true
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && err.apiError.statusCode === 429) {
      toast.add({
        title: 'Trop de tentatives. Réessayez dans un instant.',
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
  <section
    id="lead-capture"
    class="relative overflow-hidden bg-gradient-to-br from-[#f5f0eb] to-[#ede4db] px-6 py-20 sm:px-12 lg:px-20"
  >
    <div
      class="pointer-events-none absolute -left-[15%] top-1/2 h-[50vh] w-[50vh] -translate-y-1/2 rounded-full"
      style="background: radial-gradient(circle, rgba(91,75,110,0.08), transparent 60%); filter: blur(60px);"
    />

    <div class="relative mx-auto max-w-2xl text-center">
      <!-- Confirmation state -->
      <div
        v-if="isSubmitted"
        class="flex flex-col items-center gap-4"
      >
        <div class="grid size-16 place-items-center rounded-full bg-emerald-500/20 ring-2 ring-emerald-400/30">
          <UIcon
            name="i-lucide-check-circle"
            class="size-8 text-emerald-600"
          />
        </div>
        <p class="text-xl font-semibold text-[#2d2438]">
          Votre guide est en cours de téléchargement
        </p>
        <p class="text-sm text-[#857d8c]">
          Si le téléchargement ne démarre pas,
          <a
            :href="leadMagnetUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-[#5b4b6e]"
          >cliquez ici</a>.
        </p>
      </div>

      <!-- Form state -->
      <template v-else>
        <span class="mb-4 inline-block text-xs font-bold uppercase tracking-[0.25em] text-[#d4956a]">
          Guide gratuit
        </span>
        <h2 class="font-serif text-3xl leading-tight text-[#2d2438] lg:text-4xl">
          {{ leadMagnetTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-[#4a4255]">
          Téléchargez votre guide gratuit
        </p>

        <form
          class="mx-auto mt-10 max-w-md space-y-4"
          @submit.prevent="handleSubmit"
        >
          <UInput
            v-model="firstName"
            placeholder="Votre prénom (optionnel)"
            size="lg"
            :disabled="isSubmitting"
            class="w-full"
          />
          <UInput
            v-model="email"
            type="email"
            placeholder="Votre adresse email"
            size="lg"
            required
            :disabled="isSubmitting"
            class="w-full"
          />
          <UButton
            type="submit"
            size="lg"
            :disabled="!canSubmit || isSubmitting"
            :loading="isSubmitting"
            class="w-full rounded-full bg-[#d4956a] font-semibold text-white transition-all duration-300 hover:bg-[#c4855a]"
          >
            Recevoir mon guide →
          </UButton>
        </form>

        <p class="mt-4 text-xs text-[#857d8c]">
          Gratuit · Aucun spam · Désinscription en 1 clic
        </p>
      </template>
    </div>
  </section>
</template>
