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
      @retry="errorMessage = null"
    />

    <UCard class="bg-[color:var(--color-surface-card)]">
      <form
        class="space-y-4"
        @submit.prevent="submit"
      >
        <UFormField
          label="Titre"
          name="title"
          :error="errors.title"
        >
          <UInput
            v-model="form.title"
            autocomplete="off"
            :max-length="200"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Type"
          name="type"
          :error="errors.type"
        >
          <USelect
            v-model="form.type"
            :options="typeOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Contenu (markdown)"
          name="body"
        >
          <UTextarea
            v-model="form.body"
            :rows="10"
            placeholder="Rédigez votre contenu en markdown..."
            class="w-full"
            autocomplete="off"
          />
        </UFormField>

        <UFormField
          label="URL de l'image de couverture"
          name="coverImageUrl"
          :error="errors.coverImageUrl"
        >
          <UInput
            v-model="form.coverImageUrl"
            type="url"
            autocomplete="url"
            placeholder="https://..."
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Visibilité"
          name="visibility"
        >
          <USelect
            v-model="form.visibility"
            :options="visibilityOptions"
            class="w-full"
          />
        </UFormField>

        <UFormField
          label="Slug (optionnel)"
          name="slug"
          :error="errors.slug"
        >
          <UInput
            v-model="form.slug"
            autocomplete="off"
            placeholder="auto-généré depuis le titre"
            class="w-full"
          />
        </UFormField>

        <UAlert
          v-if="slugError"
          color="error"
          variant="soft"
          :title="slugError"
          icon="i-lucide-alert-circle"
        />

        <div class="flex justify-end gap-3">
          <UButton
            variant="ghost"
            color="neutral"
            type="button"
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
import { createContent } from '../../../features/contents/services/provider-contents.service'
import { validateContentForm, resolveContentServerError } from '../../../features/contents/domain/content-form'
import { ApiFetchError } from '../../../services/api/api-error'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Nouveau contenu'
})

const toast = useToast()
const form = reactive({
  title: '',
  type: '' as 'article' | 'recette' | 'actualite' | '',
  body: '',
  coverImageUrl: '',
  visibility: 'public' as 'public' | 'private',
  slug: ''
})

const errors = ref<Record<string, string>>({})
const saving = ref(false)
const errorMessage = ref<string | null>(null)
const slugError = ref<string | null>(null)

const typeOptions = [
  { label: 'Article', value: 'article' },
  { label: 'Recette', value: 'recette' },
  { label: 'Actualité', value: 'actualite' }
]

const visibilityOptions = [
  { label: 'Public', value: 'public' },
  { label: 'Privé', value: 'private' }
]

function cancel() {
  navigateTo('/provider/content')
}

async function submit() {
  slugError.value = null
  const validationErrors = validateContentForm({
    title: form.title,
    type: form.type,
    slug: form.slug,
    body: form.body,
    coverImageUrl: form.coverImageUrl,
    visibility: form.visibility
  })
  errors.value = validationErrors as Record<string, string>
  if (Object.keys(validationErrors).length > 0) return

  saving.value = true
  errorMessage.value = null
  try {
    const payload: Record<string, unknown> = {
      title: form.title.trim(),
      type: form.type,
      visibility: form.visibility
    }
    const body = form.body.trim()
    if (body.length > 0) payload.body = body
    const slug = form.slug.trim()
    if (slug.length > 0) payload.slug = slug
    const cover = form.coverImageUrl.trim()
    if (cover.length > 0) payload.coverImageUrl = cover

    const res = await createContent(payload as import('../../../features/contents/api/contents.contract').CreateContentRequest)
    toast.add({ title: 'Contenu créé', color: 'success' })
    navigateTo(`/provider/content/${res.contentId}`)
  } catch (err) {
    if (err instanceof ApiFetchError && err.apiError.code === 'SLUG_ALREADY_TAKEN') {
      slugError.value = resolveContentServerError(err.apiError.code).message
    } else if (err instanceof ApiFetchError) {
      const mapped = resolveContentServerError(err.apiError.code)
      if (mapped.field) {
        errors.value = { [mapped.field]: mapped.message }
      } else {
        errorMessage.value = mapped.message
      }
    } else {
      errorMessage.value = 'Une erreur est survenue. Veuillez réessayer.'
    }
  } finally {
    saving.value = false
  }
}
</script>
