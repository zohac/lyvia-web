<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Contenus">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Gérez vos articles, recettes et actualités.
        </span>
      </template>
      <template #actions>
        <div class="flex max-w-[calc(100vw-5rem)] flex-wrap items-center gap-3 sm:max-w-none">
          <UButton
            :loading="pending"
            variant="outline"
            color="neutral"
            size="md"
            class="w-full justify-center sm:w-auto"
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
            size="md"
            class="w-full justify-center sm:w-auto"
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
            size="md"
            @click="refresh()"
          >
            Réessayer
          </UButton>
        </template>
      </UAlert>

      <!-- Filters -->
      <div class="grid grid-cols-2 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <USelect
          v-model="typeFilter"
          :items="CONTENT_TYPE_FILTER_OPTIONS"
          aria-label="Filtrer par type"
          class="w-full sm:w-auto sm:min-w-44"
          :ui="CONTENT_SELECT_UI"
        />
        <USelect
          v-model="statusFilter"
          :items="CONTENT_STATUS_FILTER_OPTIONS"
          aria-label="Filtrer par statut"
          class="w-full sm:w-auto sm:min-w-40"
          :ui="CONTENT_SELECT_UI"
        />
        <USelect
          v-model="audienceFilter"
          :items="CONTENT_DIFFUSION_FILTER_OPTIONS"
          aria-label="Filtrer par diffusion"
          class="col-span-2 w-full sm:col-span-1 sm:w-auto sm:min-w-48"
          :ui="CONTENT_SELECT_UI"
        />
        <UInput
          v-model="searchQuery"
          placeholder="Rechercher par titre..."
          aria-label="Rechercher par titre"
          icon="i-lucide-search"
          class="col-span-2 w-full sm:ml-auto sm:w-72"
          autocomplete="off"
          :ui="CONTENT_INPUT_UI"
        />
      </div>

      <!-- Loading: same geometry as a row, so nothing jumps when the list lands -->
      <UCard
        v-if="pending"
        class="bg-[color:var(--color-surface-card)]"
        :ui="{ body: '!px-0 !py-0' }"
      >
        <div
          v-for="i in 4"
          :key="i"
          class="flex min-h-16 flex-col justify-center gap-2 border-b border-[color:var(--color-border-subtle)] px-5 py-3 last:border-b-0"
        >
          <USkeleton class="h-4 w-1/3" />
          <USkeleton class="h-3 w-2/3" />
        </div>
      </UCard>

      <!-- Empty -->
      <div
        v-else-if="items.length === 0"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
      >
        <AtomsDsEmptyState
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
              size="md"
              @click="resetFilters"
            >
              Réinitialiser les filtres
            </UButton>
          </template>
        </AtomsDsEmptyState>
      </div>

      <!-- List: one surface, hairline rows. A card per item made a list of four
           contents look like a dashboard of widgets. -->
      <UCard
        v-else
        class="overflow-hidden bg-[color:var(--color-surface-card)]"
        :ui="{ body: '!px-0 !py-0' }"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/provider/content/${item.id}`"
          class="group flex items-center gap-4 border-b border-[color:var(--color-border-subtle)] px-5 py-3.5 transition-colors last:border-b-0 hover:bg-[color:var(--color-surface-highlight)] focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[color:var(--color-brand-primary)]"
        >
          <div class="min-w-0 flex-1">
            <p class="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
              {{ item.title }}
            </p>
            <div class="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
              <UBadge
                :color="getTypeBadge(item.type).color"
                variant="soft"
                size="md"
                :class="getBadgeInkClass(getTypeBadge(item.type).color)"
              >
                {{ getTypeBadge(item.type).label }}
              </UBadge>
              <UBadge
                :color="getStatusBadge(item.isPublished).color"
                variant="soft"
                size="md"
                :class="getBadgeInkClass(getStatusBadge(item.isPublished).color)"
              >
                {{ getStatusBadge(item.isPublished).label }}
              </UBadge>
              <UBadge
                v-if="item.audience"
                :color="getDiffusionBadge(item.audience).color"
                variant="soft"
                size="md"
                :class="getBadgeInkClass(getDiffusionBadge(item.audience).color)"
              >
                {{ getDiffusionBadge(item.audience).label }}
              </UBadge>
              <span :class="CONTENT_META_CLASS">
                Modifié le {{ formatDateTime(item.updatedAt) }}
              </span>
            </div>
          </div>
          <UIcon
            name="i-lucide-chevron-right"
            class="size-5 shrink-0 text-[color:var(--color-brand-secondary)] transition-transform group-hover:translate-x-0.5"
          />
        </NuxtLink>
      </UCard>

      <!-- Load more -->
      <div
        v-if="items.length > 0 && nextCursor"
        class="flex flex-col items-center gap-3"
      >
        <UButton
          variant="outline"
          color="neutral"
          size="md"
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
import { getStatusBadge, getDiffusionBadge, getTypeBadge, getBadgeInkClass } from '../../../features/contents/domain/contents-badges'
import { CONTENT_STATUS_FILTER_OPTIONS, CONTENT_TYPE_FILTER_OPTIONS, CONTENT_DIFFUSION_FILTER_OPTIONS } from '../../../features/contents/domain/content-options'
import { CONTENT_INPUT_UI, CONTENT_META_CLASS, CONTENT_SELECT_UI } from '../../../features/contents/domain/content-field-ui'
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
  audienceFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useProviderContents()

const hasActiveFilters = computed(() =>
  searchQuery.value.trim().length > 0
  || typeFilter.value !== 'all'
  || statusFilter.value !== 'all'
  || audienceFilter.value !== 'any'
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
  audienceFilter.value = 'any'
}
</script>
