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

// --- Specialty options (labels UI -> slugs backend) ---
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

const isDark = computed(() => props.mode === 'inline')
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
    :class="[
      'waitlist-form flex flex-col gap-5',
      isDark ? 'waitlist-form--dark' : 'waitlist-form--light'
    ]"
    @submit.prevent="handleSubmit"
  >
    <!-- Row: Prénom + Nom -->
    <div class="grid gap-4 sm:grid-cols-2">
      <div class="form-group">
        <label class="form-label">
          Prénom <span class="text-[#e89560]">*</span>
        </label>
        <input
          v-model="form.firstName"
          type="text"
          placeholder="Sophie"
          :class="['form-input', formErrors.firstName ? 'form-input--error' : '']"
        >
        <p
          v-if="formErrors.firstName"
          class="form-error"
        >
          {{ formErrors.firstName }}
        </p>
      </div>

      <div class="form-group">
        <label class="form-label">
          Nom <span class="text-[#e89560]">*</span>
        </label>
        <input
          v-model="form.lastName"
          type="text"
          placeholder="Jouan"
          :class="['form-input', formErrors.lastName ? 'form-input--error' : '']"
        >
        <p
          v-if="formErrors.lastName"
          class="form-error"
        >
          {{ formErrors.lastName }}
        </p>
      </div>
    </div>

    <!-- Email -->
    <div class="form-group">
      <label class="form-label">
        Email professionnel <span class="text-[#e89560]">*</span>
      </label>
      <input
        v-model="form.email"
        type="email"
        placeholder="sophie@moncoaching.fr"
        :class="['form-input', formErrors.email ? 'form-input--error' : '']"
      >
      <p
        v-if="formErrors.email"
        class="form-error"
      >
        {{ formErrors.email }}
      </p>
    </div>

    <!-- Spécialité -->
    <div class="form-group">
      <label class="form-label">
        Votre domaine de pratique <span class="text-[#e89560]">*</span>
      </label>
      <select
        v-model="form.specialty"
        :class="['form-input form-select', formErrors.specialty ? 'form-input--error' : '', !form.specialty ? 'text-[#857d8c]' : '']"
      >
        <option
          value=""
          disabled
        >
          Choisir...
        </option>
        <option
          v-for="opt in specialtyOptions"
          :key="opt.value"
          :value="opt.value"
        >
          {{ opt.label }}
        </option>
      </select>
      <p
        v-if="formErrors.specialty"
        class="form-error"
      >
        {{ formErrors.specialty }}
      </p>
    </div>

    <!-- Message -->
    <div class="form-group">
      <div class="flex items-baseline justify-between">
        <label class="form-label">En quelques mots</label>
        <span :class="['text-xs', isDark ? 'text-[#857d8c]' : 'text-[#b9aac7]']">(facultatif)</span>
      </div>
      <textarea
        v-model="form.message"
        placeholder="Ex : je jongle entre 4 outils et je cherche à simplifier..."
        rows="3"
        maxlength="500"
        class="form-input resize-none"
      />
      <div class="flex justify-end">
        <span :class="['text-xs', isDark ? 'text-[#9685ab]' : 'text-[#b9aac7]']">{{ form.message?.length || 0 }}/500</span>
      </div>
    </div>

    <!-- Submit -->
    <button
      type="submit"
      :disabled="isSubmitting"
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
    <p :class="['text-center text-xs', isDark ? 'text-[#9685ab]' : 'text-[#857d8c]']">
      Jamais de spam. Données hébergées en France. Conforme RGPD.
    </p>
  </form>
</template>

<style scoped>
/* =================================================================================================
 * WAITLIST FORM — SHARED
 * ================================================================================================= */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 600;
  line-height: 1.25rem;
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  font-size: 0.9375rem;
  line-height: 1.5;
  outline: none;
  transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

.form-input:focus {
  ring: none;
}

.form-select {
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23857d8c' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 0.75rem center;
  padding-right: 2.5rem;
}

.form-error {
  font-size: 0.75rem;
  color: #f87171;
  margin-top: 0.125rem;
}

/* CTA submit button */
.cta-submit-bg {
  background: linear-gradient(135deg, #d4956a 0%, #e89560 50%, #d4956a 100%);
  background-size: 200% 100%;
  transition: background-position 0.5s;
}

.cta-submit:hover .cta-submit-bg {
  background-position: 100% center;
}

/* =================================================================================================
 * DARK VARIANT (inline on dark background)
 * ================================================================================================= */

.waitlist-form--dark .form-label {
  color: #f0edf3;
}

.waitlist-form--dark .form-input {
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.18);
  color: #f5f3f7;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.waitlist-form--dark .form-input::placeholder {
  color: rgba(185, 170, 199, 0.6);
}

.waitlist-form--dark .form-input:focus {
  border-color: #d4956a;
  box-shadow: 0 0 0 3px rgba(212, 149, 106, 0.2);
  background: rgba(255, 255, 255, 0.14);
}

.waitlist-form--dark .form-input--error {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.15);
}

.waitlist-form--dark .form-select option {
  background: #352c44;
  color: #f5f3f7;
}

/* =================================================================================================
 * LIGHT VARIANT (modal)
 * ================================================================================================= */

.waitlist-form--light .form-label {
  color: #3d3250;
}

.waitlist-form--light .form-input {
  background: #f8f6fa;
  border: 1.5px solid #ebe7ef;
  color: #221d28;
}

.waitlist-form--light .form-input::placeholder {
  color: #b9aac7;
}

.waitlist-form--light .form-input:focus {
  border-color: #5b4b6e;
  box-shadow: 0 0 0 3px rgba(91, 75, 110, 0.12);
  background: #ffffff;
}

.waitlist-form--light .form-input--error {
  border-color: #f87171;
  box-shadow: 0 0 0 3px rgba(248, 113, 113, 0.1);
}

.waitlist-form--light .form-select option {
  background: #ffffff;
  color: #221d28;
}

/* =================================================================================================
 * ANIMATIONS
 * ================================================================================================= */

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
