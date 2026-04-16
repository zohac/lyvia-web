<script setup lang="ts">
interface DsPageHeaderProps {
  title?: string
  subtitle?: string
  accentBar?: boolean
}

withDefaults(defineProps<DsPageHeaderProps>(), {
  title: undefined,
  subtitle: undefined,
  accentBar: true
})
</script>

<template>
  <div class="flex items-start gap-4">
    <div
      v-if="accentBar"
      class="mt-1 h-12 w-1 shrink-0 rounded-full bg-gradient-to-b from-[color:var(--color-brand-primary)] to-[color:var(--color-brand-accent)]"
    />
    <div class="min-w-0 flex-1">
      <div class="flex flex-wrap items-start justify-between gap-4">
        <div class="min-w-0">
          <div
            v-if="$slots.back"
            class="mb-2"
          >
            <slot name="back" />
          </div>
          <h1 class="font-[family-name:var(--font-serif)] text-3xl font-bold italic text-[color:var(--color-text-primary)] lg:text-4xl">
            <slot>
              {{ title }}
            </slot>
          </h1>
          <p
            v-if="subtitle || $slots.subtitle"
            class="mt-2 text-base text-[color:var(--color-text-muted)]"
          >
            <slot name="subtitle">
              {{ subtitle }}
            </slot>
          </p>
        </div>
        <div
          v-if="$slots.actions"
          class="flex shrink-0 items-center gap-3"
        >
          <slot name="actions" />
        </div>
      </div>
    </div>
  </div>
</template>
