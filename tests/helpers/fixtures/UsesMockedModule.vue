<template>
  <p>{{ LABEL }}</p>
</template>

<script setup lang="ts">
import { LABEL } from '~/features/waitlist/waitlist-labels'

// Fixture : prouve que `options.mocks` remplace le module par chemin. Sans cela
// le harnais chargerait le vrai module, qui tire `apiFetch` et `import.meta`.
</script>
