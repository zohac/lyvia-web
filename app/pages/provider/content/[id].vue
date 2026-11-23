<template>
  <div class="space-y-6">
    <AtomsDsPageHeader :title="content ? content.title : 'Contenu'">
      <template #actions>
        <div class="flex items-center gap-2">
          <UButton
            variant="ghost"
            color="neutral"
            @click="goBack"
          >
            <UIcon
              name="lucide:arrow-left"
              class="mr-2 h-4 w-4"
            />
            Retour
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="loadError"
      :message="loadError"
      @retry="load"
    />

    <div
      v-else-if="loading"
      class="space-y-4"
    >
      <USkeleton class="h-8 w-1/3" />
      <USkeleton class="h-40 w-full" />
    </div>

    <template v-else-if="content">
      <UCard class="bg-[color:var(--color-surface-card)]">
        <form
          class="space-y-4"
          @submit.prevent="save"
        >
          <MoleculesContentsFormFields
            v-model:title="form.title"
            v-model:type="form.type"
            v-model:body="form.body"
            v-model:slug="form.slug"
            :errors="errors"
            :disabled="busy"
            slug-placeholder="Laissez vide pour conserver l’adresse actuelle"
          />

          <MoleculesContentCoverField
            v-model="form.coverImageUrl"
            :error="errors.coverImageUrl"
            :disabled="busy"
          />

          <MoleculesContentDocumentField
            v-model="form.document"
            :disabled="busy"
            @uploading="setDocumentUploading"
          />

          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-wrap items-center gap-2">
              <UButton
                v-if="!content.isPublished"
                color="success"
                type="button"
                :disabled="!canPublish || busy"
                :loading="publishing"
                @click="publish"
              >
                Publier
              </UButton>
              <UButton
                v-else
                color="warning"
                variant="soft"
                type="button"
                :disabled="busy"
                :loading="unpublishing"
                @click="unpublish"
              >
                Dépublier
              </UButton>
              <UButton
                color="error"
                variant="ghost"
                type="button"
                :disabled="busy"
                @click="isDeleteModalOpen = true"
              >
                Supprimer
              </UButton>
            </div>
            <UButton
              color="primary"
              type="submit"
              :loading="saving"
              :disabled="busy"
            >
              Enregistrer
            </UButton>
          </div>

          <p
            v-if="!content.isPublished && !canPublish"
            class="text-xs text-[color:var(--color-text-muted)]"
          >
            Le titre et le contenu doivent être enregistrés avant de pouvoir publier.
          </p>
        </form>
      </UCard>

      <UCard class="bg-[color:var(--color-surface-card)]">
        <template #header>
          <h3 class="text-base font-semibold text-[color:var(--color-text-primary)]">
            Diffusion
          </h3>
        </template>
        <MoleculesContentDiffusionSection
          :key="content.id"
          :audience="form.audience"
          :can-select="persistedAudience === 'selected'"
          :content-id="content.id"
          :disabled="busy"
          @update:audience="changeAudience"
        />
      </UCard>

      <UModal
        v-model:open="isDeleteModalOpen"
        title="Supprimer le contenu"
      >
        <template #body>
          <p>Êtes-vous sûr de vouloir supprimer ce contenu ? Cette action est irréversible.</p>
        </template>
        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              type="button"
              @click="isDeleteModalOpen = false"
            >
              Annuler
            </UButton>
            <UButton
              color="error"
              type="button"
              :loading="deleting"
              @click="handleDelete"
            >
              Supprimer
            </UButton>
          </div>
        </template>
      </UModal>
    </template>
  </div>
</template>

<script setup lang="ts">
import { getMyContent, updateContent, publishContent, unpublishContent, deleteContent } from '../../../features/contents/services/provider-contents.service'
import { createProviderContentEditor } from '../../../features/contents/createProviderContentEditor'
import MoleculesContentsFormFields from '../../../components/molecules/ContentsFormFields.vue'
import MoleculesContentCoverField from '../../../components/molecules/ContentCoverField.vue'
import MoleculesContentDocumentField from '../../../components/molecules/ContentDocumentField.vue'
import MoleculesContentDiffusionSection from '../../../components/molecules/ContentDiffusionSection.vue'

const route = useRoute()
const toast = useToast()

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Contenu'
})

const id = computed(() => String(route.params.id))

/**
 * The page is presentation and wiring: the load token, the save and the
 * mutation-versus-re-read split live in the factory, where they are executed by
 * `tests/contents/create-provider-content-editor.test.ts` (AC9, DR-3/DR-5).
 */
const {
  loading,
  loadError,
  content,
  form,
  errors,
  saving,
  publishing,
  unpublishing,
  deleting,
  setDocumentUploading,
  busy,
  canPublish,
  persistedAudience,
  changeAudience,
  load,
  save,
  publish,
  unpublish,
  handleDelete
} = createProviderContentEditor({
  id: () => id.value,
  getContent: getMyContent,
  updateContent,
  publishContent,
  unpublishContent,
  deleteContent,
  notify: notice => toast.add(notice),
  navigate: path => navigateTo(path)
})

const isDeleteModalOpen = ref(false)

onMounted(load)
watch(id, load)

function goBack() {
  navigateTo('/provider/content')
}
</script>
