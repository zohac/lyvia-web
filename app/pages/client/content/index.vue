<template>
  <div class="space-y-6">
    <AtomsDsPageHeader
      title="Ressources"
      subtitle="Consultez les contenus partagés par votre coach."
    />

    <AtomsDsErrorState
      v-if="errorMessage && items.length === 0"
      :message="errorMessage"
      @retry="refresh()"
    />

    <template v-else>
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
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <UCard
          v-for="i in 6"
          :key="i"
          class="bg-[color:var(--color-surface-card)]"
        >
          <div class="space-y-2">
            <USkeleton class="h-40 w-full" />
            <USkeleton class="h-4 w-1/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </UCard>
      </div>

      <!-- Empty -->
      <AtomsDsEmptyState
        v-else-if="items.length === 0"
        icon="i-lucide-file-text"
        title="Aucun contenu disponible"
        description="Aucun contenu n'est disponible pour le moment."
      />

      <!-- List -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/client/content/${item.slug}`"
          class="block"
        >
          <UCard class="bg-[color:var(--color-surface-card)] cursor-pointer hover:shadow-md transition-shadow h-full">
            <template #header>
              <img
                v-if="item.coverImageUrl"
                :src="item.coverImageUrl"
                :alt="item.title"
                loading="lazy"
                class="h-40 w-full rounded-t-[var(--radius-lg)] object-cover"
              >
              <div
                v-else
                class="flex h-40 items-center justify-center rounded-t-[var(--radius-lg)] bg-[color:var(--color-surface-highlight)]"
              >
                <UIcon
                  name="i-lucide-file-text"
                  class="size-12 text-[color:var(--color-text-muted)]"
                />
              </div>
            </template>
            <div class="space-y-2">
              <UBadge
                :color="getTypeBadge(item.type).color"
                variant="soft"
                size="xs"
              >
                {{ getTypeBadge(item.type).label }}
              </UBadge>
              <h3 class="font-semibold text-[color:var(--color-text-primary)] leading-tight">
                {{ item.title }}
              </h3>
              <p class="text-xs text-[color:var(--color-text-muted)]">
                {{ item.providerName }}
                <template v-if="item.publishedAt">
                  · {{ formatDate(item.publishedAt) }}
                </template>
              </p>
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
import { useClientContents } from '../../../features/contents/useClientContents'
import { getTypeBadge } from '../../../features/contents/domain/contents-badges'
import { CONTENT_TYPE_FILTER_OPTIONS } from '../../../features/contents/domain/content-options'
import { formatDateShort } from '~/composables/useDateFormat'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Ressources'
})

const {
  pending,
  errorMessage,
  items,
  nextCursor,
  searchQuery,
  typeFilter,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage
} = await useClientContents()

function formatDate(value: string | null): string {
  if (!value) return ''
  return formatDateShort(value)
}
</script>
