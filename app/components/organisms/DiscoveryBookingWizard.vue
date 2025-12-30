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
import { getYmdInTimeZone } from '../../features/slots/domain/slots'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import BookingSummary from '../molecules/BookingSummary.vue'
import IdentityForm from '../molecules/IdentityForm.vue'
import SlotPicker from './SlotPicker.vue'
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
const coachInitials = computed(() => {
  const value = coachName.value
  if (!value) return 'K'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
  return initials || 'K'
})

const progressWidth = computed(() => {
  const percent = (step.value / 3) * 100
  return `${Math.min(100, Math.max(0, percent))}%`
})

function getTenantStorageKey(): string {
  if (import.meta.server) return STORAGE_KEY_PREFIX
  const key = slug.value.length > 0 ? `slug:${slug.value}` : `host:${window.location.host}`
  return `${STORAGE_KEY_PREFIX}:${key}`
}

const minDate = computed(() => getYmdInTimeZone(new Date(), timeZone.value))
const maxDate = computed(() => {
  const now = new Date()
  const end = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)
  return getYmdInTimeZone(end, timeZone.value)
})

function sanitizeStep(next: number): WizardStep {
  if (next === 1 || next === 2 || next === 3) return next
  return 1
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function createUuidV4(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16)
    crypto.getRandomValues(bytes)

    // Per RFC 4122 section 4.4 (random UUID).
    bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40
    bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80

    const hex = [...bytes].map(b => b.toString(16).padStart(2, '0')).join('')
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
  }

  // Very last resort: pseudo-random, but still UUID-shaped for server validation.
  const hex = Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-a${hex.slice(17, 20)}-${hex.slice(20)}`
}

function getOrCreateIdempotencyKey(): string {
  if (import.meta.server) return ''

  const storageKey = getTenantStorageKey()
  const existing = sessionStorage.getItem(`${storageKey}:idempotency`)
  if (existing && isUuid(existing)) return existing

  const created = createUuidV4()
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
    consents: consents.value,
    booking: booking.value
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
      booking: BookDiscoveryResponse | null
    }>

    if (parsed.booking && typeof parsed.booking === 'object') booking.value = parsed.booking
    if (typeof parsed.step === 'number') step.value = sanitizeStep(parsed.step)
    if (typeof parsed.visibleMonth === 'string') visibleMonth.value = new Date(parsed.visibleMonth)
    if (typeof parsed.selectedDate === 'string' || parsed.selectedDate === null) selectedDate.value = parsed.selectedDate ?? null
    if (typeof parsed.selectedSlotStartAt === 'string' || parsed.selectedSlotStartAt === null)
      selectedSlotStartAt.value = parsed.selectedSlotStartAt ?? null
    if (parsed.identity) identity.value = { ...identity.value, ...parsed.identity }
    if (parsed.consents) consents.value = { ...consents.value, ...parsed.consents }

    if (booking.value) step.value = 3
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

  if (import.meta.client) {
    window.scrollTo({ top: 0, left: 0, behavior: 'smooth' })
  }
}

function onSelectSlot(slot: AvailabilitySlot) {
  selectedSlotStartAt.value = slot.startAt
}

function goToIdentityStep() {
  systemError.value = null

  if (!selectedSlotStartAt.value) {
    systemError.value = 'Veuillez sélectionner un créneau.'
    return
  }

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

  if (!validateIdentity()) return
  if (!selectedSlotStartAt.value) {
    goToStep(1)
    systemError.value = 'Veuillez sélectionner un créneau.'
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
        'Idempotency-Key': idempotencyKey
      },
      query: slug.value.length > 0 ? { slug: slug.value } : undefined,
      body: payload
    })

    booking.value = response
    clearIdempotencyKey()
    goToStep(3)
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
  <div class="w-full">
    <div class="mx-auto grid w-full max-w-5xl gap-8">
      <header class="grid justify-items-center gap-5 text-center">
        <NuxtLink
          to="/"
          aria-label="Retour à l’accueil"
          class="inline-flex items-center justify-center"
        >
          <img
            src="/images/kaora-logo.png"
            alt="Kaora"
            class="h-10 w-auto"
            decoding="async"
          >
        </NuxtLink>

        <div class="grid gap-2">
          <p class="text-xs font-semibold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Appel découverte
          </p>
          <h1 class="font-serif text-[2.2rem] font-bold leading-[var(--leading-tight)] tracking-[-0.01em] text-[color:var(--color-brand-primary)] sm:text-[2.75rem]">
            Votre appel découverte gratuit
          </h1>
          <p class="text-base text-[color:var(--color-brand-secondary)]">
            15 minutes pour faire le point, sans engagement.
          </p>
        </div>

        <div
          v-if="tenant"
          class="inline-flex items-center gap-3 rounded-full border border-white/60 bg-white/80 px-4 py-2 shadow-soft backdrop-blur"
          aria-label="Coach sélectionné"
        >
          <div class="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--color-brand-solid)] text-sm font-bold text-[color:var(--color-brand-primary)]">
            {{ coachInitials }}
          </div>
          <div class="grid gap-0.5 text-left">
            <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
              {{ coachName }}
            </p>
            <p class="text-xs text-[color:var(--color-brand-secondary)]">
              Fuseau : {{ timeZone }} • Durée : {{ durationMinutes }} min
            </p>
          </div>
        </div>
      </header>

      <div class="relative w-full overflow-hidden rounded-none bg-[color:var(--color-surface-card)] shadow-none sm:rounded-[var(--radius-organic)] sm:border sm:border-white/60 sm:shadow-soft">
        <div class="h-1 w-full bg-[color:var(--color-surface-highlight)]">
          <div
            class="h-full bg-[color:var(--color-brand-solid)] transition-base"
            :style="{ width: progressWidth }"
          />
        </div>

        <div class="p-6 sm:p-10">
          <SystemAlert
            v-if="systemError"
            variant="error"
            :description="systemError"
          />

          <div
            v-if="isLoadingTenant"
            class="mt-6 flex items-center gap-3 rounded-blob-d bg-[color:var(--color-surface-highlight)] p-4 text-sm text-[color:var(--color-brand-secondary)]"
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

          <Transition
            name="wizard-step"
            mode="out-in"
          >
            <section
              v-if="step === 1 && tenant"
              key="step-1"
              class="mt-8 grid gap-6 pb-24 sm:pb-0"
              aria-label="Étape 1 : choix du créneau"
            >
              <div class="grid gap-1">
                <h2 class="font-serif text-[1.6rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
                  Choisissez votre moment
                </h2>
                <p class="text-sm text-[color:var(--color-brand-secondary)]">
                  Sélectionnez une date puis un créneau disponible.
                </p>
              </div>

              <div class="grid gap-6">
                <SlotPicker
                  v-model:date="selectedDate"
                  v-model:visible-month="visibleMonth"
                  :slots="availability?.slots ?? []"
                  :selected-start-at="selectedSlotStartAt"
                  :min-date="minDate"
                  :max-date="maxDate"
                  :time-zone="timeZone"
                  :timezone-label="timeZone"
                  :is-loading="isLoadingAvailability"
                  @select="onSelectSlot"
                />

                <div class="hidden sm:block">
                  <PrimaryButton
                    type="button"
                    label="Continuer"
                    :disabled="!selectedSlotStartAt || isLoadingAvailability"
                    @click="goToIdentityStep"
                  />
                </div>
              </div>

              <div class="sm:hidden">
                <div class="fixed inset-x-0 bottom-0 z-50 px-4 pb-[env(safe-area-inset-bottom)]">
                  <div class="glass-panel rounded-blob-d p-4 shadow-floating">
                    <PrimaryButton
                      type="button"
                      label="Continuer"
                      :disabled="!selectedSlotStartAt || isLoadingAvailability"
                      @click="goToIdentityStep"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section
              v-else-if="step === 2 && tenant"
              key="step-2"
              class="mt-8 grid gap-8"
              aria-label="Étape 2 : informations"
            >
              <div class="mx-auto grid w-full max-w-lg gap-6">
                <div class="flex items-start justify-between gap-4">
                  <div class="grid gap-1">
                    <h2 class="font-serif text-[1.6rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
                      Vos informations
                    </h2>
                    <p class="text-sm text-[color:var(--color-brand-secondary)]">
                      Gratuit et sans engagement.
                    </p>
                  </div>

                  <button
                    type="button"
                    class="inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
                    :disabled="isSubmitting"
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
                  :disabled="isSubmitting"
                  @update:consents="updateConsents"
                />

                <PrimaryButton
                  type="button"
                  label="Confirmer mon appel"
                  loading-label="Confirmation en cours…"
                  :loading="isSubmitting"
                  :disabled="isSubmitting"
                  @click="submitBooking"
                />

                <p class="text-center text-xs text-[color:var(--color-brand-secondary)]">
                  Une confirmation vous sera envoyée par email. Pensez à vérifier vos spams.
                </p>
              </div>
            </section>

            <section
              v-else-if="step === 3 && tenant"
              key="step-3"
              class="mt-8 grid gap-8"
              aria-label="Étape 3 : succès"
            >
              <div
                v-if="booking"
                class="mx-auto grid w-full max-w-lg gap-6"
                role="status"
                aria-live="polite"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-11 w-11 items-center justify-center rounded-full bg-[rgba(181,192,163,0.18)]">
                    <Icon
                      name="lucide:check"
                      size="18"
                      class="text-[color:var(--color-success)]"
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

                <div class="rounded-blob-d bg-[color:var(--color-surface-highlight)] p-5">
                  <p class="text-sm text-[color:var(--color-brand-secondary)]">
                    Date
                  </p>
                  <p class="mt-1 text-base font-semibold text-[color:var(--color-brand-primary)]">
                    {{ formatConfirmationDate(booking.scheduledAt) }}
                  </p>
                  <p class="mt-3 text-sm text-[color:var(--color-brand-secondary)]">
                    Une confirmation vient d’être envoyée à <span class="font-semibold">{{ identity.email }}</span>.
                    Pensez à vérifier votre dossier Spam si vous ne recevez rien dans les prochaines minutes.
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
                class="mx-auto grid w-full max-w-lg gap-6"
              >
                <SystemAlert
                  variant="error"
                  description="Impossible d’afficher la confirmation pour le moment."
                />

                <PrimaryButton
                  type="button"
                  label="Revenir au début"
                  @click="goToStep(1)"
                />
              </div>
            </section>
          </Transition>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-step-enter-active,
.wizard-step-leave-active {
  transition: opacity var(--duration-normal) var(--ease-smooth), transform var(--duration-normal) var(--ease-smooth);
}

.wizard-step-enter-from,
.wizard-step-leave-to {
  opacity: 0;
  transform: translateX(10px);
}
</style>
