<script setup lang="ts">
import ProviderPaymentsSection from '../../components/organisms/ProviderPaymentsSection.vue'
import { useProviderFinance } from '../../features/finance/useProviderFinance'
import { resolvePendingFundsCard } from '../../features/finance/domain/finance-state'
import { useProviderPayments } from '../../features/payments/useProviderPayments'
import { useStripeLinks } from '../../features/stripe/useStripeLinks'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Finance'
})

const toast = useToast()
const route = useRoute()
const router = useRouter()

const stripeReturnCookie = useCookie<string | null>('keova_stripe_return', {
  default: () => null,
  sameSite: 'lax',
  maxAge: 10 * 60,
  path: '/provider/finance'
})

const finance = await useProviderFinance()
const payments = await useProviderPayments()
const stripeLinks = useStripeLinks()

const uiState = computed(() => finance.uiState.value)

const hasHandledStripeReturn = ref(true)
const hasStripeReturnQuery = computed(() => Object.keys(route.query).length > 0)

if (stripeReturnCookie.value || hasStripeReturnQuery.value) {
  hasHandledStripeReturn.value = false
}

const eurFormatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })

const formattedPendingAmount = computed(() => {
  const state = uiState.value
  if (!state) return null
  return eurFormatter.format(state.pendingPayoutCents / 100)
})

// HF19: pending-funds card content, resolved by state (connected / shadow / unavailable).
const pendingCard = computed(() => {
  const summary = finance.summary.value
  if (!summary) return null
  return resolvePendingFundsCard(summary)
})

const pendingCardAmount = computed(() => {
  const card = pendingCard.value
  if (!card || card.mode === 'unavailable') return null
  return eurFormatter.format(card.amountCents / 100)
})

// ── Design: bold tone-based hero + icon tiles + badges (DS B2B finance-view) ──
type HeroTone = 'neutral' | 'warning' | 'success'

const HERO_GRADIENTS: Record<HeroTone, string> = {
  neutral: 'linear-gradient(135deg, var(--color-crepuscule-800), var(--color-crepuscule-600))',
  warning: 'linear-gradient(135deg, var(--color-sunset-700), var(--color-sunset-500))',
  success: 'linear-gradient(135deg, var(--color-success-600), var(--color-success-500))'
}

const heroConfig = computed(() => {
  const state = uiState.value
  if (!state || !primaryCta.value) return null

  const perKind: Record<string, { tone: HeroTone, icon: string, eyebrow: string }> = {
    shadow: { tone: 'warning', icon: 'lucide:lock', eyebrow: 'Fonds en attente de déblocage' },
    start: { tone: 'neutral', icon: 'lucide:landmark', eyebrow: 'Compte bancaire non connecté' },
    incomplete: { tone: 'warning', icon: 'lucide:alert-triangle', eyebrow: 'Vérification en cours' },
    ready: { tone: 'success', icon: 'lucide:check-circle', eyebrow: 'Compte bancaire connecté' }
  }
  const base = perKind[state.kind] ?? perKind.start!

  const heading = state.kind === 'shadow' && formattedPendingAmount.value
    ? `${formattedPendingAmount.value} en attente`
    : state.kind === 'ready'
      ? 'Votre compte est prêt'
      : 'Configurez vos virements'

  return {
    tone: base.tone,
    icon: base.icon,
    eyebrow: base.eyebrow,
    heading,
    body: primaryCta.value.description,
    gradient: HERO_GRADIENTS[base.tone]
  }
})

type Tile = 'neutral' | 'sunset' | 'success'

const TILE_CLASSES: Record<Tile, string> = {
  success: 'bg-[color:var(--color-success-50)] text-[color:var(--color-success-600)]',
  sunset: 'bg-[color:var(--color-sunset-50)] text-[color:var(--color-sunset-600)]',
  neutral: 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)]'
}

const bankTile = computed<Tile>(() => {
  const kind = uiState.value?.kind
  if (kind === 'ready') return 'success'
  if (kind === 'start') return 'neutral'
  return 'sunset'
})

const bankBadge = computed(() => {
  const status = stripeHumanStatus.value
  if (!status) return null
  const palette: Record<string, { wrap: string, dot: string }> = {
    success: {
      wrap: 'bg-[color:var(--color-success-50)] text-[color:var(--color-success-700)] border-[color:var(--color-success-100)]',
      dot: 'bg-[color:var(--color-success)]'
    },
    warning: {
      wrap: 'bg-[color:var(--color-sunset-50)] text-[color:var(--color-sunset-700)] border-[color:var(--color-sunset-200)]',
      dot: 'bg-[color:var(--color-sunset-500)]'
    },
    neutral: {
      wrap: 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-text-secondary)] border-[color:var(--color-border-subtle)]',
      dot: 'bg-[color:var(--color-neutral-400)]'
    }
  }
  return { label: status.label, ...(palette[status.color] ?? palette.neutral!) }
})

const pendingTile = computed<Tile>(() => {
  const card = pendingCard.value
  if (card && card.mode !== 'unavailable' && card.amountCents > 0) return 'sunset'
  return 'neutral'
})

const REQUIREMENT_BOX: Record<string, { box: string, icon: string }> = {
  critical: {
    box: 'bg-[color:var(--color-error-50)] text-[color:var(--color-error-600)] border-[color:var(--color-error-200)]',
    icon: 'lucide:alert-triangle'
  },
  warning: {
    box: 'bg-[color:var(--color-sunset-50)] text-[color:var(--color-sunset-700)] border-[color:var(--color-sunset-200)]',
    icon: 'lucide:alert-triangle'
  },
  info: {
    box: 'bg-[color:var(--color-crepuscule-50)] text-[color:var(--color-crepuscule-700)] border-[color:var(--color-crepuscule-100)]',
    icon: 'lucide:info'
  }
}

function requirementBox(severity: string) {
  return REQUIREMENT_BOX[severity] ?? REQUIREMENT_BOX.info!
}

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
    window.sessionStorage.removeItem('keova_stripe_return')
  }
}

async function handleStripeReturnIfNeeded() {
  const hasSessionFlag = import.meta.client
    ? window.sessionStorage.getItem('keova_stripe_return') === '1'
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
    window.sessionStorage.setItem('keova_stripe_return', '1')
  }
  await finance.startConnect()
}

async function refreshPayments() {
  await payments.refresh()
}
</script>

<template>
  <div class="space-y-8">
    <AtomsDsPageHeader
      title="Finance"
      subtitle="Suivez vos fonds en attente et activez les virements vers votre banque."
    >
      <template #actions>
        <div class="flex flex-wrap items-center gap-2">
          <UButton
            :to="stripeLinks.paymentsUrl"
            target="_blank"
            rel="noopener noreferrer"
            external
            variant="outline"
            color="neutral"
          >
            <UIcon
              name="lucide:external-link"
              class="mr-2 h-4 w-4"
            />
            Gérer sur Stripe
          </UButton>
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
        </div>
      </template>
    </AtomsDsPageHeader>

    <!-- Error alerts -->
    <AtomsDsErrorState
      v-if="finance.errorMessage.value"
      :message="finance.errorMessage.value"
      @retry="onRefresh()"
    />

    <template v-else>
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
        class="bg-[color:var(--color-surface-card)]"
      >
        <div class="space-y-4">
          <USkeleton class="h-8 w-2/3" />
          <USkeleton class="h-4 w-1/2" />
          <USkeleton class="h-12 w-48" />
        </div>
      </UCard>

      <!-- Main content -->
      <template v-else-if="uiState && primaryCta">
        <!-- Hero — bold tone-based gradient (DS B2B) -->
        <div
          v-if="heroConfig"
          class="relative overflow-hidden rounded-[var(--radius-lg)] p-8 text-white shadow-[0_12px_32px_rgba(91,75,110,0.18)] sm:p-9"
          :style="{ background: heroConfig.gradient }"
        >
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -right-10 -top-16 h-56 w-56 rounded-full bg-white/10"
          />
          <div
            aria-hidden="true"
            class="pointer-events-none absolute -bottom-20 right-28 h-40 w-40 rounded-full bg-white/[0.06]"
          />

          <div class="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div class="flex items-start gap-5">
              <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15">
                <UIcon
                  :name="heroConfig.icon"
                  class="h-7 w-7"
                />
              </div>

              <div class="max-w-xl space-y-2.5">
                <p class="text-xs font-bold uppercase tracking-[0.08em] text-white/80">
                  {{ heroConfig.eyebrow }}
                </p>
                <h2 class="font-[family-name:var(--font-serif)] text-3xl font-bold italic leading-tight">
                  {{ heroConfig.heading }}
                </h2>
                <p class="max-w-md text-sm leading-relaxed text-white/90">
                  {{ heroConfig.body }}
                </p>
              </div>
            </div>

            <div class="shrink-0">
              <span
                v-if="!primaryCta.enabled"
                class="inline-flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 text-sm font-semibold text-white"
              >
                <UIcon
                  name="lucide:check-circle"
                  class="h-4 w-4"
                />
                {{ primaryCta.label }}
              </span>
              <button
                v-else
                type="button"
                class="inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-semibold text-[color:var(--color-crepuscule-800)] shadow-sm transition hover:bg-white/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 disabled:opacity-70"
                :disabled="finance.actionPending.value"
                @click="onConnect"
              >
                <UIcon
                  :name="finance.actionPending.value
                    ? 'lucide:loader-2'
                    : (uiState.kind === 'shadow' ? 'lucide:unlock' : 'lucide:arrow-right')"
                  class="h-4 w-4"
                  :class="finance.actionPending.value ? 'animate-spin' : ''"
                />
                {{ primaryCta.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- Grid: bank connection (2/3) + pending funds (1/3) -->
        <div class="grid gap-6 lg:grid-cols-3">
          <!-- Bank connection card -->
          <UCard class="bg-[color:var(--color-surface-card)] lg:col-span-2">
            <template #header>
              <div class="flex items-center justify-between gap-3">
                <div class="flex items-center gap-3">
                  <div
                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                    :class="TILE_CLASSES[bankTile]"
                  >
                    <UIcon
                      name="lucide:landmark"
                      class="h-5 w-5"
                    />
                  </div>
                  <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                    Connexion bancaire
                  </h3>
                </div>
                <span
                  v-if="bankBadge"
                  class="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium"
                  :class="bankBadge.wrap"
                >
                  <span
                    class="h-1.5 w-1.5 rounded-full"
                    :class="bankBadge.dot"
                  />
                  {{ bankBadge.label }}
                </span>
              </div>
            </template>

            <!-- Requirements / next steps -->
            <div
              v-if="uiState.kind !== 'ready' || finance.requirementAlerts.value.length > 0"
              class="space-y-3"
            >
              <div
                v-if="finance.requirementAlerts.value.length"
                class="space-y-2"
              >
                <div
                  v-for="alert in finance.requirementAlerts.value"
                  :key="alert.message"
                  class="flex items-start gap-2.5 rounded-xl border px-3.5 py-2.5"
                  :class="requirementBox(alert.severity).box"
                >
                  <UIcon
                    :name="requirementBox(alert.severity).icon"
                    class="mt-0.5 h-4 w-4 shrink-0"
                  />
                  <span class="text-sm leading-snug">{{ alert.message }}</span>
                </div>
              </div>

              <p
                v-else
                class="text-sm text-[color:var(--color-text-muted)]"
              >
                Connectez votre banque pour finaliser les informations nécessaires.
              </p>

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
              class="flex items-start gap-3 rounded-xl border border-[color:var(--color-success-100)] bg-[color:var(--color-success-50)] p-4"
            >
              <UIcon
                name="lucide:check-circle"
                class="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--color-success-600)]"
              />
              <div>
                <p class="font-medium text-[color:var(--color-success-800)]">
                  Tout est en ordre
                </p>
                <p class="text-sm text-[color:var(--color-success-700)]">
                  Aucune information supplémentaire n'est requise pour le moment.
                </p>
              </div>
            </div>
          </UCard>

          <!-- Pending funds card (HF19: real Stripe balance when connected) -->
          <UCard
            v-if="pendingCard"
            class="bg-[color:var(--color-surface-card)]"
          >
            <template #header>
              <div class="flex items-center gap-3">
                <div
                  class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                  :class="TILE_CLASSES[pendingTile]"
                >
                  <UIcon
                    name="lucide:banknote"
                    class="h-5 w-5"
                  />
                </div>
                <h3 class="font-semibold text-[color:var(--color-text-primary)]">
                  Fonds en attente
                </h3>
              </div>
            </template>

            <div class="flex h-full flex-col">
              <p class="font-[family-name:var(--font-serif)] text-4xl font-bold text-[color:var(--color-text-primary)]">
                {{ pendingCardAmount ?? '—' }}
              </p>
              <p
                v-if="pendingCard.mode === 'shadow'"
                class="mt-1 text-sm text-[color:var(--color-text-muted)]"
              >
                {{ pendingCard.count }} paiement{{ pendingCard.count !== 1 ? 's' : '' }} en attente
              </p>
              <p class="mt-4 border-t border-[color:var(--color-border-subtle)] pt-4 text-sm leading-relaxed text-[color:var(--color-text-secondary)]">
                {{ pendingCard.message }}
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
    </template>
  </div>
</template>
