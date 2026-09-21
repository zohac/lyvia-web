<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { ApiFetchError } from '~/services/api/api-error'
import {
  validateWaitlistForm,
  isWaitlistFormValid,
  WAITLIST_SPECIALTY_VALUES,
  WAITLIST_ACTIVITY_STAGE_VALUES,
  WAITLIST_MAIN_BLOCKER_VALUES,
  WAITLIST_DISCOVERY_SOURCE_VALUES
} from '~/features/waitlist/waitlist-validation'
import {
  ACTIVITY_STAGE_LABELS,
  DISCOVERY_SOURCE_LABELS,
  MAIN_BLOCKER_LABELS,
  SPECIALTY_LABELS,
  toWaitlistOptions
} from '~/features/waitlist/waitlist-labels'
import { useLandingAnalytics } from '~/composables/useLandingAnalytics'

const props = defineProps<{
  mode: 'inline' | 'modal'
}>()

const emit = defineEmits<{
  submitted: []
}>()

const toast = useToast()

// --- Restitution après un échec sans JavaScript ---
// `POST /waitlist-submit` a mis la saisie de côté derrière un jeton à usage
// unique ; le middleware l'a consommée et posée sur `event.context`. Les valeurs
// ne transitent ni par l'URL ni par un cookie (décision 24).
const replay = (useRequestEvent()?.context?.waitlistReplay ?? null) as
  Record<string, string> | null

// --- Form state ---
const form = reactive({
  firstName: replay?.firstName ?? '',
  lastName: replay?.lastName ?? '',
  email: replay?.email ?? '',
  specialty: (replay?.specialty ?? undefined) as string | undefined,
  activityStage: (replay?.activityStage ?? undefined) as string | undefined,
  mainBlocker: (replay?.mainBlocker ?? undefined) as string | undefined,
  discoverySource: (replay?.discoverySource ?? undefined) as string | undefined,
  message: replay?.message ?? ''
})

const route = useRoute()
const isSubmitting = ref(false)
// État de confirmation rendu côté serveur pour le fallback sans JavaScript
// (`/waitlist-submit` redirige vers `/?access=received#waitlist`).
const isSubmitted = ref(route.query.access === 'received')
// État d'erreur du même fallback (`/?access=error#waitlist`). Sans lui, une
// demande échouée sans JavaScript revient sur un formulaire muet.
const hasServerError = ref(route.query.access === 'error')
const confirmationRef = ref<HTMLElement | null>(null)
const hasAttemptedSubmit = ref(false)

// L'état de confirmation est un état de focus à part entière (AC LB.2) : on
// l'annonce aux lecteurs d'écran via `role="status"` ET on y déplace le focus.
onMounted(() => {
  if (isSubmitted.value) confirmationRef.value?.focus()
})

// --- Analytics (post-consentement, sans PII) ---
const { track: trackLanding } = useLandingAnalytics()
const hasTrackedFormStart = ref(false)
watch(form, () => {
  if (hasTrackedFormStart.value) return
  hasTrackedFormStart.value = true
  trackLanding('access_form_start')
}, { deep: true })

// --- Select options (labels UI -> slugs backend) ---
const specialtyOptions = toWaitlistOptions(WAITLIST_SPECIALTY_VALUES, SPECIALTY_LABELS)
const activityStageOptions = toWaitlistOptions(WAITLIST_ACTIVITY_STAGE_VALUES, ACTIVITY_STAGE_LABELS)
const mainBlockerOptions = toWaitlistOptions(WAITLIST_MAIN_BLOCKER_VALUES, MAIN_BLOCKER_LABELS)
const discoverySourceOptions = toWaitlistOptions(WAITLIST_DISCOVERY_SOURCE_VALUES, DISCOVERY_SOURCE_LABELS)

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
  base: 'w-full rounded-xl min-h-[44px] bg-white/10 border-white/18 text-[var(--color-crepuscule-50)] placeholder:text-[var(--color-crepuscule-300)]/60 backdrop-blur-sm focus:border-[var(--color-brand-accent)] focus:ring-[var(--color-brand-accent)]/20 focus:bg-white/14'
}
const lightUi = { base: 'w-full rounded-xl min-h-[44px]' }
const inputUi = computed(() => isDark.value ? darkInputUi : lightUi)

const darkTextareaUi = {
  base: 'w-full rounded-xl bg-white/10 border-white/18 text-[var(--color-crepuscule-50)] placeholder:text-[var(--color-crepuscule-300)]/60 backdrop-blur-sm resize-none focus:border-[var(--color-brand-accent)] focus:ring-[var(--color-brand-accent)]/20 focus:bg-white/14'
}
const textareaUi = computed(() => isDark.value ? darkTextareaUi : lightUi)

const darkFormFieldUi = {
  root: 'w-full',
  label: 'text-[var(--color-crepuscule-100)] font-semibold',
  error: 'text-[var(--color-error-300)]',
  hint: 'text-[var(--color-crepuscule-300)]'
}
const lightFormFieldUi = { root: 'w-full' }
const formFieldUi = computed(() => isDark.value ? darkFormFieldUi : lightFormFieldUi)

const noticeClass = computed(() => isDark.value
  ? 'text-[var(--color-crepuscule-300)]'
  : 'text-[var(--color-crepuscule-500)]')
const noticeLinkClass = computed(() => isDark.value
  ? 'text-[var(--color-sunset-300)]'
  : 'text-[var(--color-brand-primary)]')

// Dégradation sans JavaScript : un `USelect` est une combobox pilotée par Vue
// — sans JS, son `<select>` interne est vide et clippé, donc ni remplissable ni
// soumettable. Les quatre listes sont donc de vrais `<select>` natifs, qui
// fonctionnent à l'identique avec et sans JS (et sont plus accessibles).
//
// Un `<noscript>` serait le réflexe, mais Vue refuse les balises à effet de
// bord (`<style>`, `<script>`) dans un template de composant client, et le
// contenu d'un `<noscript>` n'est exposé au DOM que comme du texte à
// l'hydratation. `YoutubeFacade.vue` a déjà tranché ce point : on rend un
// élément qui dégrade tout seul.
const selectFieldClass = computed(() => isDark.value
  ? 'w-full rounded-xl min-h-[44px] bg-white/10 border border-white/18 px-4 text-left text-[var(--color-crepuscule-50)] backdrop-blur-sm focus:border-[var(--color-brand-accent)] focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:outline-none disabled:opacity-60'
  : 'w-full rounded-xl min-h-[44px] bg-white border border-[var(--color-crepuscule-300)]/60 px-4 text-left text-[var(--color-crepuscule-700)] focus:border-[var(--color-brand-accent)] focus:ring-2 focus:ring-[var(--color-brand-accent)]/20 focus:outline-none disabled:opacity-60')
const fieldLabelClass = computed(() => isDark.value
  ? 'text-sm font-semibold text-[var(--color-crepuscule-100)]'
  : 'text-sm font-semibold text-[var(--color-crepuscule-700)]')
const fieldErrorClass = computed(() => isDark.value
  ? 'text-xs text-[var(--color-error-300)]'
  : 'text-xs text-[var(--color-error-500)]')

// Deux instances de ce formulaire coexistent (inline + modale) : les `id`
// doivent être uniques pour que les `<label for>` visent le bon contrôle.
const uid = useId()

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
        email: form.email.trim(),
        specialty: form.specialty,
        activityStage: form.activityStage,
        mainBlocker: form.mainBlocker,
        ...(form.lastName?.trim() ? { lastName: form.lastName.trim() } : {}),
        ...(form.discoverySource ? { discoverySource: form.discoverySource } : {}),
        ...(form.message?.trim() ? { message: form.message.trim() } : {})
      }
    })

    trackLanding('access_request_success')

    toast.add({
      title: 'Merci, votre demande d’accès a bien été reçue.',
      description: 'Je la regarde personnellement et je vous recontacte par email sous deux jours ouvrés.',
      color: 'success'
    })

    // L'état de confirmation remplace le formulaire dans les deux modes
    // (AC LB.2 « le formulaire est remplacé par un état focusable »). Le
    // parent ne ferme plus la modale sur `submitted` : sinon la confirmation
    // serait démontée avant d'être vue.
    isSubmitted.value = true
    emit('submitted')
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
  <!-- Confirmation state -->
  <div
    v-if="isSubmitted"
    ref="confirmationRef"
    tabindex="-1"
    class="animate-fade-in-up text-center focus:outline-none"
    role="status"
    aria-live="polite"
  >
    <div class="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-gradient-to-br from-[var(--color-success-400)]/20 to-[var(--color-success)]/20 ring-2 ring-[var(--color-success-400)]/30">
      <UIcon
        name="i-lucide-check-circle"
        class="size-10 text-[var(--color-success-400)]"
      />
    </div>
    <h3 :class="['font-serif text-3xl', isDark ? 'text-white' : 'text-[var(--color-crepuscule-700)]']">
      Merci, votre demande d’accès a bien été reçue.
    </h3>
    <p :class="['mx-auto mt-3 max-w-md text-base leading-relaxed', isDark ? 'text-[var(--color-crepuscule-200)]' : 'text-[var(--color-crepuscule-500)]']">
      Je la regarde personnellement et je vous recontacte par email sous deux jours ouvrés
      pour voir si Keova correspond à votre activité.
    </p>
    <p :class="['mt-6 text-sm', isDark ? 'text-[var(--color-crepuscule-300)]' : 'text-[var(--color-crepuscule-500)]']">
      En attendant, découvrez comment Sophie Jouan utilise Keova
      <a
        href="https://sophiejouan.fr"
        target="_blank"
        rel="noopener noreferrer"
        class="font-medium text-[var(--color-sunset-300)] underline-offset-2 hover:underline"
      >sophiejouan.fr &rarr;</a>
    </p>
  </div>

  <!-- Form -->
  <form
    v-else
    method="post"
    action="/waitlist-submit"
    class="flex w-full flex-col gap-5"
    @submit.prevent="handleSubmit"
  >
    <!-- Échec du fallback sans JavaScript (`/?access=error#waitlist`) -->
    <p
      v-if="hasServerError"
      role="alert"
      class="rounded-xl border border-[var(--color-error-300)]/40 bg-[var(--color-error-300)]/10 px-4 py-3 text-sm leading-relaxed text-[var(--color-error-300)]"
    >
      Votre demande n’a pas pu être envoyée. Merci de vérifier les champs obligatoires
      puis de réessayer.
    </p>

    <!-- Prénom -->
    <UFormField
      label="Prénom"
      :error="formErrors.firstName"
      :ui="formFieldUi"
      required
    >
      <UInput
        v-model="form.firstName"
        name="firstName"
        placeholder="Sophie"
        autocomplete="given-name"
        :maxlength="50"
        :disabled="isSubmitting"
        :ui="inputUi"
        class="w-full"
      />
    </UFormField>

    <!-- Email -->
    <UFormField
      label="Email professionnel"
      :error="formErrors.email"
      :ui="formFieldUi"
      required
    >
      <UInput
        v-model="form.email"
        name="email"
        type="email"
        placeholder="sophie@monactivite.fr"
        autocomplete="email"
        :disabled="isSubmitting"
        :ui="inputUi"
        class="w-full"
      />
    </UFormField>

    <!-- Domaine de pratique -->
    <div class="flex w-full flex-col gap-1.5 text-left">
      <label
        :for="`${uid}-specialty`"
        :class="fieldLabelClass"
      >
        Votre domaine de pratique
        <span
          aria-hidden="true"
          class="text-[var(--color-brand-accent)]"
        >*</span>
      </label>
      <select
        :id="`${uid}-specialty`"
        v-model="form.specialty"
        name="specialty"
        :class="selectFieldClass"
        :disabled="isSubmitting"
        required
      >
        <option value="">
          Choisir…
        </option>
        <option
          v-for="option in specialtyOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p
        v-if="formErrors.specialty"
        :class="fieldErrorClass"
      >
        {{ formErrors.specialty }}
      </p>
    </div>

    <!-- Stade de l'activité -->
    <div class="flex w-full flex-col gap-1.5 text-left">
      <label
        :for="`${uid}-activity-stage`"
        :class="fieldLabelClass"
      >
        Où en êtes-vous dans votre activité ?
        <span
          aria-hidden="true"
          class="text-[var(--color-brand-accent)]"
        >*</span>
      </label>
      <select
        :id="`${uid}-activity-stage`"
        v-model="form.activityStage"
        name="activityStage"
        :class="selectFieldClass"
        :disabled="isSubmitting"
        required
      >
        <option value="">
          Choisir…
        </option>
        <option
          v-for="option in activityStageOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p
        v-if="formErrors.activityStage"
        :class="fieldErrorClass"
      >
        {{ formErrors.activityStage }}
      </p>
    </div>

    <!-- Frein principal -->
    <div class="flex w-full flex-col gap-1.5 text-left">
      <label
        :for="`${uid}-main-blocker`"
        :class="fieldLabelClass"
      >
        Qu'est-ce qui vous freine le plus aujourd'hui ?
        <span
          aria-hidden="true"
          class="text-[var(--color-brand-accent)]"
        >*</span>
      </label>
      <select
        :id="`${uid}-main-blocker`"
        v-model="form.mainBlocker"
        name="mainBlocker"
        :class="selectFieldClass"
        :disabled="isSubmitting"
        required
      >
        <option value="">
          Choisir…
        </option>
        <option
          v-for="option in mainBlockerOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p
        v-if="formErrors.mainBlocker"
        :class="fieldErrorClass"
      >
        {{ formErrors.mainBlocker }}
      </p>
    </div>

    <!-- Source de découverte (facultatif) -->
    <div class="flex w-full flex-col gap-1.5 text-left">
      <label
        :for="`${uid}-discovery-source`"
        :class="fieldLabelClass"
      >
        Comment avez-vous connu Keova ? (facultatif)
      </label>
      <select
        :id="`${uid}-discovery-source`"
        v-model="form.discoverySource"
        name="discoverySource"
        :class="selectFieldClass"
        :disabled="isSubmitting"
      >
        <option value="">
          Choisir…
        </option>
        <option
          v-for="option in discoverySourceOptions"
          :key="option.value"
          :value="option.value"
        >
          {{ option.label }}
        </option>
      </select>
      <p
        v-if="formErrors.discoverySource"
        :class="fieldErrorClass"
      >
        {{ formErrors.discoverySource }}
      </p>
    </div>

    <!-- Nom (facultatif) -->
    <UFormField
      label="Nom (facultatif)"
      :error="formErrors.lastName"
      :ui="formFieldUi"
    >
      <UInput
        v-model="form.lastName"
        name="lastName"
        placeholder="Jouan"
        autocomplete="family-name"
        :maxlength="50"
        :disabled="isSubmitting"
        :ui="inputUi"
        class="w-full"
      />
    </UFormField>

    <!-- Message (facultatif) -->
    <UFormField
      label="En une phrase, qu'aimeriez-vous simplifier ? (facultatif)"
      :hint="form.message ? `${form.message.length}/500` : undefined"
      :ui="formFieldUi"
    >
      <UTextarea
        v-model="form.message"
        name="message"
        placeholder="Ex : je jongle entre plusieurs outils et je cherche à simplifier…"
        :rows="3"
        :maxlength="500"
        :disabled="isSubmitting"
        :ui="textareaUi"
        class="w-full"
      />
      <p :class="['mt-1 text-xs', noticeClass]">
        Merci de ne pas indiquer d'informations de santé ni de données concernant vos clientes.
      </p>
    </UFormField>

    <!-- Notice de confidentialité (information, pas de consentement obligatoire) -->
    <p :class="['text-xs leading-relaxed', noticeClass]">
      Les informations renseignées sont utilisées par Keova pour étudier votre demande
      d’accès et vous recontacter à ce sujet. Les champs marqués d’un * sont obligatoires.
      En savoir plus sur la gestion de vos données et vos droits dans notre
      <a
        href="/legal/confidentialite"
        target="_blank"
        rel="noopener noreferrer"
        :class="['font-medium underline-offset-2 hover:underline', noticeLinkClass]"
      >politique de confidentialité</a>.
    </p>

    <!-- Submit — branded CTA -->
    <!--
      Pas de `:disabled="!canSubmit"` : le bouton serait rendu `disabled` dans le
      HTML SSR (la validation client n'a pas encore tourné) et rendrait le
      formulaire non soumettable sans JavaScript. La garde client reste portée
      par `handleSubmit`, qui sort tôt si le formulaire est invalide.
    -->
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
        {{ isSubmitting ? 'Envoi en cours…' : 'Demander un accès' }}
        <UIcon
          v-if="!isSubmitting"
          name="i-lucide-arrow-right"
          class="size-5 transition-transform duration-300 group-hover:translate-x-1"
        />
      </span>
    </button>

    <!-- Trust copy -->
    <p :class="['text-center text-xs', noticeClass]">
      Aucune carte bancaire. Aucun engagement. Juste un email.
    </p>
  </form>
</template>

<style scoped>
/* CTA submit — sunset gradient with hover animation */
.cta-submit-bg {
  background: linear-gradient(135deg, var(--color-brand-accent) 0%, var(--color-sunset-400) 50%, var(--color-brand-accent) 100%);
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
