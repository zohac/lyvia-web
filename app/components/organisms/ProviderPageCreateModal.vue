<script setup lang="ts">
import {
  applyCreatePageSlugChange,
  applyCreatePageTitleChange,
  createInitialCreatePageModalState,
  resolveCreatePageSubmit
} from '~/features/pages/domain/create-page-modal'
import {
  MAX_PAGE_TITLE_LENGTH,
  validateCreatePageForm,
  type CreatePageErrorField
} from '~/features/pages/domain/create-page-form'

/**
 * V2.2a — Quick draft creation modal (title + auto kebab-case slug).
 *
 * Presentational: it validates locally, then emits `submit`. The page owns the
 * API call via `useProviderPages().createPage` and feeds field-level server
 * errors back through the `serverError` prop. Two fields → `UModal` (DS4).
 *
 * All slug-tracking/submit rules live in `domain/create-page-modal.ts`.
 */
const props = withDefaults(
  defineProps<{
    open: boolean
    /** Public origin of the coach, e.g. `https://sophiejouan.fr/`. */
    prefix?: string
    submitting?: boolean
    serverError?: { field: CreatePageErrorField, message: string } | null
    existingSlugs?: readonly string[]
  }>(),
  {
    prefix: '',
    submitting: false,
    serverError: null,
    existingSlugs: () => []
  }
)

const emit = defineEmits<{
  (event: 'update:open', value: boolean): void
  (event: 'submit', payload: { title: string, slug: string }): void
  (event: 'clear-error'): void
}>()

const form = reactive(createInitialCreatePageModalState())
const submitAttempted = ref(false)

const titleInputRef = ref<{ focus: () => void } | null>(null)

watch(
  () => props.open,
  (open) => {
    if (!open) return
    Object.assign(form, createInitialCreatePageModalState())
    submitAttempted.value = false
    nextTick(() => titleInputRef.value?.focus())
  }
)

const localErrors = computed(() =>
  validateCreatePageForm({
    title: form.title,
    slug: form.slug,
    existingSlugs: props.existingSlugs
  })
)

function fieldError(field: 'title' | 'slug'): string | undefined {
  if (props.serverError?.field === field) {
    return props.serverError.message
  }
  if (!submitAttempted.value) return undefined
  return localErrors.value[field]
}

const generalError = computed(() =>
  props.serverError && props.serverError.field === null ? props.serverError.message : null
)

function clearServerError() {
  if (props.serverError) emit('clear-error')
}

function onTitleInput(value: string) {
  Object.assign(form, applyCreatePageTitleChange(form, value))
  clearServerError()
}

function onSlugInput(value: string) {
  Object.assign(form, applyCreatePageSlugChange(form, value))
  clearServerError()
}

function close() {
  if (props.submitting) return
  emit('update:open', false)
}

function submit() {
  if (props.submitting) return
  submitAttempted.value = true

  const result = resolveCreatePageSubmit(form, props.existingSlugs)
  if (result.kind === 'invalid') return

  emit('submit', { title: result.title, slug: result.slug })
}
</script>

<template>
  <UModal
    :open="open"
    :dismissible="!submitting"
    title="Créer une page"
    description="Donnez un titre à votre page, puis ajustez son adresse si besoin."
    @update:open="(value: boolean) => !submitting && emit('update:open', value)"
  >
    <template #body>
      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UAlert
          v-if="generalError"
          color="error"
          variant="soft"
          title="Création impossible"
          :description="generalError"
          icon="i-lucide-alert-circle"
        />

        <UFormField
          label="Titre de la page"
          required
          :error="fieldError('title')"
        >
          <UInput
            ref="titleInputRef"
            :model-value="form.title"
            class="w-full"
            placeholder="Mon approche de la périménopause"
            :maxlength="MAX_PAGE_TITLE_LENGTH"
            :disabled="submitting"
            @update:model-value="onTitleInput"
          />
        </UFormField>

        <UFormField
          label="Adresse de la page"
          :error="fieldError('slug')"
        >
          <template #hint>
            <span class="text-sm text-[color:var(--color-text-muted)]">Lettres minuscules, chiffres et tirets.</span>
          </template>
          <div class="flex items-center gap-2">
            <span
              v-if="prefix"
              class="shrink-0 text-sm text-[color:var(--color-text-muted)]"
            >{{ prefix }}</span>
            <UInput
              :model-value="form.slug"
              class="w-full"
              placeholder="mon-approche-de-la-perimenopause"
              :disabled="submitting"
              @update:model-value="onSlugInput"
            />
          </div>
        </UFormField>

        <!-- Hidden submit allows Enter in the fields to trigger creation. -->
        <button
          type="submit"
          class="hidden"
          tabindex="-1"
          aria-hidden="true"
        />
      </form>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="submitting"
          @click="close"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          :loading="submitting"
          @click="submit"
        >
          Créer la page
        </UButton>
      </div>
    </template>
  </UModal>
</template>
