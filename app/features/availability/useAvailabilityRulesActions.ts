import type { Ref } from 'vue'
import { ApiFetchError } from '../../services/api/api-error'
import type { AvailabilityAppointmentType, AvailabilityRule } from './api/availability.contract'
import { extractValidationFieldErrors, mapAvailabilityErrorToMessage } from './api/availability-error'
import { normalizeRuleTime, parseHHmmToMinutes } from './domain/time'
import {
  createAvailabilityRule,
  deleteAvailabilityRule,
  updateAvailabilityRule
} from './services/provider-availability.service'

export type AvailabilityRuleForm = {
  appointmentType: AvailabilityAppointmentType
  weekday: number
  startTime: string
  endTime: string
  slotDurationMinutes: number
  isActive: boolean
}

type DurationByType = Record<AvailabilityAppointmentType, number>

type AvailabilityRuleFieldErrors = Record<keyof AvailabilityRuleForm, string | null>

function defaultRuleForm(): AvailabilityRuleForm {
  return {
    appointmentType: 'discovery',
    weekday: 1,
    startTime: '09:00',
    endTime: '17:00',
    slotDurationMinutes: 30,
    isActive: true
  }
}

function emptyRuleFieldErrors(): AvailabilityRuleFieldErrors {
  return {
    appointmentType: null,
    weekday: null,
    startTime: null,
    endTime: null,
    slotDurationMinutes: null,
    isActive: null
  }
}

function validateRuleForm(
  form: AvailabilityRuleForm,
  fieldErrors: AvailabilityRuleFieldErrors,
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

  const startMinutes = parseHHmmToMinutes(form.startTime)
  const endMinutes = parseHHmmToMinutes(form.endTime)
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

function applyValidationFieldErrors(target: AvailabilityRuleFieldErrors, fieldErrors: Record<string, string>) {
  for (const [property, message] of Object.entries(fieldErrors)) {
    if (property === 'appointmentType') target.appointmentType = message
    if (property === 'weekday') target.weekday = message
    if (property === 'startTime') target.startTime = message
    if (property === 'endTime') target.endTime = message
    if (property === 'slotDurationMinutes') target.slotDurationMinutes = message
    if (property === 'isActive') target.isActive = message
  }
}

export function useAvailabilityRulesActions(options: {
  refresh: () => Promise<void>
  noticeMessage: Ref<string | null>
  actionErrorMessage: Ref<string | null>
}) {
  const { refresh, noticeMessage, actionErrorMessage } = options

  const createRuleModalOpen = ref(false)
  const createRuleError = ref<string | null>(null)
  const isCreatingRule = ref(false)
  const createRuleApplyToAllTypes = ref(false)
  const createRuleDurationByType = reactive<DurationByType>({ discovery: 30, consultation: 60 })
  const createRuleDurationErrors = reactive<Record<AvailabilityAppointmentType, string | null>>({ discovery: null, consultation: null })

  const updateRuleModalOpen = ref(false)
  const updateRuleError = ref<string | null>(null)
  const isUpdatingRule = ref(false)
  const updatingRuleId = ref<string | null>(null)
  const ruleBeingEdited = ref<AvailabilityRule | null>(null)

  const deleteRuleModalOpen = ref(false)
  const deleteRuleError = ref<string | null>(null)
  const deletingRuleId = ref<string | null>(null)
  const ruleBeingDeleted = ref<AvailabilityRule | null>(null)

  const createRuleForm = reactive<AvailabilityRuleForm>(defaultRuleForm())
  const createRuleFieldErrors = reactive<AvailabilityRuleFieldErrors>(emptyRuleFieldErrors())

  const updateRuleForm = reactive<AvailabilityRuleForm>(defaultRuleForm())
  const updateRuleFieldErrors = reactive<AvailabilityRuleFieldErrors>(emptyRuleFieldErrors())

  function resetCreateRuleErrors() {
    createRuleError.value = null
    Object.assign(createRuleFieldErrors, emptyRuleFieldErrors())
    createRuleDurationErrors.discovery = null
    createRuleDurationErrors.consultation = null
  }

  function resetUpdateRuleErrors() {
    updateRuleError.value = null
    Object.assign(updateRuleFieldErrors, emptyRuleFieldErrors())
  }

  watch(updateRuleModalOpen, (open) => {
    if (!open) ruleBeingEdited.value = null
  })

  watch(deleteRuleModalOpen, (open) => {
    if (!open) {
      ruleBeingDeleted.value = null
      deleteRuleError.value = null
    }
  })

  function openCreateRuleModal() {
    resetCreateRuleErrors()
    createRuleApplyToAllTypes.value = false
    createRuleDurationByType.discovery = 30
    createRuleDurationByType.consultation = 60
    Object.assign(createRuleForm, defaultRuleForm())
    createRuleModalOpen.value = true
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

  async function submitCreateRule() {
    noticeMessage.value = null
    actionErrorMessage.value = null
    resetCreateRuleErrors()
    if (isCreatingRule.value) return

    const validateDuration = !createRuleApplyToAllTypes.value
    if (!validateRuleForm(createRuleForm, createRuleFieldErrors, { validateDuration })) return

    if (createRuleApplyToAllTypes.value) {
      if (!Number.isFinite(createRuleDurationByType.discovery) || createRuleDurationByType.discovery <= 0) {
        createRuleDurationErrors.discovery = 'La durée doit être > 0.'
      }
      if (!Number.isFinite(createRuleDurationByType.consultation) || createRuleDurationByType.consultation <= 0) {
        createRuleDurationErrors.consultation = 'La durée doit être > 0.'
      }
      if (createRuleDurationErrors.discovery || createRuleDurationErrors.consultation) return
    }

    isCreatingRule.value = true
    try {
      if (!createRuleApplyToAllTypes.value) {
        await createAvailabilityRule({
          appointmentType: createRuleForm.appointmentType,
          weekday: createRuleForm.weekday,
          startTime: createRuleForm.startTime,
          endTime: createRuleForm.endTime,
          slotDurationMinutes: createRuleForm.slotDurationMinutes,
          isActive: createRuleForm.isActive
        })
        await refresh()
        noticeMessage.value = 'Règle ajoutée.'
        createRuleModalOpen.value = false
        return
      }

      const types: AvailabilityAppointmentType[] = ['discovery', 'consultation']
      const results: Record<AvailabilityAppointmentType, 'created' | 'overlap' | 'failed'> = {
        discovery: 'failed',
        consultation: 'failed'
      }

      for (const type of types) {
        try {
          await createAvailabilityRule({
            appointmentType: type,
            weekday: createRuleForm.weekday,
            startTime: createRuleForm.startTime,
            endTime: createRuleForm.endTime,
            slotDurationMinutes: createRuleDurationByType[type],
            isActive: createRuleForm.isActive
          })
          results[type] = 'created'
        } catch (err: unknown) {
          if (err instanceof ApiFetchError && err.apiError.code === 'RULE_OVERLAP') {
            results[type] = 'overlap'
            continue
          }

          if (err instanceof ApiFetchError && err.apiError.code === 'VALIDATION_ERROR') {
            applyValidationFieldErrors(createRuleFieldErrors, extractValidationFieldErrors(err.apiError.details))
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
          applyValidationFieldErrors(createRuleFieldErrors, extractValidationFieldErrors(err.apiError.details))
          createRuleError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
          return
        }
      }
      createRuleError.value = mapAvailabilityErrorToMessage(err, 'Impossible de créer la règle. Veuillez réessayer.')
    } finally {
      isCreatingRule.value = false
    }
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
      await updateAvailabilityRule(ruleBeingEdited.value.id, {
        appointmentType: updateRuleForm.appointmentType,
        weekday: updateRuleForm.weekday,
        startTime: updateRuleForm.startTime,
        endTime: updateRuleForm.endTime,
        slotDurationMinutes: updateRuleForm.slotDurationMinutes,
        isActive: updateRuleForm.isActive
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
          applyValidationFieldErrors(updateRuleFieldErrors, extractValidationFieldErrors(err.apiError.details))
          updateRuleError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
          return
        }
      }
      updateRuleError.value = mapAvailabilityErrorToMessage(err, 'Impossible de modifier la règle. Veuillez réessayer.')
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
      await updateAvailabilityRule(rule.id, { isActive: nextIsActive })
      await refresh()
      noticeMessage.value = nextIsActive ? 'Règle activée.' : 'Règle désactivée.'
    } catch (err: unknown) {
      if (err instanceof ApiFetchError && err.apiError.code === 'RULE_OVERLAP') {
        actionErrorMessage.value = 'Impossible d’activer cette règle : elle chevauche une autre règle active.'
        return
      }

      actionErrorMessage.value = mapAvailabilityErrorToMessage(err, 'Action impossible. Veuillez réessayer.')
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
      await deleteAvailabilityRule(rule.id)
      await refresh()
      noticeMessage.value = 'Règle supprimée.'
      deleteRuleModalOpen.value = false
      ruleBeingDeleted.value = null
    } catch (err: unknown) {
      deleteRuleError.value = mapAvailabilityErrorToMessage(err, 'Impossible de supprimer la règle. Veuillez réessayer.')
    } finally {
      deletingRuleId.value = null
    }
  }

  return {
    createRuleModalOpen,
    createRuleError,
    isCreatingRule,
    createRuleApplyToAllTypes,
    createRuleDurationByType,
    createRuleDurationErrors,
    createRuleForm,
    createRuleFieldErrors,
    openCreateRuleModal,
    submitCreateRule,

    updateRuleModalOpen,
    updateRuleError,
    isUpdatingRule,
    updatingRuleId,
    ruleBeingEdited,
    updateRuleForm,
    updateRuleFieldErrors,
    openUpdateRuleModal,
    submitUpdateRule,
    setRuleActive,

    deleteRuleModalOpen,
    deleteRuleError,
    deletingRuleId,
    ruleBeingDeleted,
    openDeleteRuleModal,
    confirmDeleteRule
  }
}
