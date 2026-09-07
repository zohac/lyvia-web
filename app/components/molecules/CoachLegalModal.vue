<script setup lang="ts">
import type { PublicTenantResponse } from '~/features/onboarding/api/onboarding.contract'

const props = defineProps<{
  open: boolean
  tenant?: PublicTenantResponse | null
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()

const coachName = computed(() =>
  props.tenant?.legalInfo?.companyName || props.tenant?.brand?.displayName || 'La praticienne'
)

const directorName = computed(() =>
  props.tenant?.legalInfo?.director || props.tenant?.brand?.displayName || 'La praticienne'
)
</script>

<template>
  <UModal
    :open="props.open"
    :title="`Mentions légales — ${coachName}`"
    :ui="{
      footer: 'justify-end'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-6 text-sm text-[color:var(--color-text-primary)]">
        <div>
          <h3 class="text-base font-semibold text-[color:var(--color-brand-primary)]">
            Informations professionnelles
          </h3>
          <ul class="mt-2 space-y-2 text-xs sm:text-sm">
            <li>
              <strong>Nom / Dénomination :</strong> {{ coachName }}
            </li>
            <li>
              <strong>Statut juridique :</strong> Profession libérale / Praticienne indépendante
            </li>
            <li v-if="tenant?.legalInfo?.siret">
              <strong>SIRET :</strong> {{ tenant.legalInfo.siret }}
            </li>
            <li v-if="tenant?.legalInfo?.address">
              <strong>Adresse professionnelle :</strong> {{ tenant.legalInfo.address }}
            </li>
            <li v-if="tenant?.legalInfo?.rcpInsurance">
              <strong>Assurance RCP :</strong> {{ tenant.legalInfo.rcpInsurance }}
            </li>
            <li>
              <strong>Directrice de la publication :</strong> {{ directorName }}
            </li>
            <li v-if="tenant?.legalInfo?.email">
              <strong>Contact email :</strong> {{ tenant.legalInfo.email }}
            </li>
          </ul>
        </div>

        <div class="rounded-lg bg-[color:var(--color-surface-elevated)] p-4 text-xs text-[color:var(--color-brand-muted)] border border-[color:var(--color-brand-subtle)]">
          <p class="font-medium text-[color:var(--color-text-primary)]">
            Hébergement et intermédiaire technique
          </p>
          <p class="mt-1">
            La praticienne exerce son activité sous sa propre responsabilité professionnelle.
            La plateforme technique, le système de prise de rendez-vous et l'hébergement du site
            sont fournis par <strong>Keova</strong> (Simon JOUAN EI).
          </p>
          <div class="mt-3 flex flex-wrap gap-4 font-semibold text-[color:var(--color-brand-primary)]">
            <NuxtLink
              to="/legal/mentions-legales"
              class="hover:underline"
              @click="emit('update:open', false)"
            >
              Mentions légales Keova
            </NuxtLink>
            <NuxtLink
              to="/legal/cgu"
              class="hover:underline"
              @click="emit('update:open', false)"
            >
              CGU de la plateforme
            </NuxtLink>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <UButton
        color="neutral"
        variant="outline"
        @click="emit('update:open', false)"
      >
        Fermer
      </UButton>
    </template>
  </UModal>
</template>
