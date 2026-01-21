<script setup lang="ts">
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

  if (!state.stripe.stripeAccountId) return { label: 'Non connecté', color: 'neutral' as const, icon: 'lucide:link-2-off' }
  if (state.stripe.chargesEnabled && state.stripe.payoutsEnabled) return { label: 'Actif', color: 'success' as const, icon: 'lucide:check-circle' }
  if (!state.stripe.detailsSubmitted) return { label: 'Vérification requise', color: 'warning' as const, icon: 'lucide:alert-triangle' }
  if (state.stripe.requirementsDue.length > 0) return { label: 'Informations manquantes', color: 'warning' as const, icon: 'lucide:alert-triangle' }
  return { label: 'En cours de validation', color: 'warning' as const, icon: 'lucide:loader-2' }
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
  <div class="space-y-8">
    <!-- Page header -->
    <header class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 class="text-2xl font-semibold text-stone-900 sm:text-3xl">
          Finance
        </h1>
        <p class="mt-1 text-stone-500">
          Suivez vos fonds en attente et activez les virements vers votre banque.
        </p>
      </div>
      <UButton
        :loading="finance.pending.value"
        variant="outline"
        color="neutral"
        @click="onRefresh"
      >
        <UIcon
          name="lucide:refresh-cw"
          class="mr-2 h-4 w-4"
        />
        Actualiser
      </UButton>
    </header>

    <!-- Error alerts -->
    <UAlert
      v-if="finance.errorMessage.value"
      color="error"
      variant="soft"
      title="Impossible de charger la page Finance"
      :description="finance.errorMessage.value"
      icon="i-lucide-alert-circle"
    />

    <UAlert
      v-if="finance.actionErrorMessage.value"
      color="error"
      variant="soft"
      title="Action impossible"
      :description="finance.actionErrorMessage.value"
      icon="i-lucide-alert-circle"
    />

    <!-- Loading skeleton -->
    <UCard
      v-if="(finance.pending.value && !uiState) || !hasHandledStripeReturn"
      class="bg-white"
    >
      <div class="space-y-4">
        <USkeleton class="h-8 w-2/3" />
        <USkeleton class="h-4 w-1/2" />
        <USkeleton class="h-12 w-48" />
      </div>
    </UCard>

    <!-- Main content -->
    <template v-else-if="uiState && primaryCta">
      <!-- Hero card - Funds status -->
      <UCard
        class="relative overflow-hidden border-crepuscule-200 bg-gradient-to-br from-crepuscule-50 via-white to-crepuscule-50"
      >
        <!-- Decorative elements -->
        <div class="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-crepuscule-100/50 blur-3xl" />
        <div class="absolute -bottom-12 -left-12 h-40 w-40 rounded-full bg-crepuscule-200/30 blur-2xl" />

        <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div class="flex items-start gap-5">
            <!-- Icon container -->
            <div
              class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl shadow-sm"
              :class="[
                uiState.kind === 'ready'
                  ? 'bg-green-100 text-green-600'
                  : uiState.kind === 'shadow'
                    ? 'bg-amber-100 text-amber-600'
                    : 'bg-crepuscule-100 text-crepuscule-600'
              ]"
            >
              <UIcon
                :name="uiState.kind === 'ready' ? 'lucide:check-circle' : uiState.kind === 'shadow' ? 'lucide:lock' : 'lucide:wallet'"
                class="h-7 w-7"
              />
            </div>

            <div class="space-y-2">
              <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
                Vos fonds
              </p>
              <h2 class="text-xl font-semibold text-stone-900 sm:text-2xl">
                <template v-if="uiState.kind === 'shadow' && formattedPendingAmount">
                  {{ formattedPendingAmount }} en attente
                </template>
                <template v-else-if="uiState.kind === 'ready'">
                  Votre compte est prêt
                </template>
                <template v-else>
                  Configurez vos virements
                </template>
              </h2>
              <p class="max-w-lg text-sm text-stone-600">
                {{ primaryCta.description }}
              </p>
            </div>
          </div>

          <UButton
            color="primary"
            size="lg"
            :disabled="!primaryCta.enabled"
            :loading="finance.actionPending.value"
            @click="onConnect"
          >
            <UIcon
              :name="primaryCta.enabled ? 'lucide:arrow-right' : 'lucide:check'"
              class="mr-2 h-4 w-4"
            />
            {{ primaryCta.label }}
          </UButton>
        </div>
      </UCard>

      <!-- Stats cards grid -->
      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Bank connection card -->
        <UCard class="bg-white lg:col-span-2">
          <template #header>
            <div class="flex items-center justify-between">
              <div>
                <h3 class="font-semibold text-stone-900">
                  Connexion bancaire
                </h3>
                <p class="mt-1 text-sm text-stone-500">
                  Statut et étapes de vérification
                </p>
              </div>
              <UBadge
                v-if="stripeHumanStatus"
                :color="stripeHumanStatus.color"
                variant="soft"
                size="lg"
              >
                <UIcon
                  :name="stripeHumanStatus.icon"
                  class="mr-1.5 h-3.5 w-3.5"
                />
                {{ stripeHumanStatus.label }}
              </UBadge>
            </div>
          </template>

          <!-- Requirements alerts -->
          <div
            v-if="uiState.kind !== 'ready' || finance.requirementAlerts.value.length > 0"
            class="space-y-4"
          >
            <p class="text-xs font-medium uppercase tracking-wider text-stone-500">
              {{ uiState.kind === 'ready' ? 'À compléter prochainement' : 'Prochaines étapes' }}
            </p>

            <div
              v-if="finance.requirementAlerts.value.length"
              class="space-y-2"
            >
              <UAlert
                v-for="alert in finance.requirementAlerts.value"
                :key="alert.message"
                :color="alert.severity === 'critical' ? 'error' : alert.severity === 'warning' ? 'warning' : 'info'"
                variant="soft"
                :description="alert.message"
                :icon="alert.severity === 'critical' ? 'i-lucide-alert-circle' : alert.severity === 'warning' ? 'i-lucide-alert-triangle' : 'i-lucide-info'"
              />
            </div>

            <p
              v-else
              class="text-sm text-stone-500"
            >
              Connectez votre banque pour finaliser les informations nécessaires.
            </p>

            <!-- CTA to resolve requirements on Stripe -->
            <UButton
              v-if="finance.requirementAlerts.value.length > 0"
              color="primary"
              variant="outline"
              :loading="finance.actionPending.value"
              @click="onConnect"
            >
              <UIcon
                name="lucide:external-link"
                class="mr-2 h-4 w-4"
              />
              Résoudre sur Stripe
            </UButton>
          </div>

          <!-- Ready state -->
          <div
            v-else
            class="flex items-center gap-4 rounded-lg bg-green-50 p-4"
          >
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
              <UIcon
                name="lucide:check"
                class="h-5 w-5 text-green-600"
              />
            </div>
            <div>
              <p class="font-medium text-green-900">
                Tout est en ordre
              </p>
              <p class="text-sm text-green-700">
                Vos virements seront traités automatiquement.
              </p>
            </div>
          </div>
        </UCard>

        <!-- Pending funds card -->
        <UCard class="bg-white">
          <template #header>
            <h3 class="font-semibold text-stone-900">
              Fonds en attente
            </h3>
          </template>

          <div class="space-y-6">
            <!-- Amount display -->
            <div class="text-center">
              <p class="text-4xl font-bold text-stone-900">
                {{ formattedPendingAmount ?? '0,00 €' }}
              </p>
              <p class="mt-1 text-sm text-stone-500">
                {{ uiState.pendingPayoutCount }} paiement{{ uiState.pendingPayoutCount !== 1 ? 's' : '' }} en attente
              </p>
            </div>

            <!-- Divider -->
            <div class="h-px bg-stone-100" />

            <!-- Info text -->
            <p
              v-if="uiState.pendingPayoutCents === 0"
              class="text-center text-sm text-stone-500"
            >
              Aucun fonds en attente pour le moment.
            </p>
            <p
              v-else
              class="text-center text-sm text-stone-500"
            >
              Ces fonds seront virés dès que votre compte bancaire sera connecté.
            </p>
          </div>
        </UCard>
      </div>

      <!-- Payments section -->
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
    </template>
  </div>
</template>
