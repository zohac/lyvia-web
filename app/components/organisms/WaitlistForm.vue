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
  message: ''
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
        ...(form.message?.trim() ? { message: form.message.trim() } : {})
      }
    })

    toast.add({
      title: 'Inscription reçue',
      description: `Merci${form.firstName.trim() ? ` ${form.firstName.trim()}` : ''}\u00A0! Nous vous contacterons dès qu'une place se libère.`,
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
        title: 'Trop de tentatives',
        description: 'Réessayez plus tard.',
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
    <p class="mt-6 text-sm text-[#9685ab]">
      En attendant, découvrez comment Sophie Jouan utilise Keova
      <a
        href="https://sophie-jouan.fr"
        target="_blank"
        rel="noopener"
        class="font-medium text-[#f0b48f] underline-offset-2 hover:underline"
      >sophie-jouan.fr &rarr;</a>
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    class="flex flex-col gap-5"
    @submit.prevent="handleSubmit"
  >
    <!-- Row: Prénom + Nom -->
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Prénom"
        :error="formErrors.firstName"
        required
      >
        <UInput
          v-model="form.firstName"
          placeholder="Sophie"
          :maxlength="50"
          :disabled="isSubmitting"
        />
      </UFormField>

      <UFormField
        label="Nom"
        :error="formErrors.lastName"
        required
      >
        <UInput
          v-model="form.lastName"
          placeholder="Jouan"
          :maxlength="50"
          :disabled="isSubmitting"
        />
      </UFormField>
    </div>

    <!-- Email -->
    <UFormField
      label="Email professionnel"
      :error="formErrors.email"
      required
    >
      <UInput
        v-model="form.email"
        type="email"
        placeholder="sophie@moncoaching.fr"
        :disabled="isSubmitting"
      />
    </UFormField>

    <!-- Spécialité -->
    <UFormField
      label="Votre domaine de pratique"
      :error="formErrors.specialty"
      required
    >
      <USelect
        v-model="form.specialty"
        :items="specialtyOptions"
        value-key="value"
        placeholder="Choisir..."
        :disabled="isSubmitting"
      />
    </UFormField>

    <!-- Message -->
    <UFormField
      label="En quelques mots"
      :hint="form.message ? `${form.message.length}/500` : undefined"
    >
      <UTextarea
        v-model="form.message"
        placeholder="Parlez-nous de votre pratique"
        :rows="3"
        :maxlength="500"
        :disabled="isSubmitting"
      />
    </UFormField>

    <!-- Submit -->
    <UButton
      type="submit"
      block
      size="xl"
      :loading="isSubmitting"
      :disabled="isSubmitting"
      class="mt-1"
    >
      {{ isSubmitting ? 'Envoi en cours...' : 'Demander ma place' }}
    </UButton>

    <!-- Trust copy -->
    <p class="text-center text-xs text-[color:var(--ui-text-dimmed)]">
      Jamais de spam. Données hébergées en France. Conforme RGPD.
    </p>
  </form>
</template>

<style scoped>
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
