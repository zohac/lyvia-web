<template>
  <fieldset
    :disabled="disabled"
    class="grid min-w-0 gap-5 sm:grid-cols-2"
  >
    <UFormField
      label="Titre"
      name="title"
      :error="errors.title"
      :ui="CONTENT_FIELD_UI"
      class="sm:col-span-2"
    >
      <UInput
        :model-value="title"
        autocomplete="off"
        :max-length="MAX_CONTENT_TITLE_LENGTH"
        class="w-full"
        :ui="inputUi"
        @update:model-value="emit('update:title', $event)"
      />
    </UFormField>

    <UFormField
      label="Type"
      name="type"
      :error="errors.type"
      :ui="CONTENT_FIELD_UI"
    >
      <USelect
        :model-value="typeModel"
        :items="CONTENT_TYPE_OPTIONS"
        placeholder="Choisir un type"
        aria-label="Type de contenu"
        class="w-full"
        :ui="selectUi"
        :disabled="typeDisabled"
        @update:model-value="emit('update:type', $event)"
      />
    </UFormField>

    <UFormField
      label="Slug"
      name="slug"
      :error="errors.slug"
      :ui="CONTENT_FIELD_UI"
    >
      <UInput
        :model-value="slug"
        autocomplete="off"
        :placeholder="slugPlaceholder"
        class="w-full"
        :ui="inputUi"
        @update:model-value="emit('update:slug', $event)"
      />
    </UFormField>

    <UFormField
      label="Contenu"
      name="body"
      :ui="CONTENT_FIELD_UI"
      class="sm:col-span-2"
    >
      <UTextarea
        :model-value="body"
        :rows="controlSize === 'compact' ? 8 : 12"
        placeholder="Rédigez votre contenu…"
        autocomplete="off"
        class="w-full"
        :ui="CONTENT_TEXTAREA_UI"
        @update:model-value="emit('update:body', $event)"
      />
      <p :class="`mt-1.5 ${CONTENT_META_CLASS}`">
        Les adresses http(s) que vous collez deviennent cliquables.
      </p>
    </UFormField>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContentType } from '../../features/contents/api/contents.contract'
import type { ContentFormErrors } from '../../features/contents/domain/content-form'
import { MAX_CONTENT_TITLE_LENGTH } from '../../features/contents/domain/content-form'
import { CONTENT_TYPE_OPTIONS } from '../../features/contents/domain/content-options'
import {
  CONTENT_FIELD_UI,
  CONTENT_INPUT_UI,
  CONTENT_INPUT_UI_COMPACT,
  CONTENT_META_CLASS,
  CONTENT_SELECT_UI,
  CONTENT_SELECT_UI_COMPACT,
  CONTENT_TEXTAREA_UI
} from '../../features/contents/domain/content-field-ui'

const props = withDefaults(defineProps<{
  title: string
  type: ContentType | '' | null | undefined
  body: string
  slug: string
  errors: ContentFormErrors
  slugPlaceholder?: string
  disabled?: boolean
  /** Platform articles fix the type to `article` (diffusion-10). */
  typeDisabled?: boolean
  /** AC5: 48 px praticienne/cliente, 40 px admin. */
  controlSize?: 'md' | 'compact'
}>(), {
  slugPlaceholder: 'auto-généré depuis le titre',
  disabled: false,
  typeDisabled: false,
  controlSize: 'md'
})

const typeModel = computed(() => (props.type === '' || props.type == null ? undefined : props.type))
const inputUi = computed(() => (props.controlSize === 'compact' ? CONTENT_INPUT_UI_COMPACT : CONTENT_INPUT_UI))
const selectUi = computed(() => (props.controlSize === 'compact' ? CONTENT_SELECT_UI_COMPACT : CONTENT_SELECT_UI))

const emit = defineEmits<{
  'update:title': [value: string]
  'update:type': [value: ContentType]
  'update:body': [value: string]
  'update:slug': [value: string]
}>()
</script>
