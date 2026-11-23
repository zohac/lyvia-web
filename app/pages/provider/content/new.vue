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
          v-model:slug="form.slug"
          :errors="errors"
          :disabled="saving"
        />

        <MoleculesContentCoverField
          v-model="form.coverImageUrl"
          :disabled="saving"
        />

        <div class="space-y-2">
          <p class="text-sm font-medium text-[color:var(--color-text-primary)]">
            Diffusion
          </p>
          <div class="flex gap-2">
            <UButton
              size="sm"
              :variant="form.audience === 'all' ? 'solid' : 'soft'"
              color="primary"
              type="button"
              :disabled="saving"
              @click="form.audience = 'all'"
            >
              Partagé avec toutes vos clientes
            </UButton>
            <UButton
              size="sm"
              :variant="form.audience === 'selected' ? 'solid' : 'soft'"
              color="neutral"
              type="button"
              :disabled="saving"
              @click="form.audience = 'selected'"
            >
              Clientes choisies
            </UButton>
          </div>
        </div>

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
import type { ContentAudience, ContentType } from '../../../features/contents/api/contents.contract'
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
import MoleculesContentCoverField from '../../../components/molecules/ContentCoverField.vue'

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
  audience: 'selected' as ContentAudience,
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
