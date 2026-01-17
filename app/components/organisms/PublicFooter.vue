<script setup lang="ts">
import { usePublicHeaderState } from '../../features/public/state/public-header.state'
import LegalFooterLinks from '../atoms/LegalFooterLinks.vue'

const headerState = usePublicHeaderState()
const currentYear = new Date().getFullYear()

const footerLine = computed(() => {
  if (headerState.value.variant === 'coach') return 'Propulsé par Kaora'
  if (headerState.value.variant === 'marketing') return 'Fait avec soin pour les pros du soin.'
  return null
})
</script>

<template>
  <footer class="border-t border-[color:var(--color-brand-subtle)]">
    <div class="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-10 text-center text-sm text-[color:var(--color-brand-muted)] sm:px-6">
      <p class="font-semibold uppercase tracking-widest">
        © {{ currentYear }} {{ headerState.variant === 'white-label' ? headerState.brandLabel : 'Kaora' }}
      </p>
      <p v-if="footerLine">
        {{ footerLine }}
      </p>
      <ULink
        :to="headerState.loginTo"
        class="font-semibold hover:underline"
      >
        {{ headerState.loginLabel }}
      </ULink>

      <LegalFooterLinks class="mt-2" />
    </div>
  </footer>
</template>
