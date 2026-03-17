<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'
import { EMAIL_REGEX } from '~/utils/validation-regex'

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
  specialty: '',
  message: ''
})

const isSubmitting = ref(false)
const isSubmitted = ref(false)
const hasAttemptedSubmit = ref(false)

// --- Specialty options (labels UI → slugs backend) ---
const specialtyOptions = [
  { value: 'naturopathie', label: 'Naturopathie' },
  { value: 'sophrologie', label: 'Sophrologie' },
  { value: 'coaching-bien-etre', label: 'Coaching bien-être' },
  { value: 'hypnose', label: 'Hypnose' },
  { value: 'yoga-meditation', label: 'Yoga & Méditation' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'autre', label: 'Autre' }
]

// --- Validation client ---
const formErrors = computed(() => {
  if (!hasAttemptedSubmit.value) return {}
  const errors: Record<string, string> = {}
  if (form.firstName.trim().length < 2) errors.firstName = 'Minimum 2 caractères'
  if (form.lastName.trim().length < 2) errors.lastName = 'Minimum 2 caractères'
  if (!form.email.trim() || !EMAIL_REGEX.test(form.email.trim())) errors.email = 'Format invalide — ex\u00A0: sophie@moncoaching.fr'
  if (!form.specialty) errors.specialty = 'Indiquez votre domaine'
  if (form.message && form.message.length > 500) errors.message = 'Maximum 500 caractères'
  return errors
})

const canSubmit = computed(() =>
  form.firstName.trim().length >= 2
  && form.lastName.trim().length >= 2
  && EMAIL_REGEX.test(form.email.trim())
  && !!form.specialty
  && !isSubmitting.value
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
    <div class="mx-auto mb-4 grid size-16 place-items-center rounded-full bg-gradient-to-br from-[#4ade80]/20 to-[#4a8b6e]/20">
      <UIcon
        name="i-lucide-check-circle"
        class="size-8 text-[#4ade80]"
      />
    </div>
    <h3 class="font-serif text-2xl text-white">
      Vous êtes sur la liste
    </h3>
    <p class="mx-auto mt-2 max-w-md text-[#b9aac7]">
      Nous vous contacterons en priorité dès qu'une place se libère. Vérifiez vos spams si besoin.
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    class="flex flex-col gap-4"
    @submit.prevent="handleSubmit"
  >
    <div class="grid gap-4 sm:grid-cols-2">
      <UFormField
        label="Prénom"
        :error="formErrors.firstName"
        required
      >
        <UInput
          v-model="form.firstName"
          placeholder="Sophie"
          :color="formErrors.firstName ? 'error' : undefined"
          class="w-full"
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
          :color="formErrors.lastName ? 'error' : undefined"
          class="w-full"
        />
      </UFormField>
    </div>

    <UFormField
      label="Email professionnel"
      :error="formErrors.email"
      required
    >
      <UInput
        v-model="form.email"
        type="email"
        placeholder="sophie@moncoaching.fr"
        :color="formErrors.email ? 'error' : undefined"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="Votre domaine de pratique"
      :error="formErrors.specialty"
      required
    >
      <USelect
        v-model="form.specialty"
        :items="specialtyOptions"
        placeholder="Choisir..."
        value-key="value"
        class="w-full"
      />
    </UFormField>

    <UFormField
      label="En quelques mots"
      hint="(facultatif)"
    >
      <UTextarea
        v-model="form.message"
        placeholder="Ex : je jongle entre 4 outils et je cherche à simplifier..."
        :rows="3"
        :maxlength="500"
        class="w-full"
      />
      <template #help>
        <span class="text-xs text-[#857d8c]">{{ form.message?.length || 0 }}/500</span>
      </template>
    </UFormField>

    <UButton
      type="submit"
      size="lg"
      :loading="isSubmitting"
      :disabled="isSubmitting"
      class="mt-2 w-full rounded-full bg-gradient-to-r from-[#d4956a] to-[#e89560] font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
    >
      {{ isSubmitting ? 'Envoi en cours...' : 'Demander ma place' }}
      <UIcon
        v-if="!isSubmitting"
        name="i-lucide-arrow-right"
        class="ml-1 size-4"
      />
    </UButton>

    <p class="text-center text-xs text-[#857d8c]">
      Jamais de spam. Données hébergées en France. Conforme RGPD.
    </p>
  </form>
</template>

<style scoped>
.animate-fade-in-up {
  animation: fadeInUp 0.5s ease-out;
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
