<template>
  <div data-testid="broken-parent">
    <BrokenChild />
  </div>
</template>

<script setup lang="ts">
// Fixture 0-42 : parent d'un enfant dont le template ne compile pas.
import BrokenChild from './BrokenChild.vue'
</script>
