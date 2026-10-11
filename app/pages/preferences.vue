<template>
  <div class="w-full max-w-2xl">
    <header class="grid gap-3">
      <h1 class="font-serif text-4xl font-bold leading-tight text-[#221d28]">
        Gérer mes <span class="italic text-[#d4956a]">préférences de contact</span>
      </h1>
      <p class="text-base leading-relaxed text-[#4a4255]">
        Vous pouvez retirer à tout moment votre accord pour être recontactée, sans
        compte ni mot de passe. Pour accepter de nouveau un canal, rendez-vous plus
        tard dans les préférences de votre compte cliente.
      </p>
    </header>

    <!--
      One live region carries both the confirmation and the error, and it is
      focusable: a confirmation she cannot reach with the keyboard after a
      submit is a confirmation she never reads (AC #5). The toast accompanies
      it but is never the only carrier (AC #6).
    -->
    <div
      ref="statusRef"
      role="status"
      :aria-busy="isSubmitting"
      :aria-live="hasError ? 'assertive' : 'polite'"
      tabindex="-1"
      class="focus:outline-none"
    >
      <SystemAlert
        v-if="hasError"
        variant="error"
        :description="errorMessage"
      />
      <SystemAlert
        v-else-if="isSaved"
        variant="success"
        description="Vos préférences ont été enregistrées."
      />
      <SystemAlert
        v-else-if="!hasAnySelection"
        variant="info"
        :description="noopNotice"
      />
    </div>

    <form
      :id="formId"
      class="grid gap-6"
      method="post"
      action="/preferences-submit"
      :aria-busy="isSubmitting"
      novalidate
      @submit.prevent="onSubmit"
    >
      <input
        type="hidden"
        name="token"
        :value="token"
      >

      <fieldset
        :aria-describedby="hasError ? errorId : undefined"
        class="grid gap-4"
      >
        <legend class="font-serif text-xl font-semibold text-[#221d28]">
          Que souhaitez-vous retirer ?
        </legend>

        <!--
          Native checkboxes, not a Vue-driven component: without JavaScript
          these must still be focusable, toggleable and submittable. A
          component-driven control is dead without its script (AC #5).
        -->
        <label
          v-for="channel in CHANNELS"
          :key="channel.id"
          class="flex cursor-pointer items-start gap-3 rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] p-4 transition-colors hover:bg-[color:var(--color-surface-highlight)]/50 has-checked:border-[color:var(--color-brand-accent)]"
        >
          <input
            :id="`${formId}-${channel.id}`"
            v-model="selection"
            type="checkbox"
            name="retrait"
            :value="channel.id"
            :disabled="isSubmitting"
            :aria-invalid="hasError ? 'true' : undefined"
            :aria-describedby="hasError ? errorId : undefined"
            class="mt-1 size-5 shrink-0 accent-[color:var(--color-brand-accent)]"
          >
          <span class="grid gap-1">
            <span class="font-medium text-[color:var(--color-brand-primary)]">
              Je retire mon accord pour {{ channel.label }}
            </span>
            <span class="text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
              {{ channel.hint }}
            </span>
          </span>
        </label>
      </fieldset>

      <UButton
        type="submit"
        label="Enregistrer"
        loading-label="Enregistrement…"
        :loading="isSubmitting"
        class="shadow-floating hover:-translate-y-0.5 hover:shadow-floating"
      />

      <p
        v-if="hasError"
        :id="errorId"
        role="alert"
        class="text-sm font-medium text-[color:var(--color-error-500)]"
      >
        {{ errorMessage }}
      </p>
    </form>
  </div>
</template>

<script setup lang="ts">
import SystemAlert from '../components/atoms/SystemAlert.vue'
import { apiFetch } from '../services/api/apiFetch'
import type {
  UpdatePublicConsentRequest,
  UpdatePublicConsentResponse
} from '../features/preferences/public-consent.contract'
import {
  buildConsentWithdrawalPatch,
  CONSENT_NOOP_NOTICE,
  hasConsentWithdrawal,
  isPassiveConsentSubmission,
  parseConsentWithdrawals,
  readConsentPageState,
  readConsentToken,
  type ConsentPageState,
  type ConsentWithdrawalChannel
} from '../features/preferences/consent-page'

definePageMeta({
  layout: 'focus'
})

// The token lives in the QUERY STRING, not a fragment: the no-JS fallback posts
// the form, so the server must be able to render it back into a hidden field.
// The fragment (`#token=`, as `/reset-password` prefers) never reaches the
// server and would leave the fallback blind.
//
// The page reads nothing about it. There is no `GET` to call, and adding one
// would reintroduce the read that tells a valid token from an invalid one.

const route = useRoute()
const toast = useToast()

const CHANNELS: ReadonlyArray<{ id: ConsentWithdrawalChannel, label: string, hint: string }> = [
  {
    id: 'email',
    label: 'les emails',
    hint: 'Conseils, contenus et rappels envoyés à l’adresse que vous avez indiquée.'
  },
  {
    id: 'sms',
    label: 'les SMS',
    hint: 'Rappels et conseils envoyés au numéro indiqué. Des SMS peuvent être facturés par l’opérateur.'
  }
]

const formId = useId()
const errorId = `${formId}-error`
const statusRef = ref<HTMLElement | null>(null)

const token = computed(() => readConsentToken(route.query.token))

// The no-JS error redirect re-checks what was checked, so an error must not
// silently clear the visitor's choice (AC #4).
const selection = ref<ConsentWithdrawalChannel[]>(
  parseConsentWithdrawals(route.query.retrait)
)

const initialState = readConsentPageState(route.query.state)
const state = ref<ConsentPageState | null>(initialState)
const isSubmitting = ref(false)

const hasError = computed(() => state.value === 'error')
const isSaved = computed(() => state.value === 'saved')
const hasAnySelection = computed(() => hasConsentWithdrawal(selection.value))
const noopNotice = CONSENT_NOOP_NOTICE

/**
 * One wording for every failure, because there is only one failure to describe:
 * a transport error or a 429 from a shared bucket (LB2-5). Neither says anything
 * about the token, so a page that branched on the cause would leak what it is
 * forbidden to know.
 */
const errorMessage = computed(() =>
  hasError.value
    ? 'Vos préférences n’ont pas pu être enregistrées. Vos choix sont conservés : vous pouvez réessayer.'
    : ''
)

// The confirmation region is a focus target: announced by `role="status"`, and
// reachable right after the submit so a keyboard or screen-reader user lands on
// the outcome instead of staying on a button whose label no longer describes
// the page.
//
// `onMounted` covers the no-JS path: the page reloads with `state` already set,
// so no transition happens and the watcher never fires. Without it, the very
// population the fallback exists for gets a confirmation that is rendered but
// neither focused nor announced (a `role="status"` region only announces
// changes, not content present at first paint).
watch(isSaved, (saved) => {
  if (saved) focusStatusRegion()
})

onMounted(() => {
  if (isSaved.value || hasError.value) focusStatusRegion()
})

function focusStatusRegion() {
  statusRef.value?.focus()
}

async function onSubmit() {
  if (isSubmitting.value) return

  // Passive submission: no channel checked, or a token that cannot be acted on
  // (blank, or longer than the API accepts — a malformed link, not an unknown
  // one). Nothing is asked for, and the neutral state is what makes this page
  // safe without pre-filling: reopening the link and pressing "Enregistrer"
  // cannot withdraw anything by accident, and no token shape gets its own
  // rendering.
  if (isPassiveConsentSubmission({ token: token.value, channels: selection.value })) {
    state.value = null
    return
  }

  isSubmitting.value = true

  const body: UpdatePublicConsentRequest = buildConsentWithdrawalPatch(
    token.value,
    selection.value
  )

  try {
    await apiFetch<UpdatePublicConsentResponse>('/public/consent/preferences', {
      method: 'PATCH',
      // The visitor has no account yet: this page exists precisely for the
      // window between the booking and the activation. The authenticated
      // preferences composable targets `/client/preferences` and is not used
      // here — deliberately, and by name nowhere near a call to it.
      withAuth: false,
      body
    })

    state.value = 'saved'
    toast.add({
      title: 'Préférences enregistrées',
      color: 'success'
    })
  } catch {
    // Only two things can be observed, and neither is the token's validity: a
    // transport failure, and a 429 from a shared bucket (LB2-5).
    state.value = 'error'
    toast.add({
      title: 'Erreur',
      description: 'Vos préférences n’ont pas pu être enregistrées.',
      color: 'error'
    })
  } finally {
    isSubmitting.value = false
  }
}
</script>
