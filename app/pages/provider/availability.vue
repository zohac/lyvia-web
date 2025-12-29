<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import ConfirmActionModal from '../../components/molecules/ConfirmActionModal.vue'
import { ApiFetchError } from '../../services/api/api-error'
import { apiFetch } from '../../services/api/apiFetch'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Disponibilités'
})

type AvailabilityRule = {
  id: string
  weekday: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  appointmentType: 'discovery' | 'consultation'
  isActive: boolean
}

type AvailabilityBlock = {
  id: string
  startAt: string
  endAt: string
  reason: unknown | null
  blockType: 'all' | 'discovery' | 'consultation'
}

type ListAvailabilityRulesResponse = { rules: AvailabilityRule[] }
type ListAvailabilityBlocksResponse = { blocks: AvailabilityBlock[] }

const errorMessage = ref<string | null>(null)
const actionErrorMessage = ref<string | null>(null)
const noticeMessage = ref<string | null>(null)

const createRuleModalOpen = ref(false)
const createRuleError = ref<string | null>(null)
const isCreatingRule = ref(false)
const createRuleApplyToAllTypes = ref(false)
const createRuleDurationByType = reactive<{ discovery: number, consultation: number }>({
  discovery: 30,
  consultation: 60
})
const createRuleDurationErrors = reactive<{ discovery: string | null, consultation: string | null }>({
  discovery: null,
  consultation: null
})

const updateRuleModalOpen = ref(false)
const updateRuleError = ref<string | null>(null)
const isUpdatingRule = ref(false)
const updatingRuleId = ref<string | null>(null)
const ruleBeingEdited = ref<AvailabilityRule | null>(null)

const deleteRuleModalOpen = ref(false)
const deleteRuleError = ref<string | null>(null)
const deletingRuleId = ref<string | null>(null)
const ruleBeingDeleted = ref<AvailabilityRule | null>(null)

type CopyRulesDirection = 'discovery-to-consultation' | 'consultation-to-discovery'

const copyRulesModalOpen = ref(false)
const copyRulesError = ref<string | null>(null)
const isCopyingRules = ref(false)
const copyRulesDirection = ref<CopyRulesDirection>('discovery-to-consultation')
const copyRulesAdaptDurations = ref(false)

watch(updateRuleModalOpen, (open) => {
  if (!open) {
    ruleBeingEdited.value = null
  }
})

watch(deleteRuleModalOpen, (open) => {
  if (!open) {
    ruleBeingDeleted.value = null
    deleteRuleError.value = null
  }
})

type AvailabilityRuleForm = {
  appointmentType: 'discovery' | 'consultation'
  weekday: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

const createRuleForm = reactive<AvailabilityRuleForm>({
  appointmentType: 'discovery',
  weekday: 1,
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMinutes: 30,
  isActive: true
})

const createRuleFieldErrors = reactive<Record<keyof AvailabilityRuleForm, string | null>>({
  appointmentType: null,
  weekday: null,
  startTime: null,
  endTime: null,
  slotDurationMinutes: null,
  isActive: null
})

const updateRuleForm = reactive<AvailabilityRuleForm>({
  appointmentType: 'discovery',
  weekday: 1,
  startTime: '09:00',
  endTime: '17:00',
  slotDurationMinutes: 30,
  isActive: true
})

const updateRuleFieldErrors = reactive<Record<keyof AvailabilityRuleForm, string | null>>({
  appointmentType: null,
  weekday: null,
  startTime: null,
  endTime: null,
  slotDurationMinutes: null,
  isActive: null
})

const { data, pending, refresh } = await useAsyncData(
  'provider-availability-skeleton',
  async () => {
    errorMessage.value = null
    actionErrorMessage.value = null
    noticeMessage.value = null
    try {
      const [rulesResponse, blocksResponse] = await Promise.all([
        apiFetch<ListAvailabilityRulesResponse>('/provider/availability/rules', {
          method: 'GET'
        }),
        apiFetch<ListAvailabilityBlocksResponse>('/provider/availability/blocks', {
          method: 'GET'
        })
      ])

      return {
        rules: rulesResponse.rules,
        blocks: blocksResponse.blocks
      }
    } catch (err: unknown) {
      if (err instanceof ApiFetchError) {
        errorMessage.value = 'Impossible de charger vos disponibilités. Veuillez réessayer.'
        return { rules: [], blocks: [] }
      }

      errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
      return { rules: [], blocks: [] }
    }
  },
  { default: () => ({ rules: [], blocks: [] }) }
)

const rules = computed(() => data.value.rules)
const blocks = computed(() => data.value.blocks)

const hasRules = computed(() => rules.value.length > 0)
const hasBlocks = computed(() => blocks.value.length > 0)

function weekdayLabel(weekday: number): string {
  const labels: Record<number, string> = {
    1: 'Lundi',
    2: 'Mardi',
    3: 'Mercredi',
    4: 'Jeudi',
    5: 'Vendredi',
    6: 'Samedi',
    7: 'Dimanche'
  }
  return labels[weekday] ?? `Jour ${weekday}`
}

function appointmentTypeLabel(type: AvailabilityRule['appointmentType']): string {
  return type === 'consultation' ? 'Consultation' : 'Discovery'
}

function blockTypeLabel(block: AvailabilityBlock): string {
  switch (block.blockType) {
    case 'all':
      return 'Tout'
    case 'consultation':
      return 'Consultation'
    case 'discovery':
      return 'Discovery'
    default:
      return block.blockType
  }
}

function formatDateTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: 'Europe/Paris',
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(date)
}

const groupedRules = computed(() => {
  const byDay = new Map<number, AvailabilityRule[]>()
  for (const rule of rules.value) {
    const current = byDay.get(rule.weekday) ?? []
    current.push(rule)
    byDay.set(rule.weekday, current)
  }

  const sortedDays = [...byDay.entries()].sort((a, b) => a[0] - b[0])
  const order: AvailabilityRule['appointmentType'][] = ['consultation', 'discovery']

  return sortedDays.map(([weekday, dayRules]) => {
    const byType = new Map<AvailabilityRule['appointmentType'], AvailabilityRule[]>()
    for (const rule of dayRules) {
      const current = byType.get(rule.appointmentType) ?? []
      current.push(rule)
      byType.set(rule.appointmentType, current)
    }

    const groups = order
      .filter(type => (byType.get(type)?.length ?? 0) > 0)
      .map(type => ({
        type,
        rules: (byType.get(type) ?? []).toSorted((a, b) => normalizeRuleTime(a.startTime).localeCompare(normalizeRuleTime(b.startTime)))
      }))

    return { weekday, groups }
  })
})

const upcomingBlocks = computed(() => {
  return blocks.value
    .toSorted((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime())
    .slice(0, 6)
})

function resetCreateRuleErrors() {
  createRuleError.value = null
  createRuleFieldErrors.appointmentType = null
  createRuleFieldErrors.weekday = null
  createRuleFieldErrors.startTime = null
  createRuleFieldErrors.endTime = null
  createRuleFieldErrors.slotDurationMinutes = null
  createRuleFieldErrors.isActive = null
  createRuleDurationErrors.discovery = null
  createRuleDurationErrors.consultation = null
}

function resetUpdateRuleErrors() {
  updateRuleError.value = null
  updateRuleFieldErrors.appointmentType = null
  updateRuleFieldErrors.weekday = null
  updateRuleFieldErrors.startTime = null
  updateRuleFieldErrors.endTime = null
  updateRuleFieldErrors.slotDurationMinutes = null
  updateRuleFieldErrors.isActive = null
}

function openCreateRuleModal() {
  resetCreateRuleErrors()
  createRuleApplyToAllTypes.value = false
  createRuleDurationByType.discovery = 30
  createRuleDurationByType.consultation = 60
  createRuleModalOpen.value = true
}

function openCopyRulesModal(direction?: CopyRulesDirection) {
  copyRulesError.value = null
  copyRulesAdaptDurations.value = false
  if (direction) copyRulesDirection.value = direction
  copyRulesModalOpen.value = true
}

function parseTimeToMinutes(value: string): number | null {
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim())
  if (!match) return null
  const hours = Number(match[1])
  const minutes = Number(match[2])
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null
  if (hours < 0 || hours > 23) return null
  if (minutes < 0 || minutes > 59) return null
  return hours * 60 + minutes
}

function validateRuleForm(
  form: AvailabilityRuleForm,
  fieldErrors: Record<keyof AvailabilityRuleForm, string | null>,
  options: { validateDuration?: boolean } = {}
): boolean {
  fieldErrors.appointmentType = null
  fieldErrors.weekday = null
  fieldErrors.startTime = null
  fieldErrors.endTime = null
  fieldErrors.slotDurationMinutes = null
  fieldErrors.isActive = null

  if (form.weekday < 1 || form.weekday > 7) {
    fieldErrors.weekday = 'Choisissez un jour entre 1 et 7.'
  }

  const startMinutes = parseTimeToMinutes(form.startTime)
  const endMinutes = parseTimeToMinutes(form.endTime)
  if (startMinutes === null) fieldErrors.startTime = 'Format attendu : HH:mm.'
  if (endMinutes === null) fieldErrors.endTime = 'Format attendu : HH:mm.'
  if (startMinutes !== null && endMinutes !== null && startMinutes >= endMinutes) {
    fieldErrors.endTime = 'L’heure de fin doit être après l’heure de début.'
  }

  const validateDuration = options.validateDuration ?? true
  if (validateDuration) {
    if (!Number.isFinite(form.slotDurationMinutes) || form.slotDurationMinutes <= 0) {
      fieldErrors.slotDurationMinutes = 'La durée doit être > 0.'
    }
  }

  return (
    !fieldErrors.appointmentType
    && !fieldErrors.weekday
    && !fieldErrors.startTime
    && !fieldErrors.endTime
    && (!validateDuration || !fieldErrors.slotDurationMinutes)
    && !fieldErrors.isActive
  )
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function applyBackendValidationErrors(
  details: unknown,
  fieldErrors: Record<keyof AvailabilityRuleForm, string | null>
) {
  if (!isRecord(details)) return
  const raw = details.validationErrors
  if (!Array.isArray(raw)) return

  for (const item of raw) {
    if (!isRecord(item)) continue
    const property = item.property
    if (typeof property !== 'string') continue
    const constraints = item.constraints
    const message = isRecord(constraints) ? Object.values(constraints).filter(v => typeof v === 'string').join(' ') : ''

    if (property === 'appointmentType') fieldErrors.appointmentType = message || 'Type invalide.'
    if (property === 'weekday') fieldErrors.weekday = message || 'Jour invalide.'
    if (property === 'startTime') fieldErrors.startTime = message || 'Heure de début invalide.'
    if (property === 'endTime') fieldErrors.endTime = message || 'Heure de fin invalide.'
    if (property === 'slotDurationMinutes') fieldErrors.slotDurationMinutes = message || 'Durée invalide.'
    if (property === 'isActive') fieldErrors.isActive = message || 'Valeur invalide.'
  }
}

function normalizeRuleTime(value: string): string {
  const trimmed = value.trim()
  if (/^\d{2}:\d{2}:\d{2}$/.test(trimmed)) return trimmed.slice(0, 5)
  return trimmed
}

function getCopySourceAndTarget(direction: CopyRulesDirection): {
  source: AvailabilityRule['appointmentType']
  target: AvailabilityRule['appointmentType']
} {
  if (direction === 'consultation-to-discovery') {
    return { source: 'consultation', target: 'discovery' }
  }
  return { source: 'discovery', target: 'consultation' }
}

const copyRulesSummary = computed(() => {
  const { source, target } = getCopySourceAndTarget(copyRulesDirection.value)
  const sourceRules = rules.value.filter(rule => rule.appointmentType === source)
  const targetRules = rules.value.filter(rule => rule.appointmentType === target)

  const targetKeys = new Set(
    targetRules.map(rule => `${rule.weekday}|${normalizeRuleTime(rule.startTime)}|${normalizeRuleTime(rule.endTime)}`)
  )
  const duplicates = sourceRules.filter(rule => targetKeys.has(`${rule.weekday}|${normalizeRuleTime(rule.startTime)}|${normalizeRuleTime(rule.endTime)}`))

  return {
    sourceType: source,
    targetType: target,
    sourceCount: sourceRules.length,
    targetCount: targetRules.length,
    duplicatesCount: duplicates.length
  }
})

async function submitCreateRule() {
  noticeMessage.value = null
  actionErrorMessage.value = null
  createRuleError.value = null

  if (isCreatingRule.value) return
  resetCreateRuleErrors()
  if (!validateRuleForm(createRuleForm, createRuleFieldErrors, { validateDuration: !createRuleApplyToAllTypes.value })) {
    return
  }

  if (createRuleApplyToAllTypes.value) {
    if (!Number.isFinite(createRuleDurationByType.discovery) || createRuleDurationByType.discovery <= 0) {
      createRuleDurationErrors.discovery = 'La durée doit être > 0.'
    }
    if (!Number.isFinite(createRuleDurationByType.consultation) || createRuleDurationByType.consultation <= 0) {
      createRuleDurationErrors.consultation = 'La durée doit être > 0.'
    }
    if (createRuleDurationErrors.discovery || createRuleDurationErrors.consultation) {
      return
    }
  }

  isCreatingRule.value = true
  try {
    if (!createRuleApplyToAllTypes.value) {
      await apiFetch<{ ruleId: string }>('/provider/availability/rules', {
        method: 'POST',
        body: {
          appointmentType: createRuleForm.appointmentType,
          weekday: createRuleForm.weekday,
          startTime: createRuleForm.startTime,
          endTime: createRuleForm.endTime,
          slotDurationMinutes: createRuleForm.slotDurationMinutes,
          isActive: createRuleForm.isActive
        }
      })

      await refresh()
      noticeMessage.value = 'Règle ajoutée.'
      createRuleModalOpen.value = false
      return
    }

    const types: AvailabilityRule['appointmentType'][] = ['discovery', 'consultation']
    const results: Record<AvailabilityRule['appointmentType'], 'created' | 'overlap' | 'failed'> = {
      discovery: 'failed',
      consultation: 'failed'
    }

    for (const type of types) {
      try {
        await apiFetch<{ ruleId: string }>('/provider/availability/rules', {
          method: 'POST',
          body: {
            appointmentType: type,
            weekday: createRuleForm.weekday,
            startTime: createRuleForm.startTime,
            endTime: createRuleForm.endTime,
            slotDurationMinutes: createRuleDurationByType[type],
            isActive: createRuleForm.isActive
          }
        })
        results[type] = 'created'
      } catch (err: unknown) {
        if (err instanceof ApiFetchError && err.apiError.code === 'RULE_OVERLAP') {
          results[type] = 'overlap'
          continue
        }

        if (err instanceof ApiFetchError && err.apiError.code === 'VALIDATION_ERROR') {
          applyBackendValidationErrors(err.apiError.details, createRuleFieldErrors)
          if (createRuleFieldErrors.slotDurationMinutes) {
            createRuleDurationErrors.discovery = createRuleFieldErrors.slotDurationMinutes
            createRuleDurationErrors.consultation = createRuleFieldErrors.slotDurationMinutes
          }
          createRuleError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
          return
        }

        results[type] = 'failed'
      }
    }

    await refresh()
    createRuleModalOpen.value = false

    const created = types.filter(type => results[type] === 'created').length
    const overlaps = types.filter(type => results[type] === 'overlap').length
    const failed = types.filter(type => results[type] === 'failed').length

    const parts: string[] = []
    parts.push(`${created} créé(e)(s)`)
    if (overlaps) parts.push(`${overlaps} chevauchement(s) ignoré(s)`)
    if (failed) parts.push(`${failed} en échec`)

    noticeMessage.value = `Règle appliquée aux types : ${parts.join(', ')}.`
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'RULE_OVERLAP') {
        createRuleError.value = 'Cette règle chevauche une règle existante pour ce jour. Ajustez l’horaire ou la durée.'
        return
      }

      if (err.apiError.code === 'VALIDATION_ERROR') {
        applyBackendValidationErrors(err.apiError.details, createRuleFieldErrors)
        createRuleError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
        return
      }

      createRuleError.value = 'Impossible de créer la règle. Veuillez réessayer.'
      return
    }

    createRuleError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isCreatingRule.value = false
  }
}

function openUpdateRuleModal(rule: AvailabilityRule) {
  resetUpdateRuleErrors()
  ruleBeingEdited.value = rule
  updateRuleForm.appointmentType = rule.appointmentType
  updateRuleForm.weekday = rule.weekday
  updateRuleForm.startTime = normalizeRuleTime(rule.startTime)
  updateRuleForm.endTime = normalizeRuleTime(rule.endTime)
  updateRuleForm.slotDurationMinutes = rule.slotDurationMinutes
  updateRuleForm.isActive = rule.isActive
  updateRuleModalOpen.value = true
}

async function submitUpdateRule() {
  noticeMessage.value = null
  actionErrorMessage.value = null
  resetUpdateRuleErrors()

  if (isUpdatingRule.value) return
  if (!ruleBeingEdited.value) return
  if (!validateRuleForm(updateRuleForm, updateRuleFieldErrors)) return

  isUpdatingRule.value = true
  updatingRuleId.value = ruleBeingEdited.value.id
  try {
    await apiFetch<{ ruleId: string }>(`/provider/availability/rules/${ruleBeingEdited.value.id}`, {
      method: 'PATCH',
      body: {
        appointmentType: updateRuleForm.appointmentType,
        weekday: updateRuleForm.weekday,
        startTime: updateRuleForm.startTime,
        endTime: updateRuleForm.endTime,
        slotDurationMinutes: updateRuleForm.slotDurationMinutes,
        isActive: updateRuleForm.isActive
      }
    })

    await refresh()
    noticeMessage.value = 'Règle mise à jour.'
    updateRuleModalOpen.value = false
    ruleBeingEdited.value = null
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'RULE_OVERLAP') {
        updateRuleError.value = 'Cette règle chevauche une règle existante pour ce jour. Ajustez l’horaire ou la durée.'
        return
      }

      if (err.apiError.code === 'VALIDATION_ERROR') {
        applyBackendValidationErrors(err.apiError.details, updateRuleFieldErrors)
        updateRuleError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
        return
      }

      updateRuleError.value = 'Impossible de modifier la règle. Veuillez réessayer.'
      return
    }

    updateRuleError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isUpdatingRule.value = false
    updatingRuleId.value = null
  }
}

async function setRuleActive(rule: AvailabilityRule, nextIsActive: boolean) {
  noticeMessage.value = null
  actionErrorMessage.value = null
  if (updatingRuleId.value) return

  updatingRuleId.value = rule.id
  try {
    await apiFetch<{ ruleId: string }>(`/provider/availability/rules/${rule.id}`, {
      method: 'PATCH',
      body: { isActive: nextIsActive }
    })

    await refresh()
    noticeMessage.value = nextIsActive ? 'Règle activée.' : 'Règle désactivée.'
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      if (err.apiError.code === 'RULE_OVERLAP') {
        actionErrorMessage.value = 'Impossible d’activer cette règle : elle chevauche une autre règle active.'
        return
      }

      actionErrorMessage.value = 'Action impossible. Veuillez réessayer.'
      return
    }

    actionErrorMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    updatingRuleId.value = null
  }
}

function openDeleteRuleModal(rule: AvailabilityRule) {
  deleteRuleError.value = null
  ruleBeingDeleted.value = rule
  deleteRuleModalOpen.value = true
}

async function confirmDeleteRule() {
  noticeMessage.value = null
  actionErrorMessage.value = null
  deleteRuleError.value = null

  const rule = ruleBeingDeleted.value
  if (!rule) return
  if (updatingRuleId.value || deletingRuleId.value) return

  deletingRuleId.value = rule.id
  try {
    await apiFetch<{ ruleId: string }>(`/provider/availability/rules/${rule.id}`, {
      method: 'DELETE'
    })

    await refresh()
    noticeMessage.value = 'Règle supprimée.'
    deleteRuleModalOpen.value = false
    ruleBeingDeleted.value = null
  } catch (err: unknown) {
    if (err instanceof ApiFetchError) {
      deleteRuleError.value = 'Impossible de supprimer la règle. Veuillez réessayer.'
      return
    }

    deleteRuleError.value = 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    deletingRuleId.value = null
  }
}

async function confirmCopyRules() {
  noticeMessage.value = null
  actionErrorMessage.value = null
  copyRulesError.value = null

  if (isCopyingRules.value) return
  if (pending.value) return

  const { source, target } = getCopySourceAndTarget(copyRulesDirection.value)
  const sourceRules = rules.value.filter(rule => rule.appointmentType === source)

  if (sourceRules.length === 0) {
    copyRulesError.value = 'Aucune règle à copier dans le type source.'
    return
  }

  const recommendedDurations: Record<AvailabilityRule['appointmentType'], number> = {
    discovery: 30,
    consultation: 60
  }

  const targetKeys = new Set(
    rules.value
      .filter(rule => rule.appointmentType === target)
      .map(rule => `${rule.weekday}|${normalizeRuleTime(rule.startTime)}|${normalizeRuleTime(rule.endTime)}`)
  )

  const payloads = sourceRules.map((rule) => {
    const startTime = normalizeRuleTime(rule.startTime)
    const endTime = normalizeRuleTime(rule.endTime)
    return {
      key: `${rule.weekday}|${startTime}|${endTime}`,
      body: {
        appointmentType: target,
        weekday: rule.weekday,
        startTime,
        endTime,
        slotDurationMinutes: copyRulesAdaptDurations.value ? recommendedDurations[target] : rule.slotDurationMinutes,
        isActive: rule.isActive
      }
    }
  })

  isCopyingRules.value = true
  try {
    let created = 0
    let skippedAlready = 0
    let skippedOverlap = 0
    let failed = 0

    for (const item of payloads) {
      if (targetKeys.has(item.key)) {
        skippedAlready += 1
        continue
      }

      try {
        await apiFetch<{ ruleId: string }>('/provider/availability/rules', {
          method: 'POST',
          body: item.body
        })
        created += 1
      } catch (err: unknown) {
        if (err instanceof ApiFetchError && err.apiError.code === 'RULE_OVERLAP') {
          skippedOverlap += 1
          continue
        }
        failed += 1
      }
    }

    await refresh()
    copyRulesModalOpen.value = false

    const parts: string[] = []
    parts.push(`${created} copiée(s)`)
    if (skippedAlready) parts.push(`${skippedAlready} déjà présente(s)`)
    if (skippedOverlap) parts.push(`${skippedOverlap} chevauchement(s) ignoré(s)`)
    if (failed) parts.push(`${failed} en échec`)

    noticeMessage.value = `Copie terminée (${appointmentTypeLabel(source)} → ${appointmentTypeLabel(target)}) : ${parts.join(', ')}.`
  } finally {
    isCopyingRules.value = false
  }
}
</script>

<template>
  <div class="grid gap-10">
    <UModal
      v-model:open="createRuleModalOpen"
      :dismissible="!isCreatingRule"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Ajouter une règle"
      description="Créez une règle récurrente (Europe/Paris)."
    >
      <template #body>
        <SystemAlert
          v-if="createRuleError"
          class="mb-5"
          variant="error"
          title="Création impossible"
          :description="createRuleError"
        />

        <form
          class="grid gap-6"
          @submit.prevent="submitCreateRule"
        >
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Type
            </label>
            <select
              v-model="createRuleForm.appointmentType"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule || createRuleApplyToAllTypes"
            >
              <option value="discovery">
                Discovery
              </option>
              <option value="consultation">
                Consultation
              </option>
            </select>
            <p
              v-if="createRuleFieldErrors.appointmentType"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.appointmentType }}
            </p>
            <p
              v-if="createRuleApplyToAllTypes"
              class="text-xs text-[color:var(--color-brand-secondary)]"
            >
              Les deux types (Discovery + Consultation) seront créés.
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Appliquer à tous les types
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Crée la règle pour Discovery et Consultation en une seule action.
              </span>
            </div>
            <USwitch
              v-model="createRuleApplyToAllTypes"
              size="lg"
              color="primary"
              :disabled="isCreatingRule"
              class="self-start md:self-auto"
            />
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Jour
            </label>
            <select
              v-model.number="createRuleForm.weekday"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule"
            >
              <option :value="1">
                Lundi
              </option>
              <option :value="2">
                Mardi
              </option>
              <option :value="3">
                Mercredi
              </option>
              <option :value="4">
                Jeudi
              </option>
              <option :value="5">
                Vendredi
              </option>
              <option :value="6">
                Samedi
              </option>
              <option :value="7">
                Dimanche
              </option>
            </select>
            <p
              v-if="createRuleFieldErrors.weekday"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.weekday }}
            </p>
          </div>

          <div class="grid gap-4 sm:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Début
              </label>
              <input
                v-model="createRuleForm.startTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingRule"
              >
              <p
                v-if="createRuleFieldErrors.startTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createRuleFieldErrors.startTime }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Fin
              </label>
              <input
                v-model="createRuleForm.endTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isCreatingRule"
              >
              <p
                v-if="createRuleFieldErrors.endTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ createRuleFieldErrors.endTime }}
              </p>
            </div>
          </div>

          <div
            v-if="!createRuleApplyToAllTypes"
            class="grid gap-2"
          >
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durée (minutes)
            </label>
            <input
              v-model.number="createRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCreatingRule"
            >
            <p
              v-if="createRuleFieldErrors.slotDurationMinutes"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ createRuleFieldErrors.slotDurationMinutes }}
            </p>
          </div>

          <div
            v-else
            class="grid gap-4"
          >
            <p class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durées par type (minutes)
            </p>
            <div class="grid gap-6 md:grid-cols-2">
              <div class="grid gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                  Discovery
                </label>
                <input
                  v-model.number="createRuleDurationByType.discovery"
                  type="number"
                  min="1"
                  class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                  :disabled="isCreatingRule"
                >
                <p
                  v-if="createRuleDurationErrors.discovery"
                  class="text-xs text-[color:var(--color-error)]"
                >
                  {{ createRuleDurationErrors.discovery }}
                </p>
              </div>

              <div class="grid gap-2">
                <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                  Consultation
                </label>
                <input
                  v-model.number="createRuleDurationByType.consultation"
                  type="number"
                  min="1"
                  class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                  :disabled="isCreatingRule"
                >
                <p
                  v-if="createRuleDurationErrors.consultation"
                  class="text-xs text-[color:var(--color-error)]"
                >
                  {{ createRuleDurationErrors.consultation }}
                </p>
              </div>
            </div>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Activer la règle
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Désactivez temporairement une règle sans la supprimer.
              </span>
            </div>
            <USwitch
              v-model="createRuleForm.isActive"
              size="lg"
              color="primary"
              :disabled="isCreatingRule"
              class="self-start md:self-auto"
            />
          </div>
          <p
            v-if="createRuleFieldErrors.isActive"
            class="text-xs text-[color:var(--color-error)]"
          >
            {{ createRuleFieldErrors.isActive }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isCreatingRule"
            @click="createRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isCreatingRule"
            @click="submitCreateRule"
          >
            Ajouter
          </UButton>
        </div>
      </template>
    </UModal>

    <UModal
      v-model:open="updateRuleModalOpen"
      :dismissible="!isUpdatingRule"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Modifier une règle"
      description="Ajustez votre règle récurrente (Europe/Paris)."
    >
      <template #body>
        <SystemAlert
          v-if="updateRuleError"
          class="mb-5"
          variant="error"
          title="Modification impossible"
          :description="updateRuleError"
        />

        <form
          class="grid gap-6"
          @submit.prevent="submitUpdateRule"
        >
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Type
            </label>
            <select
              v-model="updateRuleForm.appointmentType"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
              <option value="discovery">
                Discovery
              </option>
              <option value="consultation">
                Consultation
              </option>
            </select>
            <p
              v-if="updateRuleFieldErrors.appointmentType"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.appointmentType }}
            </p>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Jour
            </label>
            <select
              v-model.number="updateRuleForm.weekday"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
              <option
                v-for="weekday in [1, 2, 3, 4, 5, 6, 7]"
                :key="weekday"
                :value="weekday"
              >
                {{ weekdayLabel(weekday) }}
              </option>
            </select>
            <p
              v-if="updateRuleFieldErrors.weekday"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.weekday }}
            </p>
          </div>

          <div class="grid gap-6 md:grid-cols-2">
            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Début
              </label>
              <input
                v-model="updateRuleForm.startTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isUpdatingRule"
              >
              <p
                v-if="updateRuleFieldErrors.startTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ updateRuleFieldErrors.startTime }}
              </p>
            </div>

            <div class="grid gap-2">
              <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                Fin
              </label>
              <input
                v-model="updateRuleForm.endTime"
                type="time"
                step="60"
                class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
                :disabled="isUpdatingRule"
              >
              <p
                v-if="updateRuleFieldErrors.endTime"
                class="text-xs text-[color:var(--color-error)]"
              >
                {{ updateRuleFieldErrors.endTime }}
              </p>
            </div>
          </div>

          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Durée (minutes)
            </label>
            <input
              v-model.number="updateRuleForm.slotDurationMinutes"
              type="number"
              min="1"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isUpdatingRule"
            >
            <p
              v-if="updateRuleFieldErrors.slotDurationMinutes"
              class="text-xs text-[color:var(--color-error)]"
            >
              {{ updateRuleFieldErrors.slotDurationMinutes }}
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-[color:var(--color-surface-highlight)] p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Activer la règle
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Désactivez temporairement une règle sans la supprimer.
              </span>
            </div>
            <USwitch
              v-model="updateRuleForm.isActive"
              size="lg"
              color="primary"
              :disabled="isUpdatingRule"
              class="self-start md:self-auto"
            />
          </div>
          <p
            v-if="updateRuleFieldErrors.isActive"
            class="text-xs text-[color:var(--color-error)]"
          >
            {{ updateRuleFieldErrors.isActive }}
          </p>
        </form>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isUpdatingRule"
            @click="updateRuleModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isUpdatingRule"
            @click="submitUpdateRule"
          >
            Enregistrer
          </UButton>
        </div>
      </template>
    </UModal>

    <ConfirmActionModal
      v-model:open="deleteRuleModalOpen"
      title="Supprimer cette règle ?"
      :description="ruleBeingDeleted ? `${weekdayLabel(ruleBeingDeleted.weekday)} • ${normalizeRuleTime(ruleBeingDeleted.startTime)}–${normalizeRuleTime(ruleBeingDeleted.endTime)} (${ruleBeingDeleted.slotDurationMinutes} min)` : 'Cette règle sera supprimée définitivement.'"
      confirm-label="Supprimer"
      :loading="Boolean(deletingRuleId)"
      :error="deleteRuleError"
      @confirm="confirmDeleteRule"
    />

    <UModal
      v-model:open="copyRulesModalOpen"
      :dismissible="!isCopyingRules"
      :ui="{
        content:
          'rounded-blob-c border border-white/70 bg-white/80 shadow-floating backdrop-blur-md',
        header: 'px-8 pt-8 pb-4',
        body: 'px-8 pb-6',
        footer: 'px-8 pb-8 pt-6',
        title:
          'font-serif italic text-2xl leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]',
        description: 'text-sm text-[color:var(--color-brand-secondary)]'
      }"
      :close="{ class: 'rounded-full' }"
      title="Copier un planning"
      description="Dupliquez vos règles d’un type de rendez-vous à l’autre."
    >
      <template #body>
        <SystemAlert
          v-if="copyRulesError"
          class="mb-5"
          variant="error"
          title="Copie impossible"
          :description="copyRulesError"
        />

        <div class="grid gap-6">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
              Copier
            </label>
            <select
              v-model="copyRulesDirection"
              class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
              :disabled="isCopyingRules"
            >
              <option value="discovery-to-consultation">
                Discovery → Consultation
              </option>
              <option value="consultation-to-discovery">
                Consultation → Discovery
              </option>
            </select>
          </div>

          <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-5">
            <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
              Résumé
            </p>
            <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
              {{ copyRulesSummary.sourceCount }} règle(s) source • {{ copyRulesSummary.targetCount }} règle(s) déjà configurée(s) côté cible
            </p>
            <p
              v-if="copyRulesSummary.duplicatesCount"
              class="mt-2 text-xs text-[color:var(--color-brand-secondary)]"
            >
              {{ copyRulesSummary.duplicatesCount }} créneau(x) identique(s) détecté(s) et ignoré(s).
            </p>
          </div>

          <div class="flex flex-col justify-between gap-4 rounded-blob-d border border-[rgba(231,229,228,0.75)] bg-white/70 p-4 md:flex-row md:items-center">
            <div class="min-w-0">
              <span class="block font-bold text-[color:var(--color-brand-primary)]">
                Adapter aux durées recommandées
              </span>
              <span class="text-xs text-[color:var(--color-brand-secondary)]">
                Applique une durée par défaut (Discovery 30 min, Consultation 60 min).
              </span>
            </div>
            <USwitch
              v-model="copyRulesAdaptDurations"
              size="lg"
              color="primary"
              :disabled="isCopyingRules"
              class="self-start md:self-auto"
            />
          </div>
        </div>
      </template>

      <template #footer>
        <div class="flex flex-wrap justify-end gap-3">
          <UButton
            color="neutral"
            variant="ghost"
            class="rounded-full"
            :disabled="isCopyingRules"
            @click="copyRulesModalOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            class="rounded-full px-6"
            :loading="isCopyingRules"
            @click="confirmCopyRules"
          >
            Copier
          </UButton>
        </div>
      </template>
    </UModal>

    <SystemAlert
      v-if="errorMessage"
      variant="error"
      title="Disponibilités indisponibles"
      :description="errorMessage"
    />
    <SystemAlert
      v-if="actionErrorMessage"
      variant="error"
      title="Action impossible"
      :description="actionErrorMessage"
    />
    <SystemAlert
      v-if="noticeMessage"
      variant="success"
      :description="noticeMessage"
    />

    <section class="relative flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Disponibilités
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Définissez vos règles hebdomadaires, puis ajoutez des blocages ponctuels si besoin.
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="pending"
        @click="() => refresh()"
      >
        <Icon
          name="lucide:refresh-ccw"
          size="16"
          aria-hidden="true"
        />
        Actualiser
      </button>
    </section>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10">
      <section class="space-y-8 lg:col-span-8">
        <div class="rounded-blob-a border border-white/60 bg-white/70 shadow-soft backdrop-blur">
          <div class="flex flex-col gap-4 border-b border-[rgba(231,229,228,0.7)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid gap-1">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Règles récurrentes hebdomadaires
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Vos créneaux récurrents (Europe/Paris). La génération des slots est calculée côté backend.
              </p>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-3">
              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending || Boolean(errorMessage)"
                @click="openCopyRulesModal()"
              >
                <Icon
                  name="lucide:copy"
                  size="18"
                  aria-hidden="true"
                />
                Copier depuis…
              </button>

              <button
                type="button"
                class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                :disabled="pending || Boolean(errorMessage)"
                @click="openCreateRuleModal"
              >
                <Icon
                  name="lucide:plus"
                  size="18"
                  aria-hidden="true"
                />
                Ajouter une règle
              </button>
            </div>
          </div>

          <div class="px-6 py-6">
            <div
              v-if="pending"
              class="grid gap-4"
            >
              <div class="h-16 rounded-blob-d bg-[rgba(231,229,228,0.55)]" />
              <div class="h-16 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
            </div>

            <div
              v-else-if="!hasRules"
              class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]"
            >
              Aucune règle configurée pour le moment. Ajoutez vos plages horaires récurrentes pour générer des créneaux.
            </div>

            <div
              v-else
              class="grid gap-6"
            >
              <div
                v-for="group in groupedRules"
                :key="group.weekday"
                class="rounded-blob-d border border-white/60 bg-white/60 p-5 shadow-soft"
              >
                <div class="flex items-center justify-between gap-3">
                  <p class="font-semibold text-[color:var(--color-brand-primary)]">
                    {{ weekdayLabel(group.weekday) }}
                  </p>
                  <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                    {{
                      group.groups.reduce((count, typeGroup) => count + typeGroup.rules.length, 0)
                    }}
                  </span>
                </div>

                <div class="mt-4 grid gap-5">
                  <section
                    v-for="typeGroup in group.groups"
                    :key="typeGroup.type"
                    class="rounded-blob-d border border-white/55 bg-white/65 p-4 shadow-soft"
                  >
                    <div class="flex items-center justify-between gap-3">
                      <p class="text-sm font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
                        {{ appointmentTypeLabel(typeGroup.type) }}
                      </p>
                      <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                        {{ typeGroup.rules.length }}
                      </span>
                    </div>

                    <ul class="mt-4 grid gap-3">
                      <li
                        v-for="rule in typeGroup.rules"
                        :key="rule.id"
                        class="flex flex-col gap-4 rounded-blob-d bg-[color:var(--color-surface-highlight)] px-4 py-4 text-sm shadow-soft sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div class="min-w-0">
                          <span class="block font-semibold text-[color:var(--color-brand-primary)]">
                            {{ normalizeRuleTime(rule.startTime) }}–{{ normalizeRuleTime(rule.endTime) }}
                          </span>
                          <span class="mt-2 inline-flex flex-wrap items-center gap-2">
                            <span class="rounded-full bg-white px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft">
                              {{ rule.slotDurationMinutes }} min
                            </span>
                            <span
                              class="rounded-full px-3 py-1 text-xs font-bold shadow-soft"
                              :class="rule.isActive ? 'bg-[rgba(181,192,163,0.25)] text-[color:var(--color-brand-primary)]' : 'bg-[rgba(239,68,68,0.10)] text-[color:var(--color-brand-primary)]'"
                            >
                              {{ rule.isActive ? 'Active' : 'Inactive' }}
                            </span>
                          </span>
                        </div>

                        <div class="flex flex-wrap items-center justify-end gap-3">
                          <div class="flex items-center gap-2">
                            <span class="text-xs font-semibold text-[color:var(--color-brand-secondary)]">
                              {{ rule.isActive ? 'Actif' : 'Inactif' }}
                            </span>
                            <USwitch
                              :model-value="rule.isActive"
                              size="md"
                              color="primary"
                              :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                              @update:model-value="(next) => setRuleActive(rule, next)"
                            />
                          </div>

                          <button
                            type="button"
                            class="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                            @click="openUpdateRuleModal(rule)"
                          >
                            <Icon
                              name="lucide:pencil"
                              size="14"
                              aria-hidden="true"
                            />
                            Modifier
                          </button>

                          <button
                            type="button"
                            class="inline-flex h-9 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-[color:var(--color-error)] shadow-soft ring-1 ring-[rgba(239,68,68,0.20)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
                            :disabled="pending || updatingRuleId === rule.id || deletingRuleId === rule.id"
                            @click="openDeleteRuleModal(rule)"
                          >
                            <Icon
                              name="lucide:trash-2"
                              size="14"
                              aria-hidden="true"
                            />
                            Supprimer
                          </button>
                        </div>
                      </li>
                    </ul>
                  </section>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="rounded-blob-b border border-white/60 bg-white/70 shadow-soft backdrop-blur">
          <div class="flex flex-col gap-4 border-b border-[rgba(231,229,228,0.7)] px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div class="grid gap-1">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Blocages ponctuels
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Bloquez des créneaux (vacances, indisponibilités). Ces blocages sont prioritaires sur les règles.
              </p>
            </div>

            <button
              type="button"
              class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-4 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
              disabled
            >
              <Icon
                name="lucide:plus"
                size="18"
                aria-hidden="true"
              />
              Ajouter un blocage
            </button>
          </div>

          <div class="px-6 py-6">
            <div
              v-if="pending"
              class="grid gap-4"
            >
              <div class="h-20 rounded-blob-d bg-[rgba(231,229,228,0.55)]" />
              <div class="h-20 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
            </div>

            <div
              v-else-if="!hasBlocks"
              class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]"
            >
              Aucun blocage ponctuel pour le moment.
            </div>

            <ul
              v-else
              class="grid gap-4"
            >
              <li
                v-for="block in blocks.slice(0, 8)"
                :key="block.id"
                class="rounded-blob-d border border-white/60 bg-white/60 p-5 shadow-soft"
              >
                <div class="flex flex-wrap items-start justify-between gap-3">
                  <div class="min-w-0">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">
                      {{ formatDateTime(block.startAt) }} → {{ formatDateTime(block.endAt) }}
                    </p>
                    <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                      Type : {{ blockTypeLabel(block) }}
                    </p>
                  </div>

                  <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
                    Blocage
                  </span>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <aside class="space-y-8 lg:col-span-4">
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-6 shadow-soft backdrop-blur">
          <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
            À venir
          </h2>
          <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
            Les prochains blocages, pour garder une vue d’ensemble.
          </p>

          <div
            v-if="pending"
            class="mt-6 grid gap-3"
          >
            <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.55)]" />
            <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.35)]" />
          </div>

          <div
            v-else-if="upcomingBlocks.length === 0"
            class="mt-6 text-sm text-[color:var(--color-brand-secondary)]"
          >
            Aucun blocage à venir.
          </div>

          <ul
            v-else
            class="mt-6 grid gap-3"
          >
            <li
              v-for="block in upcomingBlocks"
              :key="block.id"
              class="rounded-blob-a border border-white/60 bg-white/70 px-4 py-3 shadow-soft"
            >
              <p class="text-sm font-semibold text-[color:var(--color-brand-primary)]">
                {{ formatDateTime(block.startAt) }}
              </p>
              <p class="mt-1 text-xs text-[color:var(--color-brand-secondary)]">
                {{ blockTypeLabel(block) }}
              </p>
            </li>
          </ul>
        </div>
      </aside>
    </div>
  </div>
</template>
