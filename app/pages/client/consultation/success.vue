<script setup lang="ts">
import SystemAlert from '../../../components/atoms/SystemAlert.vue'
import { useConsultationCheckoutStatus } from '../../../features/consultation/useConsultationCheckoutStatus'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Consultation'
})

type StoredCheckoutMeta = {
  providerId: string
  pricePlanLabel?: string
  durationMinutes?: number
  slotStartAt: string
  slotEndAt: string
  timeZone: string
  amountCents: number
  currency: 'EUR'
}

function buildCheckoutStorageKey(sessionId: string): string {
  return `kaora_consultation_checkout:${sessionId}`
}

function readStoredMeta(sessionId: string): StoredCheckoutMeta | null {
  if (!import.meta.client) return null
  try {
    const raw = window.sessionStorage.getItem(buildCheckoutStorageKey(sessionId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<StoredCheckoutMeta>
    if (!parsed.providerId || !parsed.slotStartAt || !parsed.slotEndAt) return null
    if (!parsed.timeZone) return null
    if (typeof parsed.amountCents !== 'number') return null
    if (parsed.currency !== 'EUR') return null
    return parsed as StoredCheckoutMeta
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

const storedMeta = ref<StoredCheckoutMeta | null>(null)

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
  if (status === 'confirmed') return 'Consultation confirmée'
  if (status === 'failed') return 'Paiement non finalisé'
  if (status === 'timeout') return 'Vérification en cours'
  return 'Vérification du paiement…'
})

const subtitle = computed(() => {
  const status = statusLabel.value
  if (status === 'confirmed') return 'Votre rendez-vous est réservé. Vous allez recevoir une confirmation.'
  if (status === 'failed') return 'Le paiement n’a pas été confirmé. Votre rendez-vous n’a pas été réservé.'
  if (status === 'timeout') return 'Le webhook Stripe peut prendre quelques minutes. Vous pouvez réessayer.'
  return 'Nous attendons la confirmation de Stripe. Cela peut prendre quelques secondes.'
})

const formattedWhen = computed(() => {
  const meta = storedMeta.value
  if (!meta) return null
  const dateFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: meta.timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  const timeFormatter = new Intl.DateTimeFormat('fr-FR', {
    timeZone: meta.timeZone,
    hour: '2-digit',
    minute: '2-digit'
  })
  const start = new Date(meta.slotStartAt)
  const end = new Date(meta.slotEndAt)
  return {
    date: dateFormatter.format(start),
    time: `${timeFormatter.format(start)} – ${timeFormatter.format(end)}`,
    timeZone: meta.timeZone
  }
})

const formattedPrice = computed(() => {
  const meta = storedMeta.value
  if (!meta) return null
  const formatter = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: meta.currency })
  return formatter.format(meta.amountCents / 100)
})

const showLoader = computed(() => poller.state.status === 'pending_confirmation' && poller.state.isPolling)

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
        class="grid gap-6 rounded-blob-c border border-[rgba(231,229,228,0.85)] bg-white/75 p-10 shadow-floating backdrop-blur"
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
            Nous sécurisons votre créneau. Merci de ne pas fermer cette page.
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
                class="grid h-10 w-10 place-items-center rounded-full bg-[rgba(212,184,160,0.25)] text-[color:var(--color-brand-primary)]"
                aria-hidden="true"
              >
                <Icon
                  name="lucide:clock"
                  size="18"
                />
              </span>
            </div>

            <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Consultation
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
            class="rounded-blob-d border border-[rgba(239,68,68,0.18)] bg-[rgba(254,242,242,0.55)] p-4 text-sm text-[color:var(--color-brand-primary)]"
          >
            {{ poller.state.errorMessage }}
          </div>

          <dl
            v-if="formattedWhen || formattedPrice"
            class="grid gap-3 rounded-blob-a bg-[color:var(--color-surface-highlight)] p-5"
          >
            <div
              v-if="formattedWhen"
              class="grid gap-1"
            >
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Créneau
              </dt>
              <dd class="text-sm text-[color:var(--color-brand-primary)]">
                {{ formattedWhen.date }}
                <span class="mx-2 text-[color:var(--color-brand-muted)]">•</span>
                {{ formattedWhen.time }}
                <span class="mx-2 text-[color:var(--color-brand-muted)]">•</span>
                {{ formattedWhen.timeZone }}
              </dd>
            </div>

            <div
              v-if="formattedPrice"
              class="flex items-center justify-between gap-3"
            >
              <dt class="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-muted)]">
                Montant
              </dt>
              <dd class="font-serif text-base italic text-[color:var(--color-brand-primary)]">
                {{ formattedPrice }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-center">
            <NuxtLink
              v-if="statusLabel === 'confirmed'"
              to="/client/consultation"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating"
            >
              Voir mes rendez-vous
            </NuxtLink>

            <NuxtLink
              v-else
              to="/client/consultation/choose-slot"
              class="inline-flex items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-6 py-3 text-sm font-bold text-white shadow-soft transition-base hover:shadow-floating"
            >
              Revenir au choix du créneau
            </NuxtLink>

            <button
              v-if="statusLabel === 'timeout' || poller.state.errorMessage"
              type="button"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
              @click="retryPolling"
            >
              Réessayer
            </button>

            <NuxtLink
              to="/client/dashboard"
              class="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 bg-white/70 px-6 py-3 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base hover:bg-white"
            >
              Retour au tableau de bord
            </NuxtLink>
          </div>

          <p class="text-center text-xs text-[color:var(--color-brand-muted)]">
            Identifiant Stripe : <span class="font-mono">{{ sessionId }}</span>
          </p>
        </template>
      </div>
    </div>
  </section>
</template>
