<script setup lang="ts">
import { useClientPreferences } from '../../features/preferences/useClientPreferences'
import { buildContactConsentDateRows } from '../../features/consent/contact-consent'

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

/**
 * Each channel's own date (cc-1b). A single shared line used to describe the
 * profile, not the channel she is looking at, so a change to one box appeared to
 * date the other. The row building lives in the pure consent rule
 * (`buildContactConsentDateRows`) so it can be executed by a test — the
 * crossed-date defect must not be able to come back with a green suite.
 */
const consentDateRows = computed(() => buildContactConsentDateRows(preferences.value))

async function handleEmailToggle(value: boolean) {
  await updatePreferences({ emailMarketingOptIn: value })
}

async function handleSmsToggle(value: boolean) {
  await updatePreferences({ smsMarketingOptIn: value })
}
</script>

<template>
  <div class="space-y-6">
    <!-- Loading State -->
    <div
      v-if="loading"
      class="flex items-center justify-center py-16"
    >
      <div class="flex flex-col items-center gap-4">
        <USkeleton class="h-10 w-10 rounded-full" />
        <p class="text-sm text-[color:var(--color-brand-muted)]">
          Chargement de vos préférences...
        </p>
      </div>
    </div>

    <!-- Error State -->
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

        <!-- Per-channel change dates -->
        <div
          v-if="consentDateRows.length > 0"
          class="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-muted)]"
        >
          <UIcon
            name="i-lucide-clock"
            class="h-3.5 w-3.5"
          />
          <span
            v-for="row in consentDateRows"
            :key="row.channel"
          >
            {{ row.label }} le {{ row.dateLabel }}
          </span>
        </div>
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
  </div>
</template>
