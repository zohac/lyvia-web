<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Contenus"
      subtitle="Gérez vos articles, recettes et actualités."
    >
      <template #actions>
        <div class="flex items-center gap-3">
          <UButton
            :loading="pending"
            variant="outline"
            color="neutral"
            @click="refresh"
          >
            <UIcon
              name="lucide:refresh-cw"
              class="mr-2 h-4 w-4"
            />
            Actualiser
          </UButton>
          <NuxtLink to="/provider/content/new">
            <UButton color="primary">
              <UIcon
                name="lucide:plus"
                class="mr-2 h-4 w-4"
              />
              Nouveau contenu
            </UButton>
          </NuxtLink>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <USelect
          v-model="typeFilter"
          :options="typeOptions"
          class="w-full sm:w-48"
        />
        <USelect
          v-model="statusFilter"
          :options="statusOptions"
          class="w-full sm:w-48"
        />
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par titre..."
          icon="i-lucide-search"
          class="w-full sm:w-72"
          autocomplete="off"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="pending"
        class="space-y-4"
      >
        <UCard
          v-for="i in 4"
          :key="i"
          class="bg-[color:var(--color-surface-card)]"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="h-12 w-12 rounded-lg" />
            <div class="flex-1 space-y-2">
              <USkeleton class="h-4 w-1/3" />
              <USkeleton class="h-3 w-1/2" />
            </div>
          </div>
        </UCard>
      </div>

      <!-- Empty -->
      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        title="Aucun contenu"
        description="Créez votre premier contenu."
      />

      <!-- List -->
      <div
        v-else
        class="space-y-4"
      >
        <UCard
          v-for="item in items"
          :key="item.id"
          class="bg-[color:var(--color-surface-card)] cursor-pointer hover:shadow-md transition-shadow"
          @click="goTo(item.id)"
        >
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <h3 class="font-semibold text-[color:var(--color-text-primary)] truncate">
                  {{ item.title }}
                </h3>
                <UBadge
                  :color="getTypeBadge(item.type).color as any"
                  variant="soft"
                  size="xs"
                >
                  {{ getTypeBadge(item.type).label }}
                </UBadge>
                <UBadge
                  :color="getStatusBadge(item.isPublished).color as any"
                  variant="soft"
                  size="xs"
                >
                  {{ getStatusBadge(item.isPublished).label }}
                </UBadge>
                <UBadge
                  :color="getVisibilityBadge(item.visibility).color as any"
                  variant="soft"
                  size="xs"
                >
                  {{ getVisibilityBadge(item.visibility).label }}
                </UBadge>
              </div>
              <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                Modifié le {{ formatDate(item.updatedAt) }}
              </p>
            </div>
          </div>
        </UCard>
      </div>

      <!-- Load more -->
      <div
        v-if="items.length > 0 && nextCursor"
        class="flex flex-col items-center gap-3"
      >
        <UButton
          variant="soft"
          color="neutral"
          :loading="loadMorePending"
          @click="loadMore"
        >
          <UIcon
            name="lucide:chevrons-down"
            class="mr-2 h-4 w-4"
          />
          Charger plus
        </UButton>
        <UAlert
          v-if="loadMoreErrorMessage"
          color="warning"
          variant="soft"
          title="Chargement partiel"
          :description="loadMoreErrorMessage"
          icon="i-lucide-alert-triangle"
          class="w-full max-w-md"
        />
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { useProviderContents } from '../../../features/contents/useProviderContents'
import { getStatusBadge, getVisibilityBadge, getTypeBadge } from '../../../features/contents/domain/contents-badges'
import { formatDateTime as formatDate } from '~/composables/useDateFormat'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Contenus'
})

const {
  pending,
  errorMessage,
  items,
  nextCursor,
  searchQuery,
  typeFilter,
  statusFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useProviderContents()

const typeOptions = [
  { label: 'Tous les types', value: 'all' },
  { label: 'Article', value: 'article' },
  { label: 'Recette', value: 'recette' },
  { label: 'Actualité', value: 'actualite' }
]

const statusOptions = [
  { label: 'Tous', value: 'all' },
  { label: 'Brouillon', value: 'draft' },
  { label: 'Publié', value: 'published' }
]

function goTo(id: string) {
  navigateTo(`/provider/content/${id}`)
}
</script>
