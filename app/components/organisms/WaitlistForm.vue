<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'
import {
  validateWaitlistForm,
  isWaitlistFormValid,
  WAITLIST_SPECIALTY_VALUES,
  type WaitlistSpecialty
} from '~/features/waitlist/waitlist-validation'

const props = defineProps<{
  mode: 'inline' | 'modal'
}>()

const emit = defineEmits<{
  submitted: []
}>()

const toast = useToast()

// --- Form state ---
const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  specialty: undefined as WaitlistSpecialty | undefined,
  message: '',
  legalConsent: false
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const hasAttemptedSubmit = ref(false)

// --- Specialty options (labels UI -> slugs backend) ---
const specialtyOptions = WAITLIST_SPECIALTY_VALUES.map(value => ({
  value,
  label: {
    'naturopathie': 'Naturopathie',
    'sophrologie': 'Sophrologie',
    'coaching-bien-etre': 'Coaching bien-être',
    'hypnose': 'Hypnose',
    'yoga-meditation': 'Yoga & Méditation',
    'nutrition': 'Nutrition',
    'autre': 'Autre'
  }[value]
}))

// --- Validation client ---
const formErrors = computed(() => {
  if (!hasAttemptedSubmit.value) return {}
  return validateWaitlistForm(form)
})

const canSubmit = computed(() =>
  isWaitlistFormValid(form) && !isSubmitting.value
)

// --- Dark mode (inline on dark bg) ---
const isDark = computed(() => props.mode === 'inline')

// --- Nuxt UI :ui overrides for dark variant (inline on dark bg) ---
const darkInputUi = {
  base: 'w-full rounded-xl min-h-[44px] bg-white/10 border-white/18 text-[#f5f3f7] placeholder:text-[#b9aac7]/60 backdrop-blur-sm focus:border-[#d4956a] focus:ring-[#d4956a]/20 focus:bg-white/14'
}
const lightUi = { base: 'w-full rounded-xl min-h-[44px]' }
const inputUi = computed(() => isDark.value ? darkInputUi : lightUi)

const darkSelectUi = {
  base: 'w-full rounded-xl min-h-[44px] bg-white/10 border-white/18 text-[#f5f3f7] backdrop-blur-sm focus:border-[#d4956a] focus:ring-[#d4956a]/20 focus:bg-white/14'
}
const selectUi = computed(() => isDark.value ? darkSelectUi : lightUi)

const darkTextareaUi = {
  base: 'w-full rounded-xl bg-white/10 border-white/18 text-[#f5f3f7] placeholder:text-[#b9aac7]/60 backdrop-blur-sm resize-none focus:border-[#d4956a] focus:ring-[#d4956a]/20 focus:bg-white/14'
}
const textareaUi = computed(() => isDark.value ? darkTextareaUi : lightUi)

const darkFormFieldUi = {
  root: 'w-full',
  label: 'text-[#f0edf3] font-semibold',
  error: 'text-[#fca5a5]',
  hint: 'text-[#b9aac7]'
}
const lightFormFieldUi = { root: 'w-full' }
const formFieldUi = computed(() => isDark.value ? darkFormFieldUi : lightFormFieldUi)

// --- Soumission ---
async function handleSubmit() {
  hasAttemptedSubmit.value = true
  if (!canSubmit.value) return
  isSubmitting.value = true

  try {
    await apiFetch('/public/waitlist', {
      method: 'POST',
      withAuth: false,
      body: {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        specialty: form.specialty,
        legalConsent: true,
        ...(form.message?.trim() ? { message: form.message.trim() } : {})
      }
    })

    toast.add({
      title: `Merci ! Nous vous contacterons dès qu'une place se libère.`,
      color: 'success'
    })

    if (props.mode === 'modal') {
      emit('submitted')
    } else {
      isSubmitted.value = true
    }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError && err.apiError.statusCode === 429) {
      toast.add({
        title: 'Trop de tentatives. Réessayez plus tard.',
        color: 'error'
      })
    } else {
      toast.add({
        title: 'Erreur',
        description: 'Une erreur est survenue. Réessayez dans un instant.',
        color: 'error'
      })
    }
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <!-- Confirmation state (inline mode only) -->
  <div
    v-if="isSubmitted && mode === 'inline'"
    class="animate-fade-in-up text-center"
  >
    <div class="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#4ade80]/20 to-[#4a8b6e]/20 ring-2 ring-[#4ade80]/30">
      <UIcon
        name="i-lucide-check-circle"
        class="size-10 text-[#4ade80]"
      />
    </div>
    <h3 class="font-serif text-3xl text-white">
      Vous êtes sur la liste
    </h3>
    <p class="mx-auto mt-3 max-w-md text-base leading-relaxed text-[#d7cfdf]">
      Nous vous contacterons en priorité dès qu'une place se libère.
      Vérifiez vos spams si besoin.
    </p>
    <p class="mt-6 text-sm text-[#b9aac7]">
      En attendant, découvrez comment Sophie Jouan utilise Keova
      <a
        href="https://sophiejouan.fr"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-[#f0b48f] underline-offset-2 hover:underline"
      >sophiejouan.fr &rarr;</a>
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    class="flex w-full flex-col gap-5"
    @submit.prevent="handleSubmit"
  >
    <!-- Row: Prénom + Nom -->
    <div class="grid w-full gap-4 sm:grid-cols-2">
      <UFormField
        label="Prénom"
        :error="formErrors.firstName"
        :ui="formFieldUi"
        required
      >
        <UInput
          v-model="form.firstName"
          placeholder="Marie"
          :maxlength="50"
          :disabled="isSubmitting"
          :ui="inputUi"
          class="w-full"
        />
      </UFormField>

      <UFormField
        label="Nom"
        :error="formErrors.lastName"
        :ui="formFieldUi"
        required
      >
        <UInput
          v-model="form.lastName"
          placeholder="Dupont"
          :maxlength="50"
          :disabled="isSubmitting"
          :ui="inputUi"
          class="w-full"
        />
      </UFormField>
    </div>

    <!-- Email -->
    <UFormField
      label="Email professionnel"
      :error="formErrors.email"
      :ui="formFieldUi"
      required
    >
      <UInput
        v-model="form.email"
        type="email"
        placeholder="marie@monactivite.fr"
        :disabled="isSubmitting"
        :ui="inputUi"
        class="w-full"
      />
    </UFormField>

    <!-- Spécialité -->
    <UFormField
      label="Votre domaine de pratique"
      :error="formErrors.specialty"
      :ui="formFieldUi"
      required
    >
      <USelect
        v-model="form.specialty"
        :items="specialtyOptions"
        value-key="value"
        placeholder="Choisir..."
        :disabled="isSubmitting"
        :ui="selectUi"
        class="w-full"
      />
    </UFormField>

    <!-- Message -->
    <UFormField
      label="En quelques mots"
      :hint="form.message ? `${form.message.length}/500` : undefined"
      :ui="formFieldUi"
    >
      <UTextarea
        v-model="form.message"
        placeholder="Parlez-nous de votre pratique"
        :rows="3"
        :maxlength="500"
        :disabled="isSubmitting"
        :ui="textareaUi"
        class="w-full"
      />
    </UFormField>

    <!-- Consentement RGPD -->
    <div class="flex items-start gap-3">
      <UCheckbox
        v-model="form.legalConsent"
        :disabled="isSubmitting"
        :ui="isDark ? { base: 'mt-0.5 border-white/30' } : { base: 'mt-0.5' }"
      />
      <label
        :class="['text-sm leading-relaxed', isDark ? 'text-[#c8bfd4]' : 'text-[#6b6278]']"
      >
        J'accepte que mes données soient utilisées pour me recontacter dans le cadre de la beta Keova.
        <a
          href="/legal/confidentialite"
          target="_blank"
          rel="noopener noreferrer"
          :class="['font-medium underline-offset-2 hover:underline', isDark ? 'text-[#f0b48f]' : 'text-[#5b4b6e]']"
        >Politique de confidentialité</a>
      </label>
    </div>

    <!-- Submit — branded CTA -->
    <button
      type="submit"
      :disabled="!canSubmit || isSubmitting"
      class="cta-submit group relative mt-1 w-full overflow-hidden rounded-full py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:pointer-events-none disabled:opacity-60"
    >
      <span class="cta-submit-bg absolute inset-0" />
      <span class="relative z-10 flex items-center justify-center gap-2">
        <UIcon
          v-if="isSubmitting"
          name="i-lucide-loader-2"
          class="size-5 animate-spin"
        />
        {{ isSubmitting ? 'Envoi en cours...' : 'Demander ma place' }}
        <UIcon
          v-if="!isSubmitting"
          name="i-lucide-arrow-right"
          class="size-5 transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </button>

    <!-- Trust copy -->
    <p :class="['text-center text-xs', isDark ? 'text-[#b9aac7]' : 'text-[#6b6278]']">
      Jamais de spam. Données hébergées en France. Conforme RGPD.
    </p>
  </form>
</template>

<style scoped>
/* CTA submit — sunset gradient with hover animation */
.cta-submit-bg {
  background: linear-gradient(135deg, #d4956a 0%, #e89560 50%, #d4956a 100%);
  background-size: 200% 100%;
  transition: background-position 0.5s;
}

.cta-submit:hover .cta-submit-bg {
  background-position: 100% center;
}

/* Confirmation animation */
.animate-fade-in-up {
  animation: fadeInUp 0.6s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
