<template>
  <span>{{ label }}</span>
</template>

<script setup lang="ts">
// Fixture 0-42 : import non exécutable par le harnais. Il doit échouer
// bruyamment, pas produire un module vide en silence.
import data from './data.json'

const label = (data as { label?: string }).label ?? ''
</script>
