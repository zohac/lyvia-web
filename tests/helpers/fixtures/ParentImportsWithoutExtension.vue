<template>
  <div data-testid="parent-no-ext">
    <ChildComponent />
  </div>
</template>

<script setup lang="ts">
// Fixture 0-42 : import SANS extension. Exerce le candidat `${basePath}.vue`
// de `resolveWithExtension`, que l'import suffixé ne touche pas.
import ChildComponent from './ChildComponent'
</script>
