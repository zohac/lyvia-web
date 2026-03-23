<script setup lang="ts">
/**
 * Y2.6 AC-3/AC-4/AC-5: Lead capture with lead magnet PDF download.
 * Captures email via POST /public/newsletter, then triggers PDF download.
 * Anti-enumeration: same behavior whether email is new or already exists.
 * Deep purple background for visual rupture (audit UX scrolltelling).
 * RGPD: explicit consent checkbox required before submission.
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
const consent = ref(false)
const isSubmitting = ref(false)
const isSubmitted = ref(false)

const isValidEmail = computed(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim()))
const canSubmit = computed(() => isValidEmail.value && consent.value && !isSubmitting.value)

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
    class="relative overflow-hidden bg-gradient-to-br from-[#2d2438] to-[#3d3250] px-6 py-20 sm:px-12 lg:px-20"
  >
    <!-- Subtle decorative glow -->
    <div
      class="pointer-events-none absolute -right-[15%] top-1/2 h-[50vh] w-[50vh] -translate-y-1/2 rounded-full"
      style="background: radial-gradient(circle, rgba(212,149,106,0.12), transparent 60%); filter: blur(80px);"
      aria-hidden="true"
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
            class="size-8 text-emerald-400"
          />
        </div>
        <p class="text-xl font-semibold text-white">
          Votre guide est en cours de téléchargement
        </p>
        <p class="text-sm text-[#b9aac7]">
          Si le téléchargement ne démarre pas,
          <a
            :href="leadMagnetUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="underline hover:text-[#f0b48f]"
          >cliquez ici</a>.
        </p>
      </div>

      <!-- Form state -->
      <template v-else>
        <UIcon
          name="i-lucide-book-open"
          class="mx-auto mb-4 size-10 text-[#d4956a]"
        />
        <h2 class="font-serif text-3xl leading-tight text-white lg:text-4xl">
          {{ leadMagnetTitle }}
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-lg text-[#d7cfdf]">
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

          <!-- RGPD consent -->
          <label class="flex items-start gap-3 text-left">
            <input
              v-model="consent"
              type="checkbox"
              class="mt-1 size-4 shrink-0 rounded border-white/30 bg-white/10 text-[#d4956a] focus:ring-[#d4956a]/50"
              :disabled="isSubmitting"
            >
            <span class="text-xs leading-relaxed text-[#b9aac7]">
              J'accepte de recevoir le guide et des conseils par email. Désabonnement possible à tout moment.
              <NuxtLink
                to="/legal/confidentialite"
                class="underline hover:text-[#f0b48f]"
              >Politique de confidentialité</NuxtLink>
            </span>
          </label>

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

        <p class="mt-4 text-xs text-[#9685ab]">
          Gratuit · Aucun spam · Désinscription en 1 clic
        </p>
      </template>
    </div>
  </section>
</template>
