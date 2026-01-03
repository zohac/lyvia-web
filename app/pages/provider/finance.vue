<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import ProviderPaymentsSection from '../../components/organisms/ProviderPaymentsSection.vue'
import { useProviderFinance } from '../../features/finance/useProviderFinance'
import { useProviderPayments } from '../../features/payments/useProviderPayments'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Finance'
})

const toast = useToast()
const route = useRoute()
const router = useRouter()

const stripeReturnCookie = useCookie<string | null>('kaora_stripe_return', {
  default: () => null,
  sameSite: 'lax',
  maxAge: 10 * 60,
  path: '/provider/finance'
})

const finance = await useProviderFinance()
const payments = await useProviderPayments()

const uiState = computed(() => finance.uiState.value)

const hasHandledStripeReturn = ref(true)
const hasStripeReturnQuery = computed(() => Object.keys(route.query).length > 0)

if (stripeReturnCookie.value || hasStripeReturnQuery.value) {
  hasHandledStripeReturn.value = false
}

const formattedPendingAmount = computed(() => {
  const state = uiState.value
  if (!state) return null
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })
  return formatter.format(state.pendingPayoutCents / 100)
})

const stripeHumanStatus = computed(() => {
  const state = uiState.value
  if (!state) return null

  if (!state.stripe.stripeAccountId) return { label: 'Non connecté', tone: 'neutral' as const }
  if (state.stripe.chargesEnabled && state.stripe.payoutsEnabled) return { label: 'Actif', tone: 'success' as const }
  if (!state.stripe.detailsSubmitted) return { label: 'Vérification requise', tone: 'warning' as const }
  if (state.stripe.requirementsDue.length > 0) return { label: 'Informations manquantes', tone: 'warning' as const }
  return { label: 'En cours de validation', tone: 'warning' as const }
})

const primaryCta = computed(() => {
  const state = uiState.value
  if (!state) return null

  if (state.kind === 'shadow') {
    return {
      label: 'Débloquer mes fonds',
      description: 'Connectez votre banque pour recevoir vos virements.',
      enabled: true
    }
  }

  if (state.kind === 'start') {
    return {
      label: 'Connecter mon compte bancaire',
      description: 'Activez les virements pour recevoir vos revenus.',
      enabled: true
    }
  }

  if (state.kind === 'incomplete') {
    return {
      label: 'Terminer la vérification',
      description: 'Il manque une étape pour activer les virements.',
      enabled: true
    }
  }

  return {
    label: 'Compte bancaire connecté',
    description: 'Vos virements seront traités automatiquement.',
    enabled: false
  }
})

watch(
  () => finance.summary.value?.stripe.onboardingCompletedAt,
  (next, prev) => {
    if (!next || next === prev) return
    toast.add({
      title: 'Connexion bancaire activée',
      description: 'Votre compte est prêt à recevoir des virements.',
      color: 'primary'
    })
  }
)

function clearStripeReturnFlag() {
  stripeReturnCookie.value = null
  if (import.meta.client) {
    window.sessionStorage.removeItem('kaora_stripe_return')
  }
}

async function handleStripeReturnIfNeeded() {
  const hasSessionFlag = import.meta.client
    ? window.sessionStorage.getItem('kaora_stripe_return') === '1'
    : false

  const shouldHandle = Boolean(stripeReturnCookie.value) || hasStripeReturnQuery.value || hasSessionFlag
  if (!shouldHandle) return

  hasHandledStripeReturn.value = false
  finance.clearActionError()

  await finance.refresh()

  const summary = finance.summary.value
  const stripe = summary?.stripe

  if (!stripe?.stripeAccountId) {
    toast.add({
      title: 'Connexion bancaire non finalisée',
      description: 'Reprenez la configuration pour activer les virements.',
      color: 'primary'
    })
  } else if (stripe.chargesEnabled && stripe.payoutsEnabled) {
    toast.add({
      title: 'Connexion bancaire activée',
      description: 'Votre compte est prêt à recevoir des virements.',
      color: 'primary'
    })
  } else {
    toast.add({
      title: 'Connexion bancaire en cours',
      description: 'Il manque une étape pour activer les virements. Reprenez la vérification si besoin.',
      color: 'primary'
    })
  }

  clearStripeReturnFlag()
  hasHandledStripeReturn.value = true

  if (hasStripeReturnQuery.value) {
    await router.replace({ path: route.path, query: {} })
  }
}

onMounted(() => {
  void handleStripeReturnIfNeeded()
})

async function onRefresh() {
  finance.clearActionError()
  await finance.refresh()
}

async function onConnect() {
  finance.clearActionError()
  stripeReturnCookie.value = '1'
  if (import.meta.client) {
    window.sessionStorage.setItem('kaora_stripe_return', '1')
  }
  await finance.startConnect()
}

async function refreshPayments() {
  await payments.refresh()
}
</script>

<template>
  <section class="grid gap-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="font-serif text-3xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
          Finance
        </h1>
        <p class="mt-2 max-w-xl text-sm text-[color:var(--color-brand-secondary)]">
          Suivez vos fonds en attente et activez les virements vers votre banque, sans jargon.
        </p>
      </div>

      <UButton
        color="neutral"
        variant="ghost"
        class="rounded-full"
        :loading="finance.pending.value"
        @click="onRefresh"
      >
        Rafraîchir
      </UButton>
    </div>

    <SystemAlert
      v-if="finance.errorMessage.value"
      variant="error"
      title="Impossible de charger la page Finance"
      :description="finance.errorMessage.value"
    />

    <SystemAlert
      v-if="finance.actionErrorMessage.value"
      variant="error"
      title="Action impossible"
      :description="finance.actionErrorMessage.value"
    />

    <div
      v-if="(finance.pending.value && !uiState) || !hasHandledStripeReturn"
      class="rounded-blob-c border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-8 shadow-soft"
    >
      <div class="animate-pulse space-y-4">
        <div class="h-10 w-2/3 rounded-full bg-[color:var(--color-surface-highlight)]" />
        <div class="h-4 w-1/2 rounded-full bg-[color:var(--color-surface-highlight)]" />
        <div class="h-12 w-56 rounded-full bg-[color:var(--color-surface-highlight)]" />
      </div>
    </div>

    <div
      v-else-if="uiState && primaryCta"
      class="grid gap-6"
    >
      <div
        class="relative overflow-hidden rounded-blob-c border border-white/70 bg-[color:var(--color-kaora-50)] p-8 shadow-floating"
      >
        <div class="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-[rgba(212,184,160,0.35)] blur-3xl" />
        <div class="absolute -bottom-24 -right-16 h-72 w-72 rounded-full bg-[rgba(156,130,107,0.18)] blur-3xl" />

        <div class="relative grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
          <div class="flex items-start gap-5">
            <div class="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 text-[color:var(--color-brand-accent)] shadow-soft">
              <UIcon
                name="lucide:lock"
                class="h-7 w-7"
              />
            </div>
            <div class="grid gap-2">
              <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Vos fonds
              </p>
              <h2 class="font-serif text-2xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
                <template v-if="uiState.kind === 'shadow' && formattedPendingAmount">
                  {{ formattedPendingAmount }} sont en sécurité chez Kaora.
                </template>
                <template v-else-if="uiState.kind === 'ready'">
                  Votre compte est prêt à recevoir des virements.
                </template>
                <template v-else>
                  Préparez vos virements en toute sérénité.
                </template>
              </h2>
              <p class="max-w-xl text-sm text-[color:var(--color-brand-secondary)]">
                {{ primaryCta.description }}
              </p>
            </div>
          </div>

          <UButton
            color="primary"
            class="rounded-full px-8 py-3 text-base font-bold"
            :disabled="!primaryCta.enabled"
            :loading="finance.actionPending.value"
            @click="onConnect"
          >
            {{ primaryCta.label }}
          </UButton>
        </div>
      </div>

      <div class="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div class="rounded-blob-d border border-white/60 bg-white/80 p-7 shadow-soft backdrop-blur-md">
          <div class="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Connexion bancaire
              </h3>
              <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
                Statut et étapes de vérification pour activer les virements.
              </p>
            </div>

            <span
              v-if="stripeHumanStatus"
              class="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold"
              :class="[
                stripeHumanStatus.tone === 'success'
                  ? 'bg-[rgba(181,192,163,0.22)] text-[color:var(--color-brand-primary)]'
                  : stripeHumanStatus.tone === 'warning'
                    ? 'bg-[rgba(217,119,6,0.14)] text-[color:var(--color-brand-primary)]'
                    : 'bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-primary)]'
              ]"
            >
              <span
                class="h-2 w-2 rounded-full"
                :class="[
                  stripeHumanStatus.tone === 'success'
                    ? 'bg-[color:var(--color-success)]'
                    : stripeHumanStatus.tone === 'warning'
                      ? 'bg-[color:var(--color-warning)]'
                      : 'bg-[color:var(--color-brand-muted)]'
                ]"
              />
              {{ stripeHumanStatus.label }}
            </span>
          </div>

          <div
            v-if="uiState.kind !== 'ready'"
            class="mt-6 grid gap-3"
          >
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Prochaines étapes
            </p>
            <ul
              v-if="finance.requirementSteps.value.length"
              class="grid gap-2"
            >
              <li
                v-for="step in finance.requirementSteps.value"
                :key="step"
                class="flex gap-3 rounded-2xl bg-[color:var(--color-surface-highlight)] px-4 py-3 text-sm text-[color:var(--color-brand-primary)]"
              >
                <UIcon
                  name="lucide:sparkles"
                  class="mt-0.5 h-5 w-5 flex-shrink-0 text-[color:var(--color-brand-accent)]"
                />
                <span>{{ step }}</span>
              </li>
            </ul>
            <p
              v-else
              class="text-sm text-[color:var(--color-brand-secondary)]"
            >
              Connectez votre banque pour finaliser les informations nécessaires.
            </p>
          </div>
        </div>

        <div class="rounded-blob-b border border-white/60 bg-white/80 p-7 shadow-soft backdrop-blur-md">
          <h3 class="font-serif text-xl italic text-[color:var(--color-brand-primary)]">
            Fonds en attente
          </h3>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Vos paiements confirmés restent en sécurité le temps que la connexion bancaire soit prête.
          </p>

          <div class="mt-6 grid gap-3">
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-sm font-semibold text-[color:var(--color-brand-muted)]">
                Montant
              </span>
              <span class="font-serif text-xl text-[color:var(--color-brand-primary)]">
                {{ formattedPendingAmount ?? '—' }}
              </span>
            </div>
            <div class="flex items-baseline justify-between gap-3">
              <span class="text-sm font-semibold text-[color:var(--color-brand-muted)]">
                Paiements concernés
              </span>
              <span class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                {{ uiState.pendingPayoutCount }}
              </span>
            </div>
          </div>

          <p
            v-if="uiState.pendingPayoutCents === 0"
            class="mt-6 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun fonds en attente pour le moment.
          </p>
        </div>
      </div>

      <ProviderPaymentsSection
        :pending="payments.pending.value"
        :error-message="payments.errorMessage.value"
        :payments="payments.payments.value"
        :next-cursor="payments.nextCursor.value"
        :load-more-pending="payments.loadMorePending.value"
        :load-more-error-message="payments.loadMoreErrorMessage.value"
        @refresh="refreshPayments"
        @load-more="payments.loadMore"
      />
    </div>
  </section>
</template>
