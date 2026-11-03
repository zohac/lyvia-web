<template>
  <span data-testid="ambiguous-parent">{{ AMBIGUOUS_ORIGIN }}</span>
</template>

<script setup lang="ts">
// Fixture 0-42 : import sans extension d'un nom qui existe en `.ts` et en `.vue`.
import { AMBIGUOUS_ORIGIN } from './ambiguous-source'
</script>
