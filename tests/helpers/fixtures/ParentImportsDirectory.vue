<template>
  <div data-testid="parent-directory">
    <NestedIndex />
  </div>
</template>

<script setup lang="ts">
// Fixture 0-42 : import d'un répertoire. Exerce le candidat `index.vue`.
import NestedIndex from './nested'
</script>
