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
import { createUuidV4, isUuid } from '../../utils/uuid'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'
import BookingSidebar from '../molecules/BookingSidebar.vue'
import BookingSummary from '../molecules/BookingSummary.vue'
import IdentityForm from '../molecules/IdentityForm.vue'
import SlotPicker from './SlotPicker.vue'

type WizardStep = 1 | 2 | 3

type FormErrors = Partial<Record<'firstname' | 'lastname' | 'email' | 'phone' | 'legalAccepted', string>>

const props = withDefaults(
  defineProps<{
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
const isWhiteLabelTenant = computed(() => tenant.value?.brand.mode === 'custom_domain')
const headerLogoSrc = computed(() =>
  isWhiteLabelTenant.value ? '/images/logo_aurea_menopause_inline.png' : '/images/keova-logo.png'
)
const headerLogoAlt = computed(() =>
  isWhiteLabelTenant.value ? (tenant.value?.brand.displayName ?? 'Logo de la marque') : 'Keova'
)
const headerLogoClass = computed(() =>
  isWhiteLabelTenant.value ? 'h-14 w-auto' : 'h-10 w-auto'
)
const coachInitials = computed(() => {
  const value = coachName.value
  if (!value) return 'K'
  const parts = value.trim().split(/\s+/).filter(Boolean)
  const initials = parts.slice(0, 2).map(part => part[0]?.toUpperCase()).join('')
  return initials || 'K'
})

const stepperItems = computed(() => [
  {
    title: 'Créneau',
    description: 'Choisissez un moment',
    icon: 'i-lucide-calendar'
  },
  {
    title: 'Informations',
    description: 'Vos coordonnées',
    icon: 'i-lucide-user'
  },
  {
    title: 'Confirmation',
    description: 'C\'est réservé !',
    icon: 'i-lucide-check'
  }
])

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
    selectedSlotStartAt: selectedSlotStartAt.value
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
    }>

    if (typeof parsed.step === 'number') step.value = sanitizeStep(parsed.step)
    if (typeof parsed.visibleMonth === 'string') visibleMonth.value = new Date(parsed.visibleMonth)
    if (typeof parsed.selectedDate === 'string' || parsed.selectedDate === null) selectedDate.value = parsed.selectedDate ?? null
    if (typeof parsed.selectedSlotStartAt === 'string' || parsed.selectedSlotStartAt === null)
      selectedSlotStartAt.value = parsed.selectedSlotStartAt ?? null

    // PII (identity, consents, booking) are no longer persisted (WEB-005 security fix).
    // If step was 3 (confirmation) but booking is not in memory, reset to step 1.
    if (step.value === 3 && !booking.value) step.value = 1
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
  [step, selectedDate, selectedSlotStartAt],
  () => {
    persistState()
  }
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
  if (!identity.value.email.trim()) errors.email = 'L\'email est requis.'
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

    // Google Ads conversion event (AC-5)
    const gtagFn = useState<((...args: unknown[]) => void) | null>('gtag')
    const adsId = useState<string | null>('googleAdsId')
    const convLabel = useState<string | null>('googleAdsConversionLabel')
    if (gtagFn.value && adsId.value && convLabel.value) {
      gtagFn.value('event', 'conversion', {
        send_to: `${adsId.value}/${convLabel.value}`,
        value: 1.0,
        currency: 'EUR'
      })
    }
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
    <!-- Header -->
    <header class="mb-8 text-center">
      <ULink
        to="/"
        aria-label="Retour à l'accueil"
        class="mb-6 inline-block"
      >
        <NuxtImg
          :src="headerLogoSrc"
          :alt="headerLogoAlt"
          :class="headerLogoClass"
          loading="eager"
        />
      </ULink>

      <h1 class="font-serif text-3xl font-normal text-neutral-900 sm:text-4xl">
        Réservez votre appel découverte
      </h1>
      <p class="mt-2 text-neutral-500">
        {{ durationMinutes }} minutes pour faire le point, gratuitement.
      </p>
    </header>

    <!-- Stepper -->
    <div class="mx-auto mb-8 max-w-2xl">
      <UStepper
        :model-value="step"
        :items="stepperItems"
        color="primary"
        size="md"
        :disabled="true"
        class="w-full"
      />
    </div>

    <!-- Loading state -->
    <div
      v-if="isLoadingTenant"
      class="flex items-center justify-center gap-3 py-20 text-neutral-500"
    >
      <UIcon
        name="i-lucide-loader-circle"
        class="size-5 animate-spin"
      />
      <span>Chargement...</span>
    </div>

    <!-- Main content -->
    <div
      v-else-if="tenant"
      class="grid gap-8 lg:grid-cols-[280px_1fr] lg:items-start"
    >
      <!-- Sidebar - Desktop only -->
      <div class="hidden lg:block">
        <UCard
          class="sticky top-8"
          :ui="{ body: 'p-6' }"
        >
          <BookingSidebar
            :coach-name="coachName"
            :coach-initials="coachInitials"
            :timezone="timeZone"
            :duration-minutes="durationMinutes"
            :selected-slot-start-at="selectedSlotStartAt"
          />
        </UCard>
      </div>

      <!-- Mobile summary card -->
      <div class="lg:hidden">
        <UCard
          :ui="{ body: 'p-4' }"
          class="mb-6"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UAvatar
                :text="coachInitials"
                size="sm"
                class="bg-crepuscule-100 text-crepuscule-700"
              />
              <div>
                <p class="font-medium text-neutral-900">
                  {{ coachName }}
                </p>
                <p class="text-xs text-neutral-500">
                  {{ durationMinutes }} min · Gratuit
                </p>
              </div>
            </div>
            <UBadge
              v-if="selectedSlotStartAt"
              color="primary"
              variant="soft"
              size="xs"
            >
              Créneau choisi
            </UBadge>
          </div>
        </UCard>
      </div>

      <!-- Step content -->
      <div>
        <!-- System error -->
        <UAlert
          v-if="systemError"
          color="error"
          variant="soft"
          :title="systemError"
          icon="i-lucide-alert-circle"
          class="mb-6"
          :close-button="{ icon: 'i-lucide-x', color: 'error', variant: 'link' }"
          @close="systemError = null"
        />

        <Transition
          name="wizard-step"
          mode="out-in"
        >
          <!-- Step 1: Slot selection -->
          <UCard
            v-if="step === 1"
            key="step-1"
            :ui="{ body: 'p-6 sm:p-8' }"
          >
            <div class="mb-6">
              <h2 class="text-xl font-semibold text-neutral-900">
                Choisissez votre moment
              </h2>
              <p class="mt-1 text-sm text-neutral-500">
                Sélectionnez une date puis un créneau disponible.
              </p>
            </div>

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

            <!-- Desktop CTA -->
            <div class="mt-8 hidden sm:block">
              <UButton
                size="lg"
                color="primary"
                :disabled="!selectedSlotStartAt || isLoadingAvailability"
                @click="goToIdentityStep"
              >
                Continuer
                <template #trailing>
                  <UIcon name="i-lucide-arrow-right" />
                </template>
              </UButton>
            </div>

            <!-- Mobile fixed CTA -->
            <div class="fixed inset-x-0 bottom-0 z-50 border-t border-neutral-200 bg-white p-4 sm:hidden">
              <UButton
                size="lg"
                color="primary"
                block
                :disabled="!selectedSlotStartAt || isLoadingAvailability"
                @click="goToIdentityStep"
              >
                Continuer
              </UButton>
            </div>

            <!-- Spacer for mobile fixed button -->
            <div class="h-20 sm:hidden" />
          </UCard>

          <!-- Step 2: Identity form -->
          <UCard
            v-else-if="step === 2"
            key="step-2"
            :ui="{ body: 'p-6 sm:p-8' }"
          >
            <div class="mx-auto max-w-lg">
              <div class="mb-6 flex items-start justify-between">
                <div>
                  <h2 class="text-xl font-semibold text-neutral-900">
                    Vos informations
                  </h2>
                  <p class="mt-1 text-sm text-neutral-500">
                    Pour confirmer votre réservation.
                  </p>
                </div>
                <UButton
                  variant="ghost"
                  color="neutral"
                  size="sm"
                  :disabled="isSubmitting"
                  @click="goToStep(1)"
                >
                  <UIcon name="i-lucide-arrow-left" />
                  Retour
                </UButton>
              </div>

              <BookingSummary
                v-if="selectedSlotStartAt"
                :scheduled-at="selectedSlotStartAt"
                :time-zone="timeZone"
                :duration-minutes="durationMinutes"
                class="mb-6"
                @edit="goToStep(1)"
              />

              <IdentityForm
                v-model="identity"
                :consents="consents"
                :errors="formErrors"
                :disabled="isSubmitting"
                @update:consents="updateConsents"
              />

              <UButton
                size="lg"
                color="primary"
                class="mt-8"
                block
                :loading="isSubmitting"
                :disabled="isSubmitting"
                @click="submitBooking"
              >
                Confirmer mon appel
              </UButton>

              <p class="mt-4 text-center text-xs text-neutral-500">
                Une confirmation vous sera envoyée par email.
              </p>
            </div>
          </UCard>

          <!-- Step 3: Confirmation -->
          <UCard
            v-else-if="step === 3"
            key="step-3"
            :ui="{ body: 'p-6 sm:p-8' }"
          >
            <div
              v-if="booking"
              class="mx-auto max-w-lg text-center"
            >
              <div class="mx-auto mb-6 flex size-16 items-center justify-center rounded-full bg-success-100">
                <UIcon
                  name="i-lucide-check"
                  class="size-8 text-success-600"
                />
              </div>

              <h2 class="text-2xl font-semibold text-neutral-900">
                C'est confirmé{{ identity.firstname ? `, ${identity.firstname}` : '' }} !
              </h2>
              <p class="mt-2 text-neutral-500">
                Votre appel découverte est réservé.
              </p>

              <UCard
                class="mt-8 text-left"
                :ui="{ body: 'p-5' }"
                variant="soft"
              >
                <div class="flex items-start gap-4">
                  <UIcon
                    name="i-lucide-calendar-check"
                    class="size-6 shrink-0 text-crepuscule-600"
                  />
                  <div>
                    <p class="font-semibold capitalize text-neutral-900">
                      {{ formatConfirmationDate(booking.scheduledAt) }}
                    </p>
                    <p class="mt-1 text-sm text-neutral-500">
                      Avec {{ coachName }} · {{ durationMinutes }} min
                    </p>
                  </div>
                </div>
              </UCard>

              <UAlert
                class="mt-6 text-left"
                color="info"
                variant="soft"
                icon="i-lucide-mail"
              >
                <template #title>
                  Confirmation envoyée à <strong>{{ identity.email }}</strong>
                </template>
                <template #description>
                  Vérifiez votre dossier spam si vous ne recevez rien.
                </template>
              </UAlert>

              <UButton
                to="/"
                variant="ghost"
                color="neutral"
                class="mt-8"
              >
                Retour à l'accueil
              </UButton>
            </div>

            <div
              v-else
              class="py-8 text-center"
            >
              <UAlert
                color="error"
                variant="soft"
                title="Impossible d'afficher la confirmation"
                icon="i-lucide-alert-circle"
              />
              <UButton
                class="mt-6"
                @click="goToStep(1)"
              >
                Recommencer
              </UButton>
            </div>
          </UCard>
        </Transition>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wizard-step-enter-active,
.wizard-step-leave-active {
  transition: opacity 200ms ease, transform 200ms ease;
}

.wizard-step-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

.wizard-step-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
</style>
