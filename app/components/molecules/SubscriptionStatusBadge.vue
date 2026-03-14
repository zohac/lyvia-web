<script setup lang="ts">
/**
 * X3.3 AC-7: Badge statut souscription programme.
 *
 * active=vert, frozen=orange, completed=gris, expired=rouge, cancelled=rouge.
 */
import type { ProgramSubscriptionStatus } from '../../features/programs/api/program-subscription.contract'
import { SUBSCRIPTION_STATUS_META } from '../../features/programs/domain/programs'

const props = defineProps<{
  status: ProgramSubscriptionStatus
}>()

const meta = computed(() => SUBSCRIPTION_STATUS_META[props.status])
</script>

<template>
  <UBadge
    :color="meta.color"
    variant="soft"
    size="sm"
  >
    {{ meta.label }}
  </UBadge>
</template>
