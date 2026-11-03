<script setup lang="ts">
/**
 * TF.1 — Carte « Parcours & qualifications » de l'éditeur de page coach,
 * extraite de `coach-page.vue`. Elle ne fait que relayer : l'état du formulaire
 * vit dans `ProviderCredentialsEditor` (qui l'émet), et l'enregistrement reste
 * dans la page (`onSaveCredentials` — filtre des titres vides puis
 * `updateAccount({ credentials })`).
 */
import type { CredentialItem } from '~/features/account/api/provider-account.contract'
import ProviderCredentialsEditor from '~/components/organisms/ProviderCredentialsEditor.vue'

defineProps<{
  credentials: CredentialItem[]
  saving: boolean
}>()

const emit = defineEmits<{
  'update:credentials': [value: CredentialItem[]]
  'save': []
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <p class="text-sm text-[color:var(--color-brand-secondary)]">
      Vos formations et accréditations professionnelles, affichées sur votre page publique.
    </p>
    <ProviderCredentialsEditor
      :credentials="credentials"
      @update:credentials="emit('update:credentials', $event)"
    />
  </div>
  <div class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4">
    <UButton
      color="primary"
      variant="solid"
      size="sm"
      :loading="saving"
      @click="emit('save')"
    >
      Enregistrer
    </UButton>
  </div>
</template>
