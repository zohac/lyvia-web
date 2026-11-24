<template>
  <span class="content-body whitespace-pre-line">
    <template
      v-for="(segment, index) in segments"
      :key="index"
    >
      <template v-if="segment.type === 'link'">
        <a
          :href="segment.href"
          target="_blank"
          rel="noopener noreferrer"
          class="underline"
        >{{ segment.text }}<span class="sr-only">(nouvel onglet)</span></a>
      </template>
      <template v-else>{{ segment.text }}</template>
    </template>
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { linkify } from '~/features/contents/domain/linkify'

const props = defineProps<{
  text: string | null
}>()

const segments = computed(() => linkify(props.text))
</script>
