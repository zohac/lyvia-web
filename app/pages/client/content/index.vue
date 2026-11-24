<template>
  <div class="space-y-6">
    <AtomsDsPageHeader title="Ressources">
      <template #subtitle>
        <span class="block max-w-[62ch] text-base text-[color:var(--color-text-secondary)]">
          Consultez les contenus partagés par votre coach.
        </span>
      </template>
    </AtomsDsPageHeader>

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
            size="md"
            @click="refresh()"
          >
            Réessayer
          </UButton>
        </template>
      </UAlert>

      <!-- Filters -->
      <div class="grid grid-cols-1 gap-3 sm:flex sm:flex-wrap sm:items-center">
        <USelect
          v-model="typeFilter"
          :items="CONTENT_TYPE_FILTER_OPTIONS"
          aria-label="Filtrer par type"
          class="w-full sm:w-auto sm:min-w-44"
          :ui="CONTENT_SELECT_UI"
        />
        <UInput
          v-model="searchQuery"
          :maxlength="CLIENT_CONTENTS_SEARCH_MAX_LENGTH"
          placeholder="Rechercher par titre..."
          aria-label="Rechercher par titre"
          icon="i-lucide-search"
          class="w-full sm:ml-auto sm:w-72"
          autocomplete="off"
          :ui="CONTENT_INPUT_UI"
        />
      </div>

      <!-- Loading -->
      <div
        v-if="pending"
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        aria-busy="true"
      >
        <UCard
          v-for="i in 6"
          :key="i"
          class="bg-[color:var(--color-surface-card)]"
          :ui="{ header: '!px-0 !py-0', body: '!px-5 !py-5' }"
        >
          <template #header>
            <USkeleton class="h-40 w-full rounded-none" />
          </template>
          <div class="space-y-2">
            <USkeleton class="h-5 w-20 rounded-full" />
            <USkeleton class="h-4 w-2/3" />
            <USkeleton class="h-3 w-1/2" />
          </div>
        </UCard>
      </div>

      <!-- Empty: no content shared at all (AC3) -->
      <div
        v-else-if="items.length === 0 && !hasActiveFilters"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
      >
        <AtomsDsEmptyState
          icon="i-lucide-file-text"
          title="Aucun contenu disponible"
          description="Aucun contenu n'est disponible pour le moment."
        />
      </div>

      <!-- Empty: the active filter matched nothing -->
      <div
        v-else-if="items.length === 0"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
      >
        <AtomsDsEmptyState
          icon="i-lucide-search-x"
          title="Aucun résultat"
          description="Aucun contenu ne correspond à votre recherche."
        >
          <template #action>
            <UButton
              color="neutral"
              variant="outline"
              size="md"
              @click="resetFilters()"
            >
              Réinitialiser les filtres
            </UButton>
          </template>
        </AtomsDsEmptyState>
      </div>

      <!-- List -->
      <div
        v-else
        class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
      >
        <NuxtLink
          v-for="item in items"
          :key="item.id"
          :to="`/client/content/${item.slug}`"
          class="block rounded-[var(--radius-lg)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[color:var(--color-brand-primary)]"
        >
          <!--
            diffusion-15: one media geometry for the two states. The cover is
            full-bleed at the top of the card (`header: p-0`); without a cover
            the tinted block takes the same box, instead of a grey tile inset in
            the white body (the 2026-11-24 capture showed a card inside a card).
          -->
          <UCard
            class="h-full cursor-pointer bg-[color:var(--color-surface-card)] transition-shadow hover:shadow-[var(--shadow-lg)]"
            :ui="{ header: '!px-0 !py-0', body: '!px-5 !py-5' }"
          >
            <template #header>
              <img
                v-if="item.coverImageUrl"
                :src="item.coverImageUrl"
                :alt="item.title"
                loading="lazy"
                class="h-40 w-full object-cover"
              >
              <div
                v-else
                class="flex h-40 w-full items-center justify-center bg-[color:var(--color-surface-highlight)]"
              >
                <UIcon
                  name="i-lucide-file-text"
                  class="size-8 text-[color:var(--color-brand-secondary)]"
                />
              </div>
            </template>
            <div class="space-y-2">
              <div class="flex flex-wrap items-center gap-2">
                <UBadge
                  :color="getTypeBadge(item.type).color"
                  variant="soft"
                  size="md"
                  :class="getBadgeInkClass(getTypeBadge(item.type).color)"
                >
                  {{ getTypeBadge(item.type).label }}
                </UBadge>
                <UBadge
                  v-if="item.document"
                  color="neutral"
                  variant="soft"
                  size="md"
                  :class="getBadgeInkClass('neutral')"
                >
                  Document
                </UBadge>
              </div>
              <h3 class="font-sans text-base font-semibold leading-snug text-[color:var(--color-text-primary)]">
                {{ item.title }}
              </h3>
              <p :class="CONTENT_META_CLASS">
                {{ item.source === 'keova' ? 'Keova' : (item.providerName ?? 'Keova') }}
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
import { useClientContents } from '../../../features/contents/useClientContents'
import { CLIENT_CONTENTS_SEARCH_MAX_LENGTH } from '../../../features/contents/createClientContents'
import { getTypeBadge, getBadgeInkClass } from '../../../features/contents/domain/contents-badges'
import { CONTENT_TYPE_FILTER_OPTIONS } from '../../../features/contents/domain/content-options'
import { CONTENT_INPUT_UI, CONTENT_META_CLASS, CONTENT_SELECT_UI } from '../../../features/contents/domain/content-field-ui'
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
  hasActiveFilters,
  refresh,
  loadMore,
  loadMorePending,
  loadMoreErrorMessage,
  resetFilters
} = useClientContents()

function formatDate(value: string | null): string {
  if (!value) return ''
  return formatDateShort(value)
}
</script>
