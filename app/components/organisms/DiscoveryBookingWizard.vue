<script setup lang="ts">
import type {
  AvailabilitySlot,
  BookDiscoveryResponse,
  BookDiscoveryForTenantRequest,
  PublicTenantResponse,
  ProviderAvailabilityResponse
} from '../../features/onboarding/api/onboarding.contract'
import { mapOnboardingErrorCodeToUserMessage } from '../../features/onboarding/api/onboarding-error'
import { normalizePhone } from '../../features/onboarding/phone/phone'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import BookingSummary from '../molecules/BookingSummary.vue'
import CalendarMonthView from '../molecules/CalendarMonthView.vue'
import IdentityForm from '../molecules/IdentityForm.vue'
import TimeSlotGrid from '../molecules/TimeSlotGrid.vue'
import WizardStepper from '../molecules/WizardStepper.vue'
import PrimaryButton from '../atoms/PrimaryButton.vue'
import SystemAlert from '../atoms/SystemAlert.vue'

type WizardStep = 1 | 2 | 3

type FormErrors = Partial<Record<'firstname' | 'lastname' | 'email' | 'phone' | 'legalAccepted', string>>

const props = withDefaults(
  defineProps<{
    /**
     * Platform route: `/coach/:slug/onboarding/discovery`
     * Custom domain route: `/onboarding/discovery` (slug resolved via host).
     */
    slug?: string
  }>(),
  {
    slug: undefined
  }
)

const STORAGE_KEY_PREFIX = 'lyvia:onboarding:discovery:wizard:v2'

const slug = computed(() => (props.slug ?? '').trim())

const timeZone = ref('Europe/Paris')
const durationMinutes = ref(15)

const step = ref<WizardStep>(1)
const isLoadingTenant = ref(false)
const isLoadingAvailability = ref(false)
const tenant = ref<PublicTenantResponse | null>(null)
const availability = ref<ProviderAvailabilityResponse | null>(null)
const selectedDate = ref<string | null>(null)
const selectedSlotStartAt = ref<string | null>(null)
const isSubmitting = ref(false)
const booking = ref<BookDiscoveryResponse | null>(null)

const systemError = ref<string | null>(null)
const formErrors = ref<FormErrors>({})

const now = new Date()
const visibleMonth = ref(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)))

const identity = ref({
  firstname: '',
  lastname: '',
  email: '',
  phone: ''
})

const consents = ref({
  legalAccepted: false,
  emailMarketingOptIn: false,
  smsMarketingOptIn: false
})

function updateConsents(value: typeof consents.value) {
  consents.value = value
}

const coachName = computed(() => tenant.value?.brand.displayName ?? null)

function getTenantStorageKey(): string {
  if (import.meta.server) return STORAGE_KEY_PREFIX
  const key = slug.value.length > 0 ? `slug:${slug.value}` : `host:${window.location.host}`
  return `${STORAGE_KEY_PREFIX}:${key}`
}

function getPublicHeaders(): HeadersInit | undefined {
  if (import.meta.server) {
    const headers = useRequestHeaders(['host', 'x-forwarded-host', 'x-forwarded-proto'])
    const forwardedHost = headers['x-forwarded-host']
    const host = headers.host
    const forwardedProto = headers['x-forwarded-proto']

    return {
      ...(forwardedHost ? { 'x-forwarded-host': forwardedHost } : {}),
      ...(host ? { 'x-forwarded-host': host } : {}),
      ...(forwardedProto ? { 'x-forwarded-proto': forwardedProto } : {})
    }
  }

  return {
    'x-forwarded-host': window.location.host,
    'x-forwarded-proto': window.location.protocol.replace(':', '')
  }
}

function getYmdInTimeZone(date: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date)

  const year = parts.find(p => p.type === 'year')?.value ?? '0000'
  const month = parts.find(p => p.type === 'month')?.value ?? '01'
  const day = parts.find(p => p.type === 'day')?.value ?? '01'
  return `${year}-${month}-${day}`
}

const minDate = computed(() => getYmdInTimeZone(new Date(), timeZone.value))
const maxDate = computed(() => {
  const now = new Date()
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  return getYmdInTimeZone(end, timeZone.value)
})

const slotsByDate = computed(() => {
  const map = new Map<string, AvailabilitySlot[]>()
  for (const slot of availability.value?.slots ?? []) {
    const key = getYmdInTimeZone(new Date(slot.startAt), timeZone.value)
    const existing = map.get(key) ?? []
    existing.push(slot)
    map.set(key, existing)
  }

  for (const [key, list] of map) {
    list.sort((a, b) => a.startAt.localeCompare(b.startAt))
    map.set(key, list)
  }

  return map
})

const availableDates = computed(() => new Set(slotsByDate.value.keys()))

const selectedDaySlots = computed(() => {
  if (!selectedDate.value) return []
  return slotsByDate.value.get(selectedDate.value) ?? []
})

const selectedDateLabel = computed(() => {
  if (!selectedDate.value) return null
  const [y, m, d] = selectedDate.value.split('-').map(Number)
  if (!y || !m || !d) return selectedDate.value
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timeZone.value,
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date(Date.UTC(y, m - 1, d)))
})

function sanitizeStep(next: number): WizardStep {
  if (next === 1 || next === 2 || next === 3) return next
  return 1
}

function getOrCreateIdempotencyKey(): string {
  if (import.meta.server) return ''

  const storageKey = getTenantStorageKey()
  const existing = sessionStorage.getItem(`${storageKey}:idempotency`)
  if (existing && existing.trim().length > 0) return existing

  const created = crypto?.randomUUID?.() ?? `uuid_${Math.random().toString(16).slice(2)}_${Date.now()}`
  sessionStorage.setItem(`${storageKey}:idempotency`, created)
  return created
}

function clearIdempotencyKey() {
  if (import.meta.server) return
  sessionStorage.removeItem(`${getTenantStorageKey()}:idempotency`)
}

function persistState() {
  if (import.meta.server) return
  const storageKey = getTenantStorageKey()
  const state = {
    step: step.value,
    visibleMonth: visibleMonth.value.toISOString(),
    selectedDate: selectedDate.value,
    selectedSlotStartAt: selectedSlotStartAt.value,
    identity: identity.value,
    consents: consents.value
  }
  sessionStorage.setItem(storageKey, JSON.stringify(state))
}

function restoreState() {
  if (import.meta.server) return
  const storageKey = getTenantStorageKey()
  const raw = sessionStorage.getItem(storageKey)
  if (!raw) return

  try {
    const parsed = JSON.parse(raw) as Partial<{
      step: number
      visibleMonth: string
      selectedDate: string | null
      selectedSlotStartAt: string | null
      identity: typeof identity.value
      consents: typeof consents.value
    }>

    if (typeof parsed.step === 'number') step.value = sanitizeStep(parsed.step)
    if (typeof parsed.visibleMonth === 'string') visibleMonth.value = new Date(parsed.visibleMonth)
    if (typeof parsed.selectedDate === 'string' || parsed.selectedDate === null) selectedDate.value = parsed.selectedDate ?? null
    if (typeof parsed.selectedSlotStartAt === 'string' || parsed.selectedSlotStartAt === null)
      selectedSlotStartAt.value = parsed.selectedSlotStartAt ?? null
    if (parsed.identity) identity.value = { ...identity.value, ...parsed.identity }
    if (parsed.consents) consents.value = { ...consents.value, ...parsed.consents }
  } catch {
    sessionStorage.removeItem(storageKey)
  }
}

function buildDiscoveryWindow(): { from: string, to: string } {
  const start = new Date()
  const end = new Date(start.getTime() + 14 * 24 * 60 * 60 * 1000)
  return { from: start.toISOString(), to: end.toISOString() }
}

async function loadAvailability() {
  systemError.value = null
  if (!tenant.value) return

  isLoadingAvailability.value = true

  try {
    const { from, to } = buildDiscoveryWindow()
    const response = await apiFetch<ProviderAvailabilityResponse>(
      '/public/availability/discovery',
      {
        method: 'GET',
        withAuth: false,
        headers: getPublicHeaders(),
        query: {
          ...(slug.value.length > 0 ? { slug: slug.value } : {}),
          from,
          to
        }
      }
    )

    availability.value = response
    timeZone.value = response.timezone || 'Europe/Paris'
    durationMinutes.value = response.durationMinutes || 15

    if (selectedDate.value && (selectedDate.value < minDate.value || selectedDate.value > maxDate.value)) {
      selectedDate.value = null
      selectedSlotStartAt.value = null
    }

    if (!selectedDate.value || !availableDates.value.has(selectedDate.value)) {
      const candidates = [...availableDates.value].sort()
      const firstFuture = candidates.find(d => d >= minDate.value) ?? candidates[0]
      selectedDate.value = firstFuture ?? null
    }
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'VALIDATION_ERROR') {
        const windowMessage = typeof err.apiError.details?.window === 'string' ? err.apiError.details.window : null
        systemError.value = windowMessage ?? mapOnboardingErrorCodeToUserMessage(err.apiError.code).description
        return
      }

      systemError.value = mapOnboardingErrorCodeToUserMessage(err.apiError.code).description
      return
    }

    systemError.value = 'Impossible de charger les disponibilités.'
  } finally {
    isLoadingAvailability.value = false
  }
}

async function loadTenant() {
  systemError.value = null
  isLoadingTenant.value = true

  try {
    const response = await apiFetch<PublicTenantResponse>('/public/tenant', {
      method: 'GET',
      withAuth: false,
      headers: getPublicHeaders(),
      query: slug.value.length > 0 ? { slug: slug.value } : undefined
    })

    tenant.value = response
    timeZone.value = response.timezone || 'Europe/Paris'
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      systemError.value = mapOnboardingErrorCodeToUserMessage(err.apiError.code).description
      return
    }

    systemError.value = 'Impossible de charger les informations du coach.'
  } finally {
    isLoadingTenant.value = false
  }
}

watch(selectedDate, () => {
  if (!selectedSlotStartAt.value || !selectedDate.value) return
  const slotDay = getYmdInTimeZone(new Date(selectedSlotStartAt.value), timeZone.value)
  if (slotDay !== selectedDate.value) selectedSlotStartAt.value = null
})

watch(
  [step, selectedDate, selectedSlotStartAt, identity, consents],
  () => {
    persistState()
  },
  { deep: true }
)

onMounted(() => {
  restoreState()
  loadTenant().then(() => {
    loadAvailability()
  })
})

function goToStep(next: WizardStep) {
  systemError.value = null
  formErrors.value = {}
  step.value = next
}

function onSelectSlot(slot: AvailabilitySlot) {
  selectedSlotStartAt.value = slot.startAt
  goToStep(2)
}

function validateIdentity(): boolean {
  const errors: FormErrors = {}

  if (!identity.value.firstname.trim()) errors.firstname = 'Le prénom est requis.'
  if (!identity.value.lastname.trim()) errors.lastname = 'Le nom est requis.'
  if (!identity.value.email.trim()) errors.email = 'L’email est requis.'
  if (!identity.value.phone.trim()) errors.phone = 'Le téléphone est requis.'
  if (!consents.value.legalAccepted) errors.legalAccepted = 'Veuillez accepter les conditions pour continuer.'

  formErrors.value = errors
  return Object.keys(errors).length === 0
}

function applyBackendValidationErrors(details: Record<string, unknown> | undefined) {
  if (!details) return
  const raw = details.validationErrors
  if (!Array.isArray(raw)) return

  const errors: FormErrors = { ...formErrors.value }

  for (const item of raw) {
    if (!item || typeof item !== 'object') continue
    const path = (item as Record<string, unknown>).path
    const message = (item as Record<string, unknown>).message
    if (typeof path !== 'string' || typeof message !== 'string') continue

    if (path === 'firstname') errors.firstname = message
    if (path === 'lastname') errors.lastname = message
    if (path === 'email') errors.email = message
    if (path === 'phone') errors.phone = message
    if (path === 'consents.legalAccepted') errors.legalAccepted = message
  }

  formErrors.value = errors
}

function goToConfirmation() {
  systemError.value = null
  if (!selectedSlotStartAt.value) {
    systemError.value = 'Veuillez sélectionner un créneau.'
    goToStep(1)
    return
  }

  if (!validateIdentity()) return
  goToStep(3)
}

function formatConfirmationDate(iso: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timeZone.value,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso))
}

async function submitBooking() {
  if (isSubmitting.value) return
  systemError.value = null

  if (!validateIdentity()) {
    goToStep(2)
    return
  }
  if (!selectedSlotStartAt.value) {
    goToStep(1)
    return
  }

  const idempotencyKey = getOrCreateIdempotencyKey()
  if (!idempotencyKey) {
    systemError.value = 'Impossible de confirmer pour le moment. Veuillez réessayer.'
    return
  }

  isSubmitting.value = true

  try {
    const payload: BookDiscoveryForTenantRequest = {
      firstname: identity.value.firstname.trim(),
      lastname: identity.value.lastname.trim(),
      email: identity.value.email.trim().toLowerCase(),
      phone: normalizePhone(identity.value.phone),
      slotStartAt: selectedSlotStartAt.value,
      consents: {
        legalAccepted: consents.value.legalAccepted,
        emailMarketingOptIn: consents.value.emailMarketingOptIn,
        smsMarketingOptIn: consents.value.smsMarketingOptIn
      },
      idempotencyKey
    }

    const response = await apiFetch<BookDiscoveryResponse>('/public/onboarding/discovery', {
      method: 'POST',
      withAuth: false,
      headers: {
        ...getPublicHeaders(),
        'Idempotency-Key': idempotencyKey
      },
      query: slug.value.length > 0 ? { slug: slug.value } : undefined,
      body: payload
    })

    booking.value = response
    clearIdempotencyKey()
    sessionStorage.removeItem(getTenantStorageKey())
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      const mapped = mapOnboardingErrorCodeToUserMessage(err.apiError.code)
      systemError.value = mapped.description

      if (err.apiError.code === 'VALIDATION_ERROR') {
        applyBackendValidationErrors(err.apiError.details)
        goToStep(2)
        return
      }

      if (err.apiError.code === 'SLOT_ALREADY_BOOKED') {
        goToStep(1)
        await loadAvailability()
      }

      return
    }

    systemError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}
</script>

<template>
  <div class="grid gap-6">
    <WizardStepper
      :steps="[
        { label: 'Créneau' },
        { label: 'Infos' },
        { label: 'Confirmation' }
      ]"
      :current-step="step"
    />

    <SystemAlert
      v-if="systemError"
      variant="error"
      :description="systemError"
    />

    <div
      v-if="isLoadingTenant"
      class="flex items-center gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-4 text-sm text-[color:var(--color-brand-secondary)]"
      role="status"
      aria-live="polite"
    >
      <Icon
        name="lucide:loader-circle"
        size="18"
        class="animate-spin text-[color:var(--color-accent-main)]"
        aria-hidden="true"
      />
      <span>Chargement du coach…</span>
    </div>

    <section
      v-if="step === 1 && tenant"
      class="grid gap-6"
      aria-label="Étape 1 : choix du créneau"
    >
      <div class="grid gap-1">
        <h2 class="font-serif text-[1.5rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
          Choisissez votre moment
        </h2>
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          <span v-if="coachName">Coach : {{ coachName }} • </span>
          Durée : {{ durationMinutes }} min • Fuseau : {{ timeZone }}
        </p>
      </div>

      <div class="grid gap-6 lg:grid-cols-[1fr,1fr] lg:items-start">
        <CalendarMonthView
          v-model="selectedDate"
          v-model:visible-month="visibleMonth"
          :available-dates="availableDates"
          :min-date="minDate"
          :max-date="maxDate"
          :timezone-label="timeZone"
          :is-loading="isLoadingAvailability"
        />

        <TimeSlotGrid
          :title="selectedDateLabel ? `Disponibilités pour ${selectedDateLabel}` : 'Sélectionnez un jour'"
          :slots="selectedDaySlots"
          :selected-start-at="selectedSlotStartAt"
          :time-zone="timeZone"
          @select="onSelectSlot"
        />
      </div>
    </section>

    <section
      v-else-if="step === 2 && tenant"
      class="grid gap-6"
      aria-label="Étape 2 : informations"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-1">
          <h2 class="font-serif text-[1.5rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
            Vos informations
          </h2>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Gratuit et sans engagement.
          </p>
        </div>

        <button
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
          @click="goToStep(1)"
        >
          <Icon
            name="lucide:arrow-left"
            size="16"
            aria-hidden="true"
          />
          Retour
        </button>
      </div>

      <BookingSummary
        v-if="selectedSlotStartAt"
        :scheduled-at="selectedSlotStartAt"
        :time-zone="timeZone"
        :duration-minutes="durationMinutes"
        @edit="goToStep(1)"
      />

      <IdentityForm
        v-model="identity"
        :consents="consents"
        :errors="formErrors"
        @update:consents="updateConsents"
      />

      <PrimaryButton
        type="button"
        label="Continuer"
        :disabled="isSubmitting"
        @click="goToConfirmation"
      />
    </section>

    <section
      v-else-if="tenant"
      class="grid gap-6"
      aria-label="Étape 3 : confirmation"
    >
      <div class="flex items-start justify-between gap-4">
        <div class="grid gap-1">
          <h2 class="font-serif text-[1.5rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
            Confirmation
          </h2>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Vérifiez le récapitulatif avant de confirmer.
          </p>
        </div>

        <button
          v-if="!booking"
          type="button"
          class="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
          @click="goToStep(2)"
        >
          <Icon
            name="lucide:arrow-left"
            size="16"
            aria-hidden="true"
          />
          Retour
        </button>
      </div>

      <div
        v-if="booking"
        class="grid gap-4"
        role="status"
        aria-live="polite"
      >
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)]">
            <Icon
              name="lucide:check"
              size="18"
              class="text-[color:var(--color-accent-main)]"
              aria-hidden="true"
            />
          </div>
          <div class="grid gap-0.5">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              C’est noté, {{ identity.firstname || 'merci' }} !
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Votre appel découverte est confirmé.
            </p>
          </div>
        </div>

        <div class="rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-4">
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Date :
          </p>
          <p class="text-base font-semibold text-[color:var(--color-brand-primary)]">
            {{ formatConfirmationDate(booking.scheduledAt) }}
          </p>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Une confirmation vient d’être envoyée à <span class="font-semibold">{{ identity.email }}</span>.
          </p>
        </div>

        <NuxtLink
          to="/"
          class="text-center text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
        >
          Retour à l’accueil
        </NuxtLink>
      </div>

      <div
        v-else
        class="grid gap-4"
      >
        <BookingSummary
          v-if="selectedSlotStartAt"
          :scheduled-at="selectedSlotStartAt"
          :time-zone="timeZone"
          :duration-minutes="durationMinutes"
          @edit="goToStep(1)"
        />

        <div class="rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-4">
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Vos coordonnées
          </p>
          <p class="mt-1 text-sm font-semibold text-[color:var(--color-brand-primary)]">
            {{ identity.firstname }} {{ identity.lastname }}
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            {{ identity.email }} • {{ identity.phone }}
          </p>
        </div>

        <PrimaryButton
          type="button"
          label="Confirmer mon appel"
          loading-label="Confirmation en cours…"
          :loading="isSubmitting"
          :disabled="isSubmitting"
          @click="submitBooking"
        />

        <p class="text-center text-xs text-[color:var(--color-brand-secondary)]">
          Gratuit et sans engagement.
        </p>
      </div>
    </section>
  </div>
</template>
