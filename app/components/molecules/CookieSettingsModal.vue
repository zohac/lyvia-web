<script setup lang="ts">
const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
}>()
</script>

<template>
  <UModal
    :open="props.open"
    title="Cookies"
    :ui="{
      footer: 'justify-end'
    }"
    @update:open="emit('update:open', $event)"
  >
    <template #body>
      <div class="space-y-4">
        <p class="text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
          Ce site utilise uniquement des cookies essentiels au fonctionnement du service.
        </p>

        <div class="space-y-2">
          <div class="flex items-start gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-3">
            <UIcon
              name="i-lucide-lock"
              class="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand-muted)]"
            />
            <div>
              <p class="text-sm font-medium text-[color:var(--color-brand-primary)]">
                Authentification
              </p>
              <p class="text-xs text-[color:var(--color-brand-muted)]">
                Maintient votre connexion securisee
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-3">
            <UIcon
              name="i-lucide-calendar"
              class="mt-0.5 h-4 w-4 shrink-0 text-[color:var(--color-brand-muted)]"
            />
            <div>
              <p class="text-sm font-medium text-[color:var(--color-brand-primary)]">
                Rendez-vous
              </p>
              <p class="text-xs text-[color:var(--color-brand-muted)]">
                Sauvegarde temporaire de votre reservation en cours
              </p>
            </div>
          </div>
        </div>

        <p class="text-xs text-[color:var(--color-brand-muted)]">
          Aucun cookie de tracking ou d'analyse n'est utilise.
        </p>

        <NuxtLink
          to="/legal/confidentialite"
          class="inline-flex items-center gap-1 text-xs text-[color:var(--color-brand-muted)] underline hover:text-[color:var(--color-brand-secondary)]"
          @click="emit('update:open', false)"
        >
          <UIcon
            name="i-lucide-external-link"
            class="h-3 w-3"
          />
          Politique de confidentialite
        </NuxtLink>
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
