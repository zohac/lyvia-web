<script setup lang="ts">
import '~/assets/css/dashboard.css'
import { useAuthState } from '../features/auth/state/auth.state'
import ProviderSupportLayout from './provider-support.vue'
import ProviderStandardLayout from './provider-standard.vue'

const authState = useAuthState()
const isSupportSession = computed(() => {
  const session = authState.value.supportSession
  return session != null && (session.phase === 'active' || session.phase === 'ending' || session.phase === 'restoring')
})
</script>

<template>
  <ProviderSupportLayout v-if="isSupportSession">
    <slot />
  </ProviderSupportLayout>
  <ProviderStandardLayout v-else>
    <slot />
  </ProviderStandardLayout>
</template>
