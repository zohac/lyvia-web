<template>
  <button @click="notify">
    {{ useToastNow().length }}
  </button>
</template>

<script setup lang="ts">
// Fixture : composable global absent. Dans un module Nuxt, `useToast` est
// injecté par le plugin ; hors contexte il n'existe pas et le `setup` lève un
// `ReferenceError`. Le harnais doit le signaler, pas rendre un vide.
const useToastNow = undefined as unknown as () => string[]
const notify = () => undefined
</script>
