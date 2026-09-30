<script setup lang="ts">
import BlockText, { type TextBlockData } from '~/components/atoms/BlockText.vue'
import BlockImage, { type ImageBlockData } from '~/components/atoms/BlockImage.vue'

export type ContentBlock
  = | { type: 'text', data: TextBlockData }
    | { type: 'image', data: ImageBlockData }
    | { type: string, data: unknown }

defineProps<{
  blocks: ContentBlock[]
}>()
</script>

<template>
  <div class="page-blocks max-w-3xl sm:max-w-4xl mx-auto w-full space-y-8 sm:space-y-12">
    <template
      v-for="(block, index) in blocks"
      :key="index"
    >
      <BlockText
        v-if="block.type === 'text'"
        :data="block.data as TextBlockData"
      />
      <BlockImage
        v-else-if="block.type === 'image'"
        :data="block.data as ImageBlockData"
      />
    </template>
  </div>
</template>
