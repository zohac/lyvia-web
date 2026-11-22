<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Nouveau contenu"
      subtitle="Créez un brouillon puis publiez quand il est prêt."
    >
      <template #actions>
        <UButton
          variant="ghost"
          color="neutral"
          @click="cancel"
        >
          <UIcon
            name="lucide:arrow-left"
            class="mr-2 h-4 w-4"
          />
          Annuler
        </UButton>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="submit"
    />

    <UCard class="bg-[color:var(--color-surface-card)]">
      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <MoleculesContentsFormFields
          v-model:title="form.title"
          v-model:type="form.type"
          v-model:body="form.body"
          v-model:cover-image-url="form.coverImageUrl"
          v-model:visibility="form.visibility"
          v-model:slug="form.slug"
          :errors="errors"
          :disabled="saving"
        />

        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            color="neutral"
            type="button"
            :disabled="saving"
            @click="cancel"
          >
            Annuler
          </UButton>
          <UButton
            color="primary"
            type="submit"
            :loading="saving"
          >
            Créer (brouillon)
          </UButton>
        </div>
      </form>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import type { ContentType, ContentVisibility } from '../../../features/contents/api/contents.contract'
import { createContent } from '../../../features/contents/services/provider-contents.service'
import {
  CONTENT_GENERIC_ERROR_MESSAGE,
  resolveContentServerError,
  validateContentForm,
  type ContentFormErrors
} from '../../../features/contents/domain/content-form'
import { buildCreateContentPayload } from '../../../features/contents/domain/content-payload'
import { ApiFetchError } from '../../../services/api/api-error'
import MoleculesContentsFormFields from '../../../components/molecules/ContentsFormFields.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Nouveau contenu'
})

const toast = useToast()
const form = reactive({
  title: '',
  type: '' as ContentType | '',
  body: '',
  coverImageUrl: '',
  visibility: 'public' as ContentVisibility,
  slug: ''
})

const errors = ref<ContentFormErrors>({})
const saving = ref(false)
const errorMessage = ref<string | null>(null)

function cancel() {
  navigateTo('/provider/content')
}

async function submit() {
  const validationErrors = validateContentForm(form)
  errors.value = validationErrors
  if (Object.keys(validationErrors).length > 0) return

  saving.value = true
  errorMessage.value = null
  try {
    const res = await createContent(buildCreateContentPayload(form))
    toast.add({ title: 'Contenu créé', color: 'success' })
    navigateTo(`/provider/content/${res.contentId}`)
  } catch (err) {
    if (err instanceof ApiFetchError) {
      const mapped = resolveContentServerError(err.apiError.code)
      if (mapped.field) {
        errors.value = { ...errors.value, [mapped.field]: mapped.message }
      } else {
        errorMessage.value = mapped.message
      }
    } else {
      errorMessage.value = CONTENT_GENERIC_ERROR_MESSAGE
    }
  } finally {
    saving.value = false
  }
}
</script>
