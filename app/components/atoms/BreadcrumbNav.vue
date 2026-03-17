<script setup lang="ts">
import type { BreadcrumbItem } from '~/features/seo/breadcrumb-helpers'

const props = defineProps<{
  items: BreadcrumbItem[]
}>()

const hasItems = computed(() => props.items.length > 0)
</script>

<template>
  <nav
    v-if="hasItems"
    aria-label="Fil d'Ariane"
    class="px-4 py-2 text-xs text-(--ui-text-dimmed)"
  >
    <ol class="flex items-center gap-1">
      <li
        v-for="(item, index) in items"
        :key="index"
        class="flex items-center gap-1"
      >
        <span
          v-if="index > 0"
          aria-hidden="true"
        >›</span>
        <NuxtLink
          v-if="item.to"
          :to="item.to"
          class="hover:underline"
        >
          {{ item.label }}
        </NuxtLink>
        <span
          v-else
          aria-current="page"
        >{{ item.label }}</span>
      </li>
    </ol>
  </nav>
</template>
