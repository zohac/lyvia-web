<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import { useConsultationCheckoutStatus } from '../../../features/consultation/useConsultationCheckoutStatus'
import { formatCurrency } from '../../../features/analytics/helpers/format-kpi'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Programme'
})

type StoredProgramCheckoutMeta = {
  programId: string
  programName: string
  totalSessions: number
  sessionDurationMinutes: number
  validityMonths: number
  amountCents: number
  paymentMode: 'one_time' | 'installments'
  installmentCount?: number
  currency: 'EUR'
}

function buildCheckoutStorageKey(sessionId: string): string {
  return `kaora_program_checkout:${sessionId}`
}

function readStoredMeta(sessionId: string): StoredProgramCheckoutMeta | null {
  if (!import.meta.client) return null
  try {
    const raw = window.sessionStorage.getItem(buildCheckoutStorageKey(sessionId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredProgramCheckoutMeta>
    if (!parsed.programId || !parsed.programName) return null
    if (typeof parsed.totalSessions !== 'number') return null
    if (typeof parsed.sessionDurationMinutes !== 'number') return null
    if (typeof parsed.validityMonths !== 'number') return null
    if (typeof parsed.amountCents !== 'number') return null
    if (parsed.currency !== 'EUR') return null
    if (parsed.paymentMode !== 'one_time' && parsed.paymentMode !== 'installments') return null
    return parsed as StoredProgramCheckoutMeta
  } catch {
    return null
  }
}

const route = useRoute()

const sessionId = computed(() => {
  const raw = route.query.session_id
  if (typeof raw !== 'string') return null
  const trimmed = raw.trim()
  return trimmed.startsWith('cs_') ? trimmed : null
})

const storedMeta = ref<StoredProgramCheckoutMeta | null>(null)

watchEffect(() => {
  const id = sessionId.value
  if (!id) return
  storedMeta.value = readStoredMeta(id)
})

const poller = useConsultationCheckoutStatus(sessionId, { intervalMs: 2000, maxAttempts: 10 })

onMounted(async () => {
  if (!sessionId.value) return
  await poller.start()
})

const statusLabel = computed(() => {
  const status = poller.state.status
  if (status === 'timeout') return 'timeout'
  return status
})

const title = computed(() => {
  const status = statusLabel.value
  if (status === 'confirmed') return 'Souscription confirmée'
  if (status === 'failed') return 'Paiement non finalisé'
  if (status === 'timeout') return 'Paiement reçu'
  return 'Vérification du paiement…'
})

const subtitle = computed(() => {
  const status = statusLabel.value
  if (status === 'confirmed') return 'Votre programme est activé. Vous allez recevoir une confirmation par email.'
  if (status === 'failed') return 'Le paiement n\'a pas été confirmé. Le programme n\'a pas été souscrit.'
  if (status === 'timeout') return 'Confirmation par email sous peu. Vous pouvez fermer cette page en toute sécurité.'
  return 'Nous attendons la confirmation de Stripe. Cela peut prendre quelques secondes.'
})

const formattedPrice = computed(() => {
  const meta = storedMeta.value
  if (!meta) return null
  return formatCurrency(meta.amountCents)
})

const paymentModeLabel = computed(() => {
  const meta = storedMeta.value
  if (!meta) return null
  if (meta.paymentMode === 'installments' && meta.installmentCount) {
    return `${meta.installmentCount}x mensualités`
  }
  return 'Paiement unique'
})

const showLoader = computed(() => poller.state.status === 'pending_confirmation' && poller.state.isPolling)

/**
 * Cleans the session_id query param from the URL after polling completes.
 */
function cleanUrlQueryParams() {
  if (!import.meta.client) return

  try {
    const url = new URL(window.location.href)
    url.searchParams.delete('session_id')
    window.history.replaceState({}, '', url.pathname + url.search)
  } catch {
    // Ignore errors (e.g., SSR or malformed URL)
  }
}

// Watch for polling completion to clean URL
watch(
  () => poller.state.status,
  (status) => {
    if (status === 'confirmed' || status === 'failed' || status === 'timeout') {
      cleanUrlQueryParams()
    }
  }
)

function retryPolling() {
  return poller.start()
}
</script>

<template>
  <section class="grid min-h-[calc(100vh-8rem)] place-items-center py-12">
    <div class="w-full max-w-2xl">
      <SystemAlert
        v-if="!sessionId"
        variant="error"
        title="Session Stripe manquante"
        description="Impossible de vérifier ce paiement sans identifiant de session."
      />

      <div
        v-else
        class="grid gap-6 rounded-3xl border border-[rgba(231,229,228,0.85)] bg-white/75 p-10 shadow-floating backdrop-blur"
      >
        <div
          v-if="showLoader"
          class="grid justify-items-center gap-4 text-center"
          role="status"
          aria-live="polite"
        >
          <img
            src="/images/kaora-logo.png"
            alt="Kaora"
            class="h-12 w-auto animate-pulse opacity-90"
          >
          <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)] sm:text-3xl">
            Vérification du paiement…
          </h1>
          <p class="max-w-md text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
            Nous vérifions votre souscription. Merci de ne pas fermer cette page.
          </p>
          <span class="h-6 w-6 animate-spin rounded-full border-2 border-[rgba(28,25,23,0.15)] border-t-[color:var(--color-brand-accent)]" />
        </div>

        <template v-else>
          <header class="grid gap-2 text-center">
            <div class="flex items-center justify-center gap-3">
              <span
                v-if="statusLabel === 'confirmed'"
                class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(34,197,94,0.12)] text-[color:rgb(22,163,74)]"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:check"
                  size="18"
                />
              </span>
              <span
                v-else-if="statusLabel === 'failed'"
                class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(239,68,68,0.12)] text-[color:rgb(220,38,38)]"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:x"
                  size="18"
                />
              </span>
              <span
                v-else-if="statusLabel === 'timeout'"
                class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(34,197,94,0.08)] text-[color:rgb(22,163,74)]"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:mail-check"
                  size="18"
                />
              </span>
            </div>

            <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Programme
            </p>
            <h1 class="font-serif text-3xl italic text-[color:var(--color-brand-primary)] sm:text-4xl">
              {{ title }}
            </h1>
            <p class="mx-auto max-w-xl text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
              {{ subtitle }}
            </p>
          </header>

          <div
            v-if="poller.state.errorMessage"
            class="rounded-xl border border-[rgba(239,68,68,0.18)] bg-[rgba(254,242,242,0.55)] p-4 text-sm text-[color:var(--color-brand-primary)]"
          >
            {{ poller.state.errorMessage }}
          </div>

          <dl
            v-if="storedMeta"
            class="grid gap-3 rounded-3xl bg-[color:var(--color-surface-highlight)] p-5"
          >
            <div class="grid gap-1">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Programme
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ storedMeta.programName }}
              </dd>
            </div>

            <div class="grid gap-1">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Détails
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ storedMeta.totalSessions }} séances
                <span class="mx-2 text-[color:var(--color-brand-muted)]">&middot;</span>
                {{ storedMeta.sessionDurationMinutes }} min
                <span class="mx-2 text-[color:var(--color-brand-muted)]">&middot;</span>
                {{ storedMeta.validityMonths }} mois de validité
              </dd>
            </div>

            <div class="flex items-center justify-between gap-3">
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Montant
              </dt>
              <dd class="font-serif text-base italic text-[color:var(--color-brand-primary)]">
                {{ formattedPrice }}
                <span
                  v-if="paymentModeLabel"
                  class="ml-2 text-xs font-normal not-italic text-[color:var(--color-brand-muted)]"
                >
                  ({{ paymentModeLabel }})
                </span>
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <!-- Confirmed: CTA principal = Tableau de bord -->
            <ULink
              v-if="statusLabel === 'confirmed'"
              to="/client/dashboard"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating focus-visible:text-white"
            >
              Retour au tableau de bord
            </ULink>

            <!-- Timeout: CTA principal vers dashboard -->
            <ULink
              v-else-if="statusLabel === 'timeout'"
              to="/client/dashboard"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating focus-visible:text-white"
            >
              Retour au tableau de bord
            </ULink>

            <!-- Failed: CTA principal = Retour au tableau de bord -->
            <ULink
              v-else-if="statusLabel === 'failed'"
              to="/client/dashboard"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:text-white hover:shadow-floating focus-visible:text-white"
            >
              Retour au tableau de bord
            </ULink>

            <!-- Retry button (timeout or network error) -->
            <button
              v-if="statusLabel === 'timeout' || poller.state.errorMessage"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
              @click="retryPolling"
            >
              Réessayer la vérification
            </button>
          </div>

          <p class="text-center text-xs text-[color:var(--color-brand-muted)]">
            Identifiant Stripe : <span class="font-mono">{{ sessionId }}</span>
          </p>
        </template>
      </div>
    </div>
  </section>
</template>
