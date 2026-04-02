<script setup lang="ts">
import { useClientPreferences } from '../../features/preferences/useClientPreferences'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Paramètres'
})

const {
  preferences,
  loading,
  saving,
  error,
  fetchPreferences,
  updatePreferences
} = useClientPreferences()

onMounted(() => {
  fetchPreferences()
})

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

async function handleEmailToggle(value: boolean) {
  await updatePreferences({ emailMarketingOptIn: value })
}

async function handleSmsToggle(value: boolean) {
  await updatePreferences({ smsMarketingOptIn: value })
}
</script>

<template>
  <section class="grid gap-6">
    <AtomsDsPageHeader
      title="Paramètres"
      subtitle="Gérez vos préférences de communication et vos consentements."
    />

    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="relative h-10 w-10">
          <div class="absolute inset-0 animate-ping rounded-full bg-[color:var(--color-crepuscule-200)] opacity-75" />
          <div class="relative h-10 w-10 animate-spin rounded-full border-2 border-[color:var(--color-brand-subtle)] border-t-[color:var(--color-brand-primary)]" />
        </div>
        <p class="text-sm text-[color:var(--color-brand-muted)]">
          Chargement de vos préférences...
        </p>
      </div>
    </div>

    <!-- Error State (no data) -->
    <AtomsDsErrorState
      v-else-if="error && !preferences"
      :message="error"
      @retry="fetchPreferences()"
    />

    <!-- Content -->
    <template v-else-if="preferences">
      <!-- Communications Card -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-mail"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div class="min-w-0 flex-1">
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Communications
            </h2>
            <p class="mt-1 text-sm leading-relaxed text-[color:var(--color-brand-secondary)]">
              Les confirmations et rappels de rendez-vous sont toujours envoyés.
              Ces préférences concernent uniquement les communications de suivi élargi.
            </p>
          </div>
        </div>

        <div class="mt-8 space-y-1">
          <!-- Email Marketing Toggle -->
          <div class="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 transition-colors hover:bg-[color:var(--color-surface-highlight)]/50">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-[color:var(--color-brand-primary)]">
                Emails de suivi
              </p>
              <p class="mt-0.5 text-sm text-[color:var(--color-brand-secondary)]">
                Conseils, contenus et rappels mensuels
              </p>
            </div>
            <USwitch
              :model-value="preferences.emailMarketingOptIn"
              :loading="saving"
              :disabled="saving"
              @update:model-value="handleEmailToggle"
            />
          </div>

          <div class="mx-4 border-t border-[color:var(--color-brand-subtle)]" />

          <!-- SMS Marketing Toggle -->
          <div class="group flex items-center justify-between gap-4 rounded-[var(--radius-md)] p-4 transition-colors hover:bg-[color:var(--color-surface-highlight)]/50">
            <div class="min-w-0 flex-1">
              <p class="font-medium text-[color:var(--color-brand-primary)]">
                SMS de suivi
              </p>
              <p class="mt-0.5 text-sm text-[color:var(--color-brand-secondary)]">
                <template v-if="preferences.hasPhone">
                  Rappels et conseils par SMS
                </template>
                <template v-else>
                  <span class="inline-flex items-center gap-1 text-[color:var(--color-warning)]">
                    <UIcon
                      name="i-lucide-info"
                      class="h-3.5 w-3.5"
                    />
                    Numéro de téléphone requis
                  </span>
                </template>
              </p>
            </div>
            <USwitch
              :model-value="preferences.smsMarketingOptIn"
              :loading="saving"
              :disabled="saving || !preferences.hasPhone"
              @update:model-value="handleSmsToggle"
            />
          </div>
        </div>

        <!-- Error message -->
        <div
          v-if="error"
          class="mt-6 flex items-center gap-3 rounded-[var(--radius-sm)] bg-[color:var(--color-error)]/10 px-4 py-3 text-sm text-[color:var(--color-error)]"
        >
          <UIcon
            name="i-lucide-alert-circle"
            class="h-4 w-4 shrink-0"
          />
          <p>{{ error }}</p>
        </div>

        <!-- Last updated -->
        <p
          v-if="preferences.consentUpdatedAt"
          class="mt-6 flex items-center gap-2 text-xs text-[color:var(--color-brand-muted)]"
        >
          <UIcon
            name="i-lucide-clock"
            class="h-3.5 w-3.5"
          />
          Dernière modification : {{ formatDate(preferences.consentUpdatedAt) }}
        </p>
      </div>

      <!-- Info Card -->
      <div class="flex items-start gap-3 rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)] p-4">
        <UIcon
          name="i-lucide-shield-check"
          class="mt-0.5 h-5 w-5 shrink-0 text-[color:var(--color-brand-muted)]"
        />
        <div class="text-sm text-[color:var(--color-brand-secondary)]">
          <p class="font-medium text-[color:var(--color-brand-primary)]">
            Vos données sont protégées
          </p>
          <p class="mt-1">
            Conformément au RGPD, vous pouvez modifier vos préférences à tout moment.
            Les emails essentiels (confirmations de RDV, rappels) ne sont pas concernés par ces réglages.
          </p>
        </div>
      </div>
    </template>
  </section>
</template>
