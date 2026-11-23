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
      label="Contenu"
      name="body"
    >
      <UTextarea
        :model-value="body"
        :rows="10"
        placeholder="Rédigez votre contenu…"
        autocomplete="off"
        class="w-full"
        @update:model-value="emit('update:body', $event)"
      />
      <template #hint>
        <span class="text-xs text-[color:var(--color-text-muted)]">Les adresses http(s) que vous collez deviennent cliquables.</span>
      </template>
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
import type { ContentType } from '../../features/contents/api/contents.contract'
import type { ContentFormErrors } from '../../features/contents/domain/content-form'
import { MAX_CONTENT_TITLE_LENGTH } from '../../features/contents/domain/content-form'
import { CONTENT_TYPE_OPTIONS } from '../../features/contents/domain/content-options'

const props = withDefaults(defineProps<{
  title: string
  type: ContentType | '' | null | undefined
  body: string
  slug: string
  errors: ContentFormErrors
  slugPlaceholder?: string
  disabled?: boolean
}>(), {
  slugPlaceholder: 'auto-généré depuis le titre',
  disabled: false
})

const typeModel = computed(() => (props.type === '' || props.type == null ? undefined : props.type))

const emit = defineEmits<{
  'update:title': [value: string]
  'update:type': [value: ContentType]
  'update:body': [value: string]
  'update:slug': [value: string]
}>()
</script>
