<template>
  <fieldset
    :disabled="disabled"
    class="min-w-0 space-y-4"
  >
    <UFormField
      label="Titre"
      name="title"
      :error="errors.title"
    >
      <UInput
        :model-value="title"
        autocomplete="off"
        :max-length="MAX_CONTENT_TITLE_LENGTH"
        class="w-full"
        @update:model-value="emit('update:title', $event)"
      />
    </UFormField>

    <UFormField
      label="Type"
      name="type"
      :error="errors.type"
    >
      <USelect
        :model-value="typeModel"
        :items="CONTENT_TYPE_OPTIONS"
        placeholder="Choisir un type"
        aria-label="Type de contenu"
        class="w-full"
        @update:model-value="emit('update:type', $event)"
      />
    </UFormField>

    <UFormField
      label="Contenu (markdown)"
      name="body"
    >
      <UTextarea
        :model-value="body"
        :rows="10"
        placeholder="Rédigez votre contenu en markdown..."
        autocomplete="off"
        class="w-full"
        @update:model-value="emit('update:body', $event)"
      />
    </UFormField>

    <UFormField
      label="URL de l'image de couverture"
      name="coverImageUrl"
      :error="errors.coverImageUrl"
    >
      <UInput
        :model-value="coverImageUrl"
        type="url"
        autocomplete="url"
        placeholder="https://..."
        class="w-full"
        @update:model-value="emit('update:coverImageUrl', $event)"
      />
    </UFormField>

    <UFormField
      label="Visibilité"
      name="visibility"
    >
      <USelect
        :model-value="visibility"
        :items="CONTENT_VISIBILITY_OPTIONS"
        aria-label="Visibilité du contenu"
        class="w-full"
        @update:model-value="emit('update:visibility', $event)"
      />
    </UFormField>

    <UFormField
      label="Slug"
      name="slug"
      :error="errors.slug"
    >
      <UInput
        :model-value="slug"
        autocomplete="off"
        :placeholder="slugPlaceholder"
        class="w-full"
        @update:model-value="emit('update:slug', $event)"
      />
    </UFormField>
  </fieldset>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ContentType, ContentVisibility } from '../../features/contents/api/contents.contract'
import type { ContentFormErrors } from '../../features/contents/domain/content-form'
import { MAX_CONTENT_TITLE_LENGTH } from '../../features/contents/domain/content-form'
import { CONTENT_TYPE_OPTIONS, CONTENT_VISIBILITY_OPTIONS } from '../../features/contents/domain/content-options'

/**
 * The six fields of a provider content, shared by the create and edit pages so
 * a field cannot exist in one form and be missing from the other.
 *
 * The parent owns the `reactive` state; the component is presentational and
 * emits `update:<field>` for each `v-model:<field>` binding.
 */
const props = withDefaults(defineProps<{
  title: string
  type: ContentType | '' | null | undefined
  body: string
  coverImageUrl: string
  visibility: ContentVisibility
  slug: string
  errors: ContentFormErrors
  slugPlaceholder?: string
  disabled?: boolean
}>(), {
  slugPlaceholder: 'auto-généré depuis le titre',
  disabled: false
})

/** `USelect` renders its placeholder for `undefined`, never for an empty string. */
const typeModel = computed(() => (props.type === '' || props.type == null ? undefined : props.type))

const emit = defineEmits<{
  'update:title': [value: string]
  'update:type': [value: ContentType]
  'update:body': [value: string]
  'update:coverImageUrl': [value: string]
  'update:visibility': [value: ContentVisibility]
  'update:slug': [value: string]
}>()
</script>
