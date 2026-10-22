<template>
  <p>{{ value }}</p>
</template>

<script setup lang="ts">
import { ref } from 'vue'

// Fixture : un `setup` qui lève. Le harnais DOIT rejeter, sinon la sortie vaut
// `"<!---->"` et toute assertion négative passe au vert sans rien prouver.
const value = ref('inattendu')
throw new Error('boom')
</script>
