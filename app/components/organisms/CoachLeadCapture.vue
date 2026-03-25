<script setup lang="ts">
/**
 * Y2.6 AC-3/AC-4/AC-5: Lead capture with lead magnet PDF download.
 * Captures email via POST /public/lead-magnet-download, then triggers PDF download.
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
        slug: props.slug,
        consent: true,
        ...(firstName.value.trim() ? { firstName: firstName.value.trim() } : {})
      }
    })

    toast.add({
      title: 'Merci ! Votre guide est en cours de téléchargement.',
      color: 'success'
    })

    // Download PDF — Convention A30: noopener,noreferrer
    window.open(props.leadMagnetUrl, '_blank', 'noopener,noreferrer')

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
          <div>
            <label
              for="lead-capture-firstname"
              class="mb-1 block text-xs font-medium text-[#b9aac7]"
            >Prénom (optionnel)</label>
            <input
              id="lead-capture-firstname"
              v-model="firstName"
              type="text"
              placeholder="Votre prénom"
              :disabled="isSubmitting"
              class="h-12 w-full rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-white outline-none placeholder:text-white/40 transition-all duration-200 focus:border-[#d4956a]/50 focus:ring-2 focus:ring-[#d4956a]/20 disabled:opacity-50"
            >
          </div>
          <div>
            <label
              for="lead-capture-email"
              class="mb-1 block text-xs font-medium text-[#b9aac7]"
            >Adresse email</label>
            <input
              id="lead-capture-email"
              v-model="email"
              type="email"
              placeholder="votre@email.com"
              required
              :disabled="isSubmitting"
              class="h-12 w-full rounded-xl border border-white/15 bg-white/8 px-4 text-sm text-white outline-none placeholder:text-white/40 transition-all duration-200 focus:border-[#d4956a]/50 focus:ring-2 focus:ring-[#d4956a]/20 disabled:opacity-50"
            >
          </div>

          <!-- RGPD consent -->
          <label class="flex items-start gap-3 text-left">
            <input
              v-model="consent"
              type="checkbox"
              class="mt-0.5 size-4 shrink-0 cursor-pointer rounded border-white/30 bg-white/10 accent-[#d4956a]"
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

          <!-- CTA button with glow effect -->
          <button
            type="submit"
            :disabled="!canSubmit || isSubmitting"
            class="cta-glow group relative h-14 w-full cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#d4956a] to-[#e0a87d] text-base font-semibold text-white shadow-lg shadow-[#d4956a]/25 transition-all duration-300 hover:shadow-xl hover:shadow-[#d4956a]/35 hover:brightness-110 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
          >
            <!-- Shine overlay on hover -->
            <span class="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
            <span class="relative flex items-center justify-center gap-2">
              <UIcon
                v-if="isSubmitting"
                name="i-lucide-loader-2"
                class="size-5 animate-spin"
              />
              <template v-else>
                Recevoir mon guide
                <UIcon
                  name="i-lucide-arrow-right"
                  class="size-5 transition-transform duration-300 group-hover:translate-x-1"
                />
              </template>
            </span>
          </button>
        </form>

        <p class="mt-5 text-xs text-[#9685ab]">
          Gratuit · Aucun spam · Désinscription en 1 clic
        </p>
      </template>
    </div>
  </section>
</template>
