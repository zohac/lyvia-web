<script setup lang="ts">
import SlotPicker from '../../../components/organisms/SlotPicker.vue'
import PlanSelector from '../../../components/organisms/PlanSelector.vue'
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import { useClientConsultationBooking } from '../../../features/consultation/useClientConsultationBooking'
import { useCoachLink } from '../../../composables/useCoachLink'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Réserver une consultation'
})

const toast = useToast()

const booking = await useClientConsultationBooking()
const state = booking.state

const timeZone = computed(() => state.availability?.timezone ?? state.tenant?.timezone ?? 'Europe/Paris')
const canBook = computed(() => state.availability?.gates?.canBook ?? true)
const gateReason = computed(() => state.availability?.gates?.reason ?? null)

const activePlans = computed(() => state.activePlans)
const selectedPricePlan = computed(() => booking.selectedPricePlan.value)
const mustChoosePricePlan = computed(() => activePlans.value.length > 1 && !selectedPricePlan.value)
const hasNoActivePlans = computed(() => Boolean(state.pricing && activePlans.value.length === 0))

const discoveryCtaPath = computed(() => {
  // White-label custom domain: the cliente is already on the tenant's host,
  // so we keep a relative path to /onboarding/discovery (not the absolute URL).
  if (state.tenant?.brand.mode === 'custom_domain') return '/onboarding/discovery'
  // Platform: resolve via useCoachLink — P-Y6 convention.
  if (state.tenant?.slug) {
    return useCoachLink({ slug: state.tenant.slug }).booking
  }
  return '/'
})

const selectedSlot = computed(() => {
  const startAt = state.selectedStartAt
  if (!startAt) return null
  return state.availability?.slots.find(slot => slot.startAt === startAt) ?? null
})

const formattedSelectedDate = computed(() => {
  const slot = selectedSlot.value
  if (!slot) return null
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: timeZone.value,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  }).format(new Date(slot.startAt))
})

const formattedSelectedTime = computed(() => {
  const slot = selectedSlot.value
  if (!slot) return null
  const start = new Date(slot.startAt)
  const end = new Date(slot.endAt)
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: timeZone.value,
    hour: '2-digit',
    minute: '2-digit'
  })
  return `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`
})

const price = computed(() => {
  const plan = selectedPricePlan.value
  if (plan) return { amountCents: plan.amountCents, currency: 'EUR' as const, label: plan.label, durationMinutes: plan.durationMinutes }
  return null
})

const formattedPrice = computed(() => {
  if (!price.value) return null
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: price.value.currency })
  return formatter.format(price.value.amountCents / 100)
})

const isRedirecting = ref(false)

const actionFieldErrorEntries = computed(() => Object.entries(state.actionFieldErrors))

type StoredCheckoutMeta = {
  providerId: string
  pricePlanId: string
  pricePlanLabel: string
  durationMinutes: number
  slotStartAt: string
  slotEndAt: string
  timeZone: string
  amountCents: number
  currency: 'EUR'
}

function buildCheckoutStorageKey(sessionId: string): string {
  return `keova_consultation_checkout:${sessionId}`
}

function storeCheckoutMeta(sessionId: string, meta: StoredCheckoutMeta) {
  if (!import.meta.client) return
  try {
    window.sessionStorage.setItem(buildCheckoutStorageKey(sessionId), JSON.stringify(meta))
  } catch {
    // Ignore quota errors.
  }
}

async function handleCheckout() {
  if (!canBook.value) return
  if (!selectedPricePlan.value) return

  isRedirecting.value = true
  const response = await booking.startCheckout({
    successPath: '/client/consultation/success?session_id={CHECKOUT_SESSION_ID}',
    cancelPath: '/client/consultation/cancelled'
  })

  if (!response?.stripe.checkoutUrl) {
    isRedirecting.value = false
    return
  }

  if (selectedSlot.value && selectedPricePlan.value && booking.providerId.value) {
    storeCheckoutMeta(response.stripe.sessionId, {
      providerId: booking.providerId.value,
      pricePlanId: selectedPricePlan.value.id,
      pricePlanLabel: selectedPricePlan.value.label,
      durationMinutes: selectedPricePlan.value.durationMinutes,
      slotStartAt: selectedSlot.value.startAt,
      slotEndAt: selectedSlot.value.endAt,
      timeZone: timeZone.value,
      amountCents: response.payment.amountCents,
      currency: response.payment.currency
    })
  }

  if (import.meta.client && isValidStripeUrl(response.stripe.checkoutUrl)) {
    window.location.assign(response.stripe.checkoutUrl)
  }
}

watch(
  () => state.actionErrorCode,
  (code) => {
    if (code === 'SLOT_ALREADY_BOOKED') {
      toast.add({
        title: 'Créneau indisponible',
        description: 'Désolé, ce créneau vient de partir. Sélectionnez-en un autre.',
        color: 'primary'
      })
    }
  }
)

function retry() {
  booking.clearActionErrors()
  booking.clearSelection()
  return booking.refreshAvailability()
}
</script>

<template>
  <section class="grid gap-8">
    <header class="grid gap-2">
      <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
        Consultation
      </p>
      <h1 class="font-serif text-3xl italic text-[color:var(--color-brand-primary)] sm:text-4xl">
        Choisir un créneau
      </h1>
      <p class="max-w-2xl text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
        Sélectionnez votre créneau, vérifiez le récapitulatif (prix, date, heure), puis procédez au paiement sécurisé.
      </p>
    </header>

    <SystemAlert
      v-if="state.errorMessage && !hasNoActivePlans"
      variant="error"
      title="Impossible de charger les créneaux"
      :description="state.errorMessage"
    />

    <div
      v-else-if="hasNoActivePlans"
      class="grid gap-4 rounded-xl border border-[rgba(231,229,228,0.85)] bg-white/75 p-8 shadow-soft backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <div class="grid gap-2">
        <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
          Tarifs indisponibles
        </p>
        <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Aucun tarif de consultation
        </h2>
        <p class="text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
          {{ state.errorMessage ?? 'Aucun tarif de consultation n’est disponible pour le moment.' }}
        </p>
      </div>

      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <ULink
          :to="discoveryCtaPath"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating focus-visible:text-white"
        >
          <Icon
            name="lucide:phone-call"
            size="18"
            aria-hidden="true"
          />
          Réserver un appel découverte
        </ULink>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
          @click="retry"
        >
          <Icon
            name="lucide:refresh-ccw"
            size="16"
            aria-hidden="true"
          />
          Actualiser les tarifs
        </button>
      </div>
    </div>

    <SystemAlert
      v-else-if="state.noticeMessage"
      variant="warning"
      title="Tarif mis à jour"
      :description="state.noticeMessage"
    />

    <button
      v-if="state.errorMessage && !hasNoActivePlans"
      type="button"
      class="inline-flex w-fit items-center gap-2 rounded-full border border-white/70 bg-white/70 px-5 py-2.5 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
      @click="retry"
    >
      <Icon
        name="lucide:refresh-ccw"
        size="16"
        aria-hidden="true"
      />
      Réessayer
    </button>

    <div
      v-else-if="state.pending"
      class="grid gap-6"
      role="status"
      aria-live="polite"
    >
      <div class="h-44 rounded-3xl bg-white/60 shadow-soft" />
      <div class="h-72 rounded-3xl bg-white/55 shadow-soft" />
    </div>

    <div
      v-else-if="state.availability && !canBook"
      class="rounded-xl border border-[rgba(231,229,228,0.85)] bg-white/70 p-8 shadow-soft backdrop-blur"
    >
      <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Réservation bloquée
      </h2>
      <p class="mt-3 text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
        <span v-if="gateReason === 'ONBOARDING_NOT_COMPLETED'">
          Avant de réserver une consultation, un appel découverte est requis pour activer votre accès.
        </span>
        <span v-else>
          La réservation de consultation n’est pas disponible pour le moment.
        </span>
      </p>

      <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <ULink
          :to="discoveryCtaPath"
          class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating focus-visible:text-white"
        >
          <Icon
            name="lucide:phone-call"
            size="18"
            aria-hidden="true"
          />
          Réserver l’appel découverte
        </ULink>
        <ULink
          to="/client/dashboard"
          class="text-sm font-semibold text-[color:var(--color-brand-accent)] underline-offset-4 hover:underline"
        >
          Retour au tableau de bord
        </ULink>
      </div>
    </div>

    <div
      v-else-if="state.pricing"
      class="grid gap-10 lg:grid-cols-[2fr,1fr] lg:items-start"
    >
      <div class="grid gap-6">
        <PlanSelector
          v-if="activePlans.length > 1"
          :plans="activePlans"
          :selected-plan-id="state.selectedPricePlanId"
          :currency="state.pricing.currency"
          selection-required
          @update:selected-plan-id="booking.selectPricePlan"
        />

        <div
          v-if="mustChoosePricePlan"
          class="rounded-xl border border-[rgba(231,229,228,0.85)] bg-white/70 p-6 text-sm text-[color:var(--color-brand-secondary)] shadow-soft backdrop-blur"
          role="status"
          aria-live="polite"
        >
          Choisissez un tarif ci-dessus pour afficher les créneaux disponibles.
        </div>

        <SlotPicker
          v-else
          v-model:selected-start-at="state.selectedStartAt"
          :slots="state.availability?.slots ?? []"
          :time-zone="timeZone"
          :timezone-label="timeZone"
          :is-loading="state.pending"
          :error="null"
        />

        <div class="text-xs text-[color:var(--color-brand-muted)]">
          Horaires affichés : <span class="font-semibold text-[color:var(--color-brand-primary)]">{{ timeZone }}</span>
        </div>
      </div>

      <aside class="hidden lg:block">
        <div class="sticky top-28 grid gap-5 rounded-3xl border border-[rgba(231,229,228,0.85)] bg-white/75 p-6 shadow-soft backdrop-blur">
          <div class="grid gap-1">
            <p class="text-[10px] font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Récapitulatif
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Prix & créneau à confirmer.
            </p>
          </div>

          <dl class="grid gap-3 rounded-3xl bg-[color:var(--color-surface-highlight)] p-5">
            <div class="flex items-center justify-between gap-3">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Tarif
              </dt>
              <dd class="font-serif text-base italic text-[color:var(--color-brand-primary)]">
                {{ formattedPrice ?? '—' }}
              </dd>
            </div>
            <div
              v-if="price?.label"
              class="grid gap-1"
            >
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Offre
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ price.label }}
              </dd>
            </div>
            <div class="grid gap-1">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Date
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ formattedSelectedDate ?? 'Sélectionnez un créneau' }}
              </dd>
            </div>
            <div class="grid gap-1">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Heure
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ formattedSelectedTime ?? '—' }}
              </dd>
            </div>
          </dl>

          <div class="grid gap-3">
            <button
              type="button"
              :disabled="state.actionPending || !state.selectedStartAt || !selectedPricePlan"
              class="inline-flex min-h-[3rem] w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-center text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:bg-[color:var(--color-brand-subtle)] disabled:text-[color:var(--color-brand-secondary)]"
              @click="handleCheckout"
            >
              <Icon
                name="lucide:lock"
                size="18"
                aria-hidden="true"
              />
              Payer {{ formattedPrice ?? '—' }} &amp; Réserver
            </button>

            <p class="text-xs leading-relaxed text-[color:var(--color-brand-muted)]">
              Paiement sécurisé via Stripe. Vous serez redirigée vers une page externe.
            </p>
          </div>

          <div
            v-if="state.actionErrorMessage"
            class="rounded-xl border border-[rgba(239,68,68,0.18)] bg-[rgba(254,242,242,0.6)] p-4 text-sm text-[color:var(--color-brand-primary)]"
          >
            {{ state.actionErrorMessage }}
          </div>

          <ul
            v-if="actionFieldErrorEntries.length > 0"
            class="grid gap-2 rounded-xl border border-[rgba(239,68,68,0.12)] bg-[rgba(254,242,242,0.55)] p-4 text-xs text-[color:var(--color-brand-primary)]"
          >
            <li
              v-for="[field, message] in actionFieldErrorEntries"
              :key="field"
              class="leading-relaxed"
            >
              <span class="font-semibold">
                {{ field }}
              </span>
              : {{ message }}
            </li>
          </ul>

          <div
            v-if="state.actionErrorCode === 'PAYMENT_PENDING'"
            class="rounded-xl border border-[rgba(212,184,160,0.4)] bg-white/60 p-4 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Un paiement est déjà en cours pour ce créneau. Reprenez-le depuis votre espace Paiements.
            <ULink
              to="/client/account?tab=paiements"
              class="mt-3 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] underline-offset-4 hover:underline"
            >
              Voir mes paiements
              <Icon
                name="lucide:arrow-right"
                size="16"
                aria-hidden="true"
              />
            </ULink>
          </div>

          <div
            v-if="state.actionErrorCode === 'ONBOARDING_NOT_COMPLETED'"
            class="rounded-xl border border-[rgba(212,184,160,0.4)] bg-white/60 p-4 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Un appel découverte est requis avant de pouvoir réserver une consultation.
            <ULink
              :to="discoveryCtaPath"
              class="mt-3 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[color:var(--color-brand-accent)] underline-offset-4 hover:underline"
            >
              Réserver mon appel découverte
              <Icon
                name="lucide:arrow-right"
                size="16"
                aria-hidden="true"
              />
            </ULink>
          </div>
        </div>
      </aside>

      <div class="sticky bottom-4 z-10 rounded-3xl border border-[rgba(231,229,228,0.85)] bg-white/85 p-4 shadow-floating backdrop-blur lg:hidden">
        <div class="flex items-start justify-between gap-4">
          <div class="grid gap-1">
            <p class="text-xs font-bold text-[color:var(--color-brand-primary)]">
              {{ formattedPrice ?? '—' }}
            </p>
            <p class="text-xs text-[color:var(--color-brand-secondary)]">
              {{ formattedSelectedDate ?? 'Sélectionnez un créneau' }}
            </p>
            <p class="text-xs text-[color:var(--color-brand-muted)]">
              {{ formattedSelectedTime ?? '—' }}
            </p>
          </div>

          <button
            type="button"
            :disabled="state.actionPending || !state.selectedStartAt || !selectedPricePlan"
            class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-5 text-xs font-bold text-white shadow-soft transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:bg-[color:var(--color-brand-subtle)] disabled:text-[color:var(--color-brand-secondary)]"
            @click="handleCheckout"
          >
            <Icon
              name="lucide:lock"
              size="16"
              aria-hidden="true"
            />
            Payer
          </button>
        </div>

        <p
          v-if="state.actionErrorMessage"
          class="mt-3 text-xs text-[color:var(--color-brand-primary)]"
        >
          {{ state.actionErrorMessage }}
        </p>

        <p
          v-if="state.actionErrorCode === 'ONBOARDING_NOT_COMPLETED'"
          class="mt-2 text-xs text-[color:var(--color-brand-secondary)]"
        >
          <ULink
            :to="discoveryCtaPath"
            class="font-semibold text-[color:var(--color-brand-accent)] underline-offset-4 hover:underline"
          >
            Réserver l’appel découverte
          </ULink>
        </p>
      </div>
    </div>

    <Teleport to="body">
      <div
        v-if="isRedirecting"
        class="fixed inset-0 z-[70] flex items-center justify-center bg-[rgba(28,25,23,0.2)] backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div class="grid max-w-sm gap-3 rounded-3xl bg-white/90 p-8 text-center shadow-floating">
          <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
            Paiement sécurisé
          </p>
          <p class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
            Redirection en cours…
          </p>
          <p class="text-sm text-[color:var(--color-brand-secondary)]">
            Une nouvelle fenêtre va s’ouvrir pour finaliser votre réservation.
          </p>
        </div>
      </div>
    </Teleport>
  </section>
</template>
