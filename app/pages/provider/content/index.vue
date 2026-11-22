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
          <UButton
            to="/provider/content/new"
            color="primary"
          >
            <UIcon
              name="lucide:plus"
              class="mr-2 h-4 w-4"
            />
            Nouveau contenu
          </UButton>
        </div>
      </template>
    </AtomsDsPageHeader>

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
      <!-- A transient refresh failure keeps the list the provider was reading;
           only a failure with nothing on screen takes the whole page. -->
      <UAlert
        v-if="errorMessage"
        color="warning"
        variant="soft"
        title="Actualisation impossible"
        :description="errorMessage"
        icon="i-lucide-alert-triangle"
      >
        <template #actions>
          <UButton
            color="warning"
            variant="soft"
            size="sm"
            @click="refresh()"
          >
            Réessayer
          </UButton>
        </template>
      </UAlert>

      <!-- Filters -->
      <div class="flex flex-col gap-3 sm:flex-row sm:items-center">
        <USelect
          v-model="typeFilter"
          :items="CONTENT_TYPE_FILTER_OPTIONS"
          aria-label="Filtrer par type"
          class="w-full sm:w-48"
        />
        <USelect
          v-model="statusFilter"
          :items="CONTENT_STATUS_FILTER_OPTIONS"
          aria-label="Filtrer par statut"
          class="w-full sm:w-48"
        />
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par titre..."
          aria-label="Rechercher par titre"
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
          <div class="space-y-2">
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
            <USkeleton class="h-3 w-1/4" />
          </div>
        </UCard>
      </div>

      <!-- Empty -->
      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        :title="emptyTitle"
        :description="emptyDescription"
      >
        <template
          v-if="hasActiveFilters"
          #action
        >
          <UButton
            color="neutral"
            variant="outline"
            size="sm"
            @click="resetFilters"
          >
            Réinitialiser les filtres
          </UButton>
        </template>
      </AtomsDsEmptyState>

      <!-- List -->
      <div
        v-else
        class="space-y-4"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/provider/content/${item.id}`"
          class="block"
        >
          <UCard class="bg-[color:var(--color-surface-card)] cursor-pointer hover:shadow-md transition-shadow">
            <div class="flex items-start justify-between gap-4">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 flex-wrap">
                  <h3 class="font-semibold text-[color:var(--color-text-primary)] truncate">
                    {{ item.title }}
                  </h3>
                  <UBadge
                    :color="getTypeBadge(item.type).color"
                    variant="soft"
                    size="xs"
                  >
                    {{ getTypeBadge(item.type).label }}
                  </UBadge>
                  <UBadge
                    :color="getStatusBadge(item.isPublished).color"
                    variant="soft"
                    size="xs"
                  >
                    {{ getStatusBadge(item.isPublished).label }}
                  </UBadge>
                  <UBadge
                    :color="getVisibilityBadge(item.visibility).color"
                    variant="soft"
                    size="xs"
                  >
                    {{ getVisibilityBadge(item.visibility).label }}
                  </UBadge>
                </div>
                <p class="mt-1 text-xs text-[color:var(--color-text-muted)]">
                  Modifié le {{ formatDateTime(item.updatedAt) }}
                </p>
              </div>
            </div>
          </UCard>
        </NuxtLink>
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
import { CONTENT_STATUS_FILTER_OPTIONS, CONTENT_TYPE_FILTER_OPTIONS } from '../../../features/contents/domain/content-options'
import { formatDateTime } from '~/composables/useDateFormat'

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

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0
  || typeFilter.value !== 'all'
  || statusFilter.value !== 'all'
)

const emptyTitle = computed(() => (hasActiveFilters.value ? 'Aucun résultat' : 'Aucun contenu'))

const emptyDescription = computed(() =>
  hasActiveFilters.value
    ? 'Aucun contenu ne correspond à votre recherche.'
    : 'Créez votre premier contenu.'
)

function resetFilters() {
  searchQuery.value = ''
  typeFilter.value = 'all'
  statusFilter.value = 'all'
}
</script>
