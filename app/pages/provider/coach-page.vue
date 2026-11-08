<script setup lang="ts">
import CoachPageEditorShell from '~/components/organisms/CoachPageEditorShell.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Ma page coach'
})
</script>

<template>
  <CoachPageEditorShell />
</template>
