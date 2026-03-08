<script setup lang="ts">
import type { SeoFieldValues } from '~/types/seo.types'
import GooglePreview from '~/components/molecules/GooglePreview.vue'

const props = defineProps<{
  adminConfig: SeoFieldValues | null
  resolvedConfig: SeoFieldValues
  saving?: boolean
}>()

const emit = defineEmits<{
  save: [patch: SeoFieldValues]
}>()

const title = ref(props.adminConfig?.title ?? '')
const description = ref(props.adminConfig?.description ?? '')
const ogImageUrl = ref(props.adminConfig?.ogImageUrl ?? '')
const canonicalUrl = ref(props.adminConfig?.canonicalUrl ?? '')

const saved = ref({
  title: title.value,
  description: description.value,
  ogImageUrl: ogImageUrl.value,
  canonicalUrl: canonicalUrl.value
})

const isDirty = computed(() =>
  title.value !== saved.value.title
  || description.value !== saved.value.description
  || ogImageUrl.value !== saved.value.ogImageUrl
  || canonicalUrl.value !== saved.value.canonicalUrl
)

const previewTitle = computed(() => title.value || props.resolvedConfig.title || '')
const previewDescription = computed(() => description.value || props.resolvedConfig.description || '')
const previewUrl = computed(() => canonicalUrl.value || props.resolvedConfig.canonicalUrl || '')

function handleSave() {
  emit('save', {
    title: title.value || null,
    description: description.value || null,
    ogImageUrl: ogImageUrl.value || null,
    canonicalUrl: canonicalUrl.value || null
  })
}

function syncFromConfig(adminConfig: SeoFieldValues | null) {
  title.value = adminConfig?.title ?? ''
  description.value = adminConfig?.description ?? ''
  ogImageUrl.value = adminConfig?.ogImageUrl ?? ''
  canonicalUrl.value = adminConfig?.canonicalUrl ?? ''
  saved.value = {
    title: title.value,
    description: description.value,
    ogImageUrl: ogImageUrl.value,
    canonicalUrl: canonicalUrl.value
  }
}

watch(() => props.adminConfig, (newConfig) => {
  syncFromConfig(newConfig)
})
</script>

<template>
  <div class="space-y-4">
    <UFormField label="Titre SEO">
      <template #hint>
        {{ title.length }}/70
      </template>
      <UInput
        v-model="title"
        maxlength="70"
        class="w-full"
      />
    </UFormField>

    <UFormField label="Description SEO">
      <template #hint>
        {{ description.length }}/160
      </template>
      <UTextarea
        v-model="description"
        maxlength="160"
        :rows="3"
        class="w-full"
      />
    </UFormField>

    <UFormField label="URL image OG">
      <UInput
        v-model="ogImageUrl"
        placeholder="https://..."
        class="w-full"
      />
    </UFormField>

    <UFormField label="URL canonique">
      <UInput
        v-model="canonicalUrl"
        placeholder="/coach/slug"
        class="w-full"
      />
    </UFormField>

    <GooglePreview
      :title="previewTitle"
      :description="previewDescription"
      :url="previewUrl"
    />

    <div class="flex justify-end">
      <UButton
        color="primary"
        :loading="saving"
        :disabled="!isDirty"
        @click="handleSave"
      >
        Enregistrer
      </UButton>
    </div>
  </div>
</template>
