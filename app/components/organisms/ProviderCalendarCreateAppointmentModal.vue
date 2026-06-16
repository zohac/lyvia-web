<script setup lang="ts">
import type { CreateProviderManualAppointmentRequest, ProviderCalendarAppointmentType } from '../../features/calendar/api/calendar.contract'
import type { ConsultationPricePlan } from '../../features/consultation/api/consultation.contract'
import { minutesToHHmm, zonedLocalDateTimeToUtcIso } from '../../features/calendar/domain/zoned-datetime'
import { getAppointmentTypeConfig } from '../../features/calendar/presentation/appointment-style'
import { formatCurrency } from '../../features/calendar/presentation/appointment-pricing'

const TYPE_CARDS: { key: ProviderCalendarAppointmentType, short: string, sub: string, icon: string }[] = [
  { key: 'discovery', short: 'Découverte', sub: '15 min', icon: 'lucide:phone' },
  { key: 'consultation', short: 'Consultation', sub: 'tarifé', icon: 'lucide:video' },
  { key: 'free_followup', short: 'Suivi', sub: '30 min', icon: 'lucide:heart-handshake' }
]

type ClientOption = {
  label: string
  value: string
  stage: 'discovery' | 'lead' | 'active' | 'paused'
  hasActiveDiscovery: boolean
}

const props = withDefaults(
  defineProps<{
    open: boolean
    timeZone: string
    initialDayKey: string
    initialMinutes: number
    /**
     * Type de RDV pré-sélectionné à l'ouverture de la modale.
     */
    initialType?: ProviderCalendarAppointmentType
    /**
     * Client pré-sélectionné à l'ouverture de la modale.
     */
    initialClientProfileId?: string | null
    knownClients: ClientOption[]
    /**
     * Liste des price plans disponibles (chargés via useProviderCalendar).
     */
    consultationPricePlans?: ConsultationPricePlan[]
    loading?: boolean
    error?: string | null
    fieldErrors?: Record<string, string>
  }>(),
  {
    initialType: 'consultation',
    initialClientProfileId: null,
    consultationPricePlans: () => [],
    loading: false,
    error: null,
    fieldErrors: () => ({})
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { body: CreateProviderManualAppointmentRequest }): void
  (event: 'reset'): void
}>()

const type = ref<ProviderCalendarAppointmentType>('consultation')
const dayKey = ref('')
const time = ref('09:00')
const pricePlanId = ref<string | null>(null)
const clientProfileId = ref<string>('')
const selectedKnownClientId = ref<string>('')
const notes = ref<string>('')
const meetingLink = ref<string>('')
const freeFollowupDurationMinutes = ref<number>(30)

/** Duration options 5-120, step 5 (AC-3 spec). */
const durationOptions = Array.from({ length: 24 }, (_, i) => {
  const v = (i + 1) * 5
  return { label: `${v} min`, value: v }
})

/**
 * Filtre les clients selon le type de RDV sélectionné (modèle 4-stages).
 *
 * Discovery (replanification) :
 * - stage='lead' ou 'discovery' (discovery annulé) sans discovery actif (scheduled/completed)
 * - Exclut les clients avec un discovery complété (bilan fait) même s'ils sont lead
 *
 * Consultation / Free followup :
 * - stage='active' : client converti, accompagnement en cours
 */
const inferredClients = computed(() => {
  if (type.value === 'discovery') {
    // Clients éligibles : lead ou discovery (cancelled) sans discovery actif (scheduled/completed)
    return props.knownClients.filter(c =>
      (c.stage === 'lead' || c.stage === 'discovery') && !c.hasActiveDiscovery
    )
  }
  // Consultation + free_followup : uniquement les clientes actives
  return props.knownClients.filter(c => c.stage === 'active')
})

/**
 * Durée calculée depuis le price plan sélectionné (consultation), le sélecteur (free_followup), ou fixe (discovery).
 */
const computedDurationMinutes = computed<number>(() => {
  if (type.value === 'discovery') return 15
  if (type.value === 'free_followup') return freeFollowupDurationMinutes.value
  const selectedPlan = props.consultationPricePlans.find(plan => plan.id === pricePlanId.value)
  return selectedPlan?.durationMinutes ?? 60
})

const startAt = computed(() => {
  const iso = zonedLocalDateTimeToUtcIso({
    dayKey: dayKey.value,
    time: time.value,
    timeZone: props.timeZone
  })
  return iso
})

function typeCardStyle(key: ProviderCalendarAppointmentType, active: boolean) {
  const config = getAppointmentTypeConfig(key)
  if (active) {
    return { background: config.soft, color: config.softText, borderColor: config.fill }
  }
  return { background: 'transparent', color: 'var(--color-text-muted)', borderColor: 'var(--color-border-subtle)' }
}

function typeDotColor(key: ProviderCalendarAppointmentType) {
  return getAppointmentTypeConfig(key).fill
}

const selectedPlan = computed(() => {
  return props.consultationPricePlans.find(plan => plan.id === pricePlanId.value) ?? null
})

const activePlans = computed(() => {
  return props.consultationPricePlans
    .filter(plan => plan.isActive)
    .slice()
    .sort((a, b) => a.sortOrder - b.sortOrder)
})

const hasActivePlans = computed(() => activePlans.value.length > 0)

const tarifOptions = computed(() => {
  // Le label du plan est saisi par la praticienne et contient déjà durée + prix.
  return activePlans.value.map(plan => ({
    label: plan.label,
    value: plan.id
  }))
})

const headerCard = computed(() => TYPE_CARDS.find(card => card.key === type.value) ?? TYPE_CARDS[1]!)

const headerBadgeStyle = computed(() => {
  const config = getAppointmentTypeConfig(type.value)
  return { background: config.soft, color: config.softText, borderColor: config.fill }
})

const recapPriceLabel = computed(() => {
  if (type.value !== 'consultation') return 'Gratuit'
  if (!selectedPlan.value) return 'Sélectionnez un tarif'
  return formatCurrency(selectedPlan.value.amountCents)
})

const recapCaption = computed(() => {
  return type.value === 'consultation'
    ? 'Réglé sur le compte Stripe de la praticienne'
    : 'Rendez-vous gratuit'
})

const MEETING_LINK_REGEX = /^https?:\/\//

const localValidationError = computed(() => {
  if (!startAt.value) return 'Date ou heure invalide.'
  if (!clientProfileId.value.trim()) return 'Sélectionnez une cliente.'
  if (type.value === 'consultation' && !pricePlanId.value) {
    return 'Sélectionnez un tarif de consultation.'
  }
  if (meetingLink.value.trim() && !MEETING_LINK_REGEX.test(meetingLink.value.trim())) {
    return 'Le lien visio doit commencer par http:// ou https://.'
  }
  return null
})

watch(
  () => props.open,
  (next) => {
    if (!next) return
    emit('reset')

    dayKey.value = props.initialDayKey
    time.value = minutesToHHmm(props.initialMinutes)
    type.value = props.initialType
    notes.value = ''
    meetingLink.value = ''
    selectedKnownClientId.value = ''

    // Reset price plan selection
    pricePlanId.value = null

    // Pre-select first active plan if only one (for consultation)
    if (props.initialType === 'consultation') {
      const activePlans = props.consultationPricePlans.filter(plan => plan.isActive)
      if (activePlans.length === 1) {
        pricePlanId.value = activePlans[0]!.id
      }
    }

    // Pre-select client if provided and exists in filtered list
    if (props.initialClientProfileId) {
      const matchingClient = inferredClients.value.find(c => c.value === props.initialClientProfileId)
      if (matchingClient) {
        clientProfileId.value = matchingClient.value
        selectedKnownClientId.value = matchingClient.value
      } else {
        // Client exists but not in filtered list - still set the ID
        clientProfileId.value = props.initialClientProfileId
      }
    } else if (inferredClients.value.length === 1) {
      clientProfileId.value = inferredClients.value[0]!.value
    } else {
      clientProfileId.value = ''
    }
  }
)

watch(
  () => type.value,
  (next) => {
    // Reset price plan and meeting link when switching type
    if (next === 'discovery') {
      pricePlanId.value = null
      meetingLink.value = ''
    } else if (next === 'free_followup') {
      pricePlanId.value = null
      freeFollowupDurationMinutes.value = 30
    }

    // Reset client selection when type changes (filtered list changes)
    clientProfileId.value = ''
    selectedKnownClientId.value = ''
  }
)

function updateOpen(next: boolean) {
  if (props.loading) return
  emit('update:open', next)
}

function applyClientSelection(value: string) {
  selectedKnownClientId.value = value
  if (value) clientProfileId.value = value
}

function submit() {
  if (props.loading) return
  if (localValidationError.value) return
  if (!startAt.value) return

  const baseBody = {
    startAt: startAt.value,
    clientProfileId: clientProfileId.value.trim(),
    notes: notes.value.trim() ? notes.value.trim() : null
  }

  if (type.value === 'discovery') {
    emit('submit', {
      body: {
        ...baseBody,
        type: 'discovery'
      }
    })
  } else if (type.value === 'free_followup') {
    emit('submit', {
      body: {
        ...baseBody,
        type: 'free_followup',
        durationMinutes: freeFollowupDurationMinutes.value,
        meetingLink: meetingLink.value.trim() || null
      }
    })
  } else {
    // Consultation : envoie pricePlanId + meetingLink (pas durationMinutes)
    if (!pricePlanId.value) return

    emit('submit', {
      body: {
        ...baseBody,
        type: 'consultation',
        pricePlanId: pricePlanId.value,
        meetingLink: meetingLink.value.trim() || null
      }
    })
  }
}
</script>

<template>
  <USlideover
    :open="open"
    :dismissible="!loading"
    title="Nouveau rendez-vous"
    description="Renseignez le type, la cliente, la date et l'heure du rendez-vous."
    :ui="{
      content: 'w-full sm:max-w-[460px]',
      body: 'bg-[color:var(--color-surface-page)]',
      description: 'sr-only'
    }"
    @update:open="updateOpen"
  >
    <template #title>
      <span
        class="mb-3.5 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold not-italic"
        :style="headerBadgeStyle"
      >
        <UIcon
          :name="headerCard.icon"
          class="size-3.5"
        />
        {{ headerCard.short }}
      </span>
      <span class="block font-[family-name:var(--font-serif)] text-2xl font-bold italic text-[color:var(--color-text-primary)]">
        Nouveau rendez-vous
      </span>
    </template>

    <template #body>
      <div class="flex flex-col gap-4">
        <UAlert
          v-if="error"
          color="error"
          variant="soft"
          title="Action impossible"
          :description="error"
          icon="i-lucide-alert-circle"
        />

        <!-- Type de rendez-vous -->
        <div class="grid gap-2">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Type de rendez-vous
          </label>
          <div class="grid grid-cols-3 gap-2">
            <button
              v-for="card in TYPE_CARDS"
              :key="card.key"
              type="button"
              class="flex flex-col items-center gap-1 rounded-xl border px-2 py-3 text-center text-xs font-semibold leading-tight transition-all disabled:opacity-50"
              :style="typeCardStyle(card.key, type === card.key)"
              :disabled="loading"
              @click="type = card.key"
            >
              <span
                class="size-2 rounded-full"
                :style="{ background: typeDotColor(card.key) }"
                aria-hidden="true"
              />
              {{ card.short }}
              <span class="text-[11px] font-medium opacity-70">{{ card.sub }}</span>
            </button>
          </div>
          <p
            v-if="fieldErrors?.type"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.type }}
          </p>
        </div>

        <!-- Cliente -->
        <div class="grid gap-2">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Cliente
          </label>
          <USelect
            v-model="selectedKnownClientId"
            :items="inferredClients"
            placeholder="Choisir une cliente…"
            :disabled="loading || inferredClients.length === 0"
            @update:model-value="applyClientSelection"
          />
          <p
            v-if="inferredClients.length === 0 && type === 'discovery'"
            class="text-xs text-[color:var(--color-sunset-600)]"
          >
            Aucun client éligible pour un discovery. Seuls les leads ou clients en découverte (discovery annulé) sans discovery actif peuvent en obtenir un nouveau.
          </p>
          <p
            v-else-if="inferredClients.length === 0 && (type === 'consultation' || type === 'free_followup')"
            class="text-xs text-[color:var(--color-sunset-600)]"
          >
            Aucune cliente active éligible. Convertissez d'abord un lead après son appel découverte.
          </p>
          <p
            v-if="fieldErrors?.clientProfileId"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.clientProfileId }}
          </p>
        </div>

        <!-- Tarif de la consultation -->
        <div
          v-if="type === 'consultation'"
          class="grid gap-2"
        >
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Tarif de la consultation
          </label>
          <USelect
            :model-value="pricePlanId ?? undefined"
            :items="tarifOptions"
            placeholder="Choisir un tarif…"
            :disabled="loading || !hasActivePlans"
            @update:model-value="pricePlanId = $event"
          />
          <p
            v-if="!hasActivePlans"
            class="text-xs text-[color:var(--color-sunset-600)]"
          >
            Aucun tarif actif. <ULink
              to="/provider/scheduling"
              class="font-semibold underline"
            >Créez d'abord un tarif</ULink>.
          </p>
          <p
            v-if="fieldErrors?.pricePlanId"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.pricePlanId }}
          </p>
        </div>

        <!-- Durée (suivi gratuit uniquement) -->
        <div
          v-else-if="type === 'free_followup'"
          class="grid gap-2"
        >
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Durée
          </label>
          <USelect
            v-model="freeFollowupDurationMinutes"
            :items="durationOptions"
            :disabled="loading"
          />
        </div>

        <!-- Date / Heure de début -->
        <div class="grid grid-cols-2 gap-3">
          <div class="grid gap-2">
            <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Date
            </label>
            <UInput
              v-model="dayKey"
              type="date"
              :disabled="loading"
            />
            <p
              v-if="fieldErrors?.startAt"
              class="text-xs font-bold text-[color:var(--color-error-600)]"
            >
              {{ fieldErrors.startAt }}
            </p>
          </div>
          <div class="grid gap-2">
            <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
              Heure de début
            </label>
            <UInput
              v-model="time"
              type="time"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Lien visio (consultation + suivi gratuit) -->
        <div
          v-if="type === 'consultation' || type === 'free_followup'"
          class="grid gap-2"
        >
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Lien visio (optionnel)
          </label>
          <UInput
            v-model="meetingLink"
            type="url"
            placeholder="https://meet.google.com/xxx-xxxx-xxx"
            :disabled="loading"
          />
          <p class="text-xs leading-relaxed text-[color:var(--color-text-muted)]">
            Ajoutez-le maintenant pour éviter de l'oublier. Il sera inclus dans l'email de confirmation.
          </p>
          <p
            v-if="fieldErrors?.meetingLink"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.meetingLink }}
          </p>
        </div>

        <!-- Notes -->
        <div class="grid gap-2">
          <label class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Notes (optionnel)
          </label>
          <UTextarea
            v-model="notes"
            placeholder="Note privée (non visible par la cliente)"
            :rows="3"
            :disabled="loading"
          />
          <p
            v-if="fieldErrors?.notes"
            class="text-xs font-bold text-[color:var(--color-error-600)]"
          >
            {{ fieldErrors.notes }}
          </p>
        </div>

        <!-- Récap tarif + durée -->
        <div class="flex items-center gap-3 rounded-xl bg-[color:var(--color-surface-muted)] px-4 py-3.5">
          <span class="grid size-9 shrink-0 place-items-center rounded-[10px] bg-[color:var(--color-surface-card)] text-[color:var(--color-brand-primary)]">
            <UIcon
              name="lucide:wallet"
              class="size-4"
            />
          </span>
          <div class="leading-tight">
            <div class="text-sm font-semibold text-[color:var(--color-text-primary)]">
              {{ recapPriceLabel }}
              <span class="font-normal text-[color:var(--color-text-muted)]"> · {{ computedDurationMinutes }} min</span>
            </div>
            <div class="text-xs text-[color:var(--color-text-muted)]">
              {{ recapCaption }}
            </div>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex w-full justify-end gap-3">
        <UButton
          color="neutral"
          variant="outline"
          :disabled="loading"
          @click="updateOpen(false)"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          icon="lucide:check"
          :loading="loading"
          @click="submit"
        >
          Créer le RDV
        </UButton>
      </div>
    </template>
  </USlideover>
</template>
