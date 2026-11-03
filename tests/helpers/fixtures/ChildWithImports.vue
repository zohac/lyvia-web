<template>
  <span data-testid="child-with-imports">{{ CHILD_MODULE_LABEL }}:{{ globalLabel }}</span>
</template>

<script setup lang="ts">
// Fixture 0-42 : enfant qui importe un module `.ts` ET lit une globale injectée
// (`options.globals`) — la forme réelle des enfants que la story doit débloquer.
import { CHILD_MODULE_LABEL } from './child-label'

const globalLabel = useHarnessGlobal()
</script>
