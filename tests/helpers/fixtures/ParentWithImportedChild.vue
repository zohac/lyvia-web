<template>
  <div data-testid="imported-parent">
    <ChildWithImports />
  </div>
</template>

<script setup lang="ts">
// Fixture 0-42 : parent d'un enfant qui importe lui-même un module `.ts`.
import ChildWithImports from './ChildWithImports.vue'
</script>
