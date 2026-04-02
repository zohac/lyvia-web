<script setup lang="ts">
interface DsEmptyStateProps {
  icon?: string
  title: string
  description?: string
  ctaLabel?: string
  ctaTo?: string
}

withDefaults(defineProps<DsEmptyStateProps>(), {
  icon: 'i-lucide-inbox',
  description: undefined,
  ctaLabel: undefined,
  ctaTo: undefined
})
</script>

<template>
  <div class="flex flex-col items-center justify-center px-6 py-16 text-center">
    <div class="mb-4 flex size-14 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)]">
      <UIcon
        :name="icon"
        class="size-7 text-[color:var(--color-text-muted)]"
      />
    </div>
    <h3 class="font-[family-name:var(--font-serif)] text-lg font-bold italic text-[color:var(--color-text-primary)]">
      {{ title }}
    </h3>
    <p
      v-if="description"
      class="mt-2 max-w-sm text-sm text-[color:var(--color-text-muted)]"
    >
      {{ description }}
    </p>
    <NuxtLink
      v-if="ctaLabel && ctaTo"
      :to="ctaTo"
      class="mt-6"
    >
      <UButton
        color="primary"
        size="sm"
      >
        {{ ctaLabel }}
      </UButton>
    </NuxtLink>
    <UButton
      v-else-if="ctaLabel"
      color="primary"
      size="sm"
      class="mt-6"
    >
      {{ ctaLabel }}
    </UButton>
  </div>
</template>
