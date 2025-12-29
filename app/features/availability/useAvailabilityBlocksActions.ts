import type { Ref } from 'vue'
import { ApiFetchError } from '../../services/api/api-error'
import type { AvailabilityBlock, AvailabilityBlockType } from './api/availability.contract'
import { extractValidationFieldErrors, mapAvailabilityErrorToMessage } from './api/availability-error'
import { createAvailabilityBlock, deleteAvailabilityBlock } from './services/provider-availability.service'

export type AvailabilityBlockForm = {
  startAt: string
  endAt: string
  blockType: AvailabilityBlockType
  reason: string
}

type AvailabilityBlockFieldErrors = Record<keyof AvailabilityBlockForm, string | null>

function defaultBlockForm(): AvailabilityBlockForm {
  return {
    startAt: '',
    endAt: '',
    blockType: 'all',
    reason: ''
  }
}

function emptyBlockFieldErrors(): AvailabilityBlockFieldErrors {
  return {
    startAt: null,
    endAt: null,
    blockType: null,
    reason: null
  }
}

function parseDateTimeLocal(value: string): { iso: string, timestamp: number } | null {
  if (!value) return null
  const date = new Date(value)
  const timestamp = date.getTime()
  if (!Number.isFinite(timestamp)) return null
  return { iso: date.toISOString(), timestamp }
}

function validateBlockForm(form: AvailabilityBlockForm, fieldErrors: AvailabilityBlockFieldErrors): { startIso: string, endIso: string } | null {
  fieldErrors.startAt = null
  fieldErrors.endAt = null
  fieldErrors.blockType = null
  fieldErrors.reason = null

  const start = parseDateTimeLocal(form.startAt)
  if (!start) fieldErrors.startAt = 'Choisissez une date et une heure valides.'

  const end = parseDateTimeLocal(form.endAt)
  if (!end) fieldErrors.endAt = 'Choisissez une date et une heure valides.'

  if (!start || !end) return null

  if (start.timestamp >= end.timestamp) {
    fieldErrors.endAt = 'La date de fin doit être après la date de début.'
    return null
  }

  return { startIso: start.iso, endIso: end.iso }
}

function applyValidationFieldErrors(target: AvailabilityBlockFieldErrors, fieldErrors: Record<string, string>) {
  for (const [property, message] of Object.entries(fieldErrors)) {
    if (property === 'startAt') target.startAt = message
    if (property === 'endAt') target.endAt = message
    if (property === 'blockType') target.blockType = message
    if (property === 'reason') target.reason = message
  }
}

export function useAvailabilityBlocksActions(options: {
  refresh: () => Promise<void>
  noticeMessage: Ref<string | null>
  actionErrorMessage: Ref<string | null>
}) {
  const { refresh, noticeMessage, actionErrorMessage } = options

  const createBlockModalOpen = ref(false)
  const createBlockError = ref<string | null>(null)
  const isCreatingBlock = ref(false)

  const deleteBlockModalOpen = ref(false)
  const deleteBlockError = ref<string | null>(null)
  const deletingBlockId = ref<string | null>(null)
  const blockBeingDeleted = ref<AvailabilityBlock | null>(null)

  const createBlockForm = reactive<AvailabilityBlockForm>(defaultBlockForm())
  const createBlockFieldErrors = reactive<AvailabilityBlockFieldErrors>(emptyBlockFieldErrors())

  function resetCreateBlockErrors() {
    createBlockError.value = null
    Object.assign(createBlockFieldErrors, emptyBlockFieldErrors())
  }

  function openCreateBlockModal() {
    resetCreateBlockErrors()
    Object.assign(createBlockForm, defaultBlockForm())
    createBlockModalOpen.value = true
  }

  watch(deleteBlockModalOpen, (open) => {
    if (!open) {
      blockBeingDeleted.value = null
      deleteBlockError.value = null
      deletingBlockId.value = null
    }
  })

  function openDeleteBlockModal(block: AvailabilityBlock) {
    noticeMessage.value = null
    actionErrorMessage.value = null
    deleteBlockError.value = null
    blockBeingDeleted.value = block
    deleteBlockModalOpen.value = true
  }

  async function submitCreateBlock() {
    noticeMessage.value = null
    actionErrorMessage.value = null
    resetCreateBlockErrors()

    if (isCreatingBlock.value) return

    const parsed = validateBlockForm(createBlockForm, createBlockFieldErrors)
    if (!parsed) return

    isCreatingBlock.value = true
    try {
      await createAvailabilityBlock({
        startAt: parsed.startIso,
        endAt: parsed.endIso,
        blockType: createBlockForm.blockType,
        reason: createBlockForm.reason.trim() ? createBlockForm.reason.trim() : null
      })
      await refresh()
      noticeMessage.value = 'Blocage ajouté.'
      createBlockModalOpen.value = false
    } catch (err: unknown) {
      if (err instanceof ApiFetchError) {
        if (err.apiError.code === 'BLOCK_OVERLAP_APPOINTMENT') {
          createBlockError.value = 'Ce blocage chevauche un rendez-vous déjà planifié. Ajustez les dates ou annulez le rendez-vous concerné.'
          return
        }

        if (err.apiError.code === 'VALIDATION_ERROR') {
          applyValidationFieldErrors(createBlockFieldErrors, extractValidationFieldErrors(err.apiError.details))
          createBlockError.value = 'Certains champs sont invalides. Vérifiez votre saisie.'
          return
        }
      }

      createBlockError.value = mapAvailabilityErrorToMessage(err, 'Impossible de créer le blocage. Veuillez réessayer.')
    } finally {
      isCreatingBlock.value = false
    }
  }

  async function confirmDeleteBlock() {
    noticeMessage.value = null
    actionErrorMessage.value = null
    deleteBlockError.value = null

    const block = blockBeingDeleted.value
    if (!block) return
    if (isCreatingBlock.value) return
    if (deletingBlockId.value) return

    deletingBlockId.value = block.id
    try {
      await deleteAvailabilityBlock(block.id)
      await refresh()
      noticeMessage.value = 'Blocage supprimé.'
      deleteBlockModalOpen.value = false
      blockBeingDeleted.value = null
    } catch (err: unknown) {
      deleteBlockError.value = mapAvailabilityErrorToMessage(err, 'Impossible de supprimer le blocage. Veuillez réessayer.')
    } finally {
      deletingBlockId.value = null
    }
  }

  return {
    createBlockModalOpen,
    createBlockError,
    isCreatingBlock,
    createBlockForm,
    createBlockFieldErrors,
    openCreateBlockModal,
    submitCreateBlock,

    deleteBlockModalOpen,
    deleteBlockError,
    deletingBlockId,
    blockBeingDeleted,
    openDeleteBlockModal,
    confirmDeleteBlock
  }
}
