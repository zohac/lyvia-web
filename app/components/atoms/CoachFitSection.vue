<script setup lang="ts">
import type { CoachFitSectionItem } from '~/features/seo/api/coach-fit-section.contract'

/**
 * Fit section component for coach pages.
 * Displays "For whom / Not for whom" information in a structured way.
 */
withDefaults(
  defineProps<{
    items?: CoachFitSectionItem[]
  }>(),
  {
    items: () => []
  }
)
</script>

<template>
  <div class="my-12">
    <h2 class="text-2xl font-bold text-center mb-8">
      Pour qui s'adresse cet accompagnement ?
    </h2>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-8">
      <!-- For whom -->
      <div class="bg-blue-50 rounded-lg p-6 border border-blue-100">
        <h3 class="text-xl font-semibold text-blue-800 mb-4">
          Pour vous si...
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(item, index) in items.filter(i => i.type === 'for')"
            :key="index"
            class="flex items-start"
          >
            <UIcon
              name="i-lucide-check-circle"
              class="size-5 text-blue-600 mt-0.5 mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <span class="text-blue-900">{{ item.text }}</span>
          </li>
        </ul>
      </div>

      <!-- Not for whom -->
      <div class="bg-red-50 rounded-lg p-6 border border-red-100">
        <h3 class="text-xl font-semibold text-red-800 mb-4">
          Ce n'est pas adapté si...
        </h3>
        <ul class="space-y-2">
          <li
            v-for="(item, index) in items.filter(i => i.type === 'not_for')"
            :key="index"
            class="flex items-start"
          >
            <UIcon
              name="i-lucide-x-circle"
              class="size-5 text-red-600 mt-0.5 mr-2 flex-shrink-0"
              aria-hidden="true"
            />
            <span class="text-red-900">{{ item.text }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
