<script setup lang="ts">
defineProps<{
  account: {
    isTest?: boolean
    isPublished?: boolean
    customDomain?: string | null
  } | null
  publishing?: boolean
  previewLink?: string | null
  publicLink?: { site?: string } | null
}>()

const emit = defineEmits<{
  preview: []
  publish: []
  unpublish: []
}>()
</script>

<template>
  <AtomsDsPageHeader>
    <div class="flex flex-wrap items-center gap-3">
      <span>Ma page coach</span>
      <UBadge
        v-if="account?.isTest"
        color="warning"
        variant="subtle"
        icon="i-lucide-flask-conical"
      >
        Compte de test
      </UBadge>
      <UBadge
        v-else-if="account?.isPublished"
        color="success"
        variant="subtle"
        icon="i-lucide-check-circle-2"
      >
        En ligne
      </UBadge>
      <UBadge
        v-else
        color="neutral"
        variant="subtle"
        icon="i-lucide-file-text"
      >
        Brouillon
      </UBadge>
    </div>
    <template #subtitle>
      Choisissez un template et personnalisez le contenu de votre page publique.
    </template>
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <UButton
          v-if="previewLink"
          :to="previewLink"
          :external="true"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="outline"
          icon="i-lucide-eye"
          data-testid="coach-page-preview-full-btn"
          @click="emit('preview')"
        >
          Aperçu
        </UButton>

        <UTooltip
          v-if="account?.isTest"
          text="Les comptes de test ne peuvent pas être mis en ligne."
        >
          <UButton
            disabled
            color="neutral"
            variant="solid"
            icon="i-lucide-globe"
          >
            Mettre en ligne
          </UButton>
        </UTooltip>

        <UButton
          v-else-if="account?.isPublished"
          color="neutral"
          variant="outline"
          icon="i-lucide-globe-lock"
          :loading="publishing"
          @click="emit('unpublish')"
        >
          Dépublier
        </UButton>

        <UButton
          v-else
          color="primary"
          variant="solid"
          icon="i-lucide-globe"
          :loading="publishing"
          @click="emit('publish')"
        >
          Mettre en ligne
        </UButton>

        <UButton
          v-if="account?.isPublished && publicLink?.site"
          :to="publicLink.site"
          :external="!!account?.customDomain"
          target="_blank"
          rel="noopener noreferrer"
          color="neutral"
          variant="subtle"
          icon="i-lucide-external-link"
          data-testid="coach-page-view-public-btn"
        >
          Voir ma page
        </UButton>
      </div>
    </template>
  </AtomsDsPageHeader>
</template>
