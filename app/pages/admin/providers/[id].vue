<template>
  <div>
    <!-- Page Header -->
    <section class="relative mb-10 flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <NuxtLink
          to="/admin/providers"
          class="group mb-2 inline-flex items-center gap-2 text-sm text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-primary)]"
        >
          <UIcon
            name="lucide:arrow-left"
            size="16"
            class="transition-transform group-hover:-translate-x-1"
          />
          Retour aux providers
        </NuxtLink>
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Détail Provider
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Gestion et synchronisation Stripe Connect
        </p>
      </div>
    </section>

    <!-- Loading State -->
    <div
      v-if="pending"
      class="flex items-center justify-center py-20"
    >
      <UIcon
        name="lucide:loader-2"
        size="32"
        class="animate-spin text-[color:var(--color-brand-muted)]"
      />
    </div>

    <!-- Error State -->
    <div
      v-else-if="error"
      class="rounded-blob-b border border-red-200 bg-red-50 p-8 text-center"
    >
      <UIcon
        name="lucide:alert-circle"
        size="48"
        class="mx-auto mb-4 text-red-500"
      />
      <p class="text-lg font-medium text-red-800">
        {{ error.message || 'Provider introuvable' }}
      </p>
      <NuxtLink
        to="/admin/providers"
        class="mt-4 inline-flex items-center gap-2 text-sm text-red-600 underline"
      >
        Retour à la liste
      </NuxtLink>
    </div>

    <!-- Content -->
    <div
      v-else-if="provider"
      class="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-10"
    >
      <!-- Main Content -->
      <div class="space-y-8 lg:col-span-8">
        <!-- Provider Info Card -->
        <section class="relative overflow-hidden rounded-blob-a border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-kaora-50)]/55 p-8 shadow-soft">
          <div class="pointer-events-none absolute right-[-10%] top-[-35%] h-[24rem] w-[24rem] rounded-full bg-[color:var(--color-kaora-100)] opacity-45 blur-[100px]" />

          <div class="relative z-10">
            <div class="flex items-start justify-between gap-4">
              <div class="grid gap-2">
                <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                  Informations
                </h2>
                <p class="text-sm text-[color:var(--color-brand-secondary)]">
                  Données du provider depuis la base de données
                </p>
              </div>
              <span class="inline-flex items-center gap-2 rounded-full bg-[rgba(212,184,160,0.15)] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-accent)]">
                <span class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-accent)]" />
                {{ provider.timezone }}
              </span>
            </div>

            <dl class="mt-6 grid gap-4 sm:grid-cols-2">
              <div class="rounded-2xl bg-white/60 p-4 backdrop-blur">
                <dt class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Provider ID
                </dt>
                <dd class="mt-1 font-mono text-sm text-[color:var(--color-brand-primary)]">
                  {{ provider.providerId }}
                </dd>
              </div>
              <div class="rounded-2xl bg-white/60 p-4 backdrop-blur">
                <dt class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Timezone
                </dt>
                <dd class="mt-1 text-sm text-[color:var(--color-brand-primary)]">
                  {{ provider.timezone }}
                </dd>
              </div>
            </dl>
          </div>
        </section>

        <!-- Stripe Connect Card -->
        <section class="relative overflow-hidden rounded-blob-b border border-[rgba(28,25,23,0.10)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <div class="flex items-start justify-between gap-4">
            <div class="grid gap-2">
              <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
                Stripe Connect
              </h2>
              <p class="text-sm text-[color:var(--color-brand-secondary)]">
                Statut du compte Connect Express du provider
              </p>
            </div>

            <!-- Sync Button -->
            <UButton
              color="primary"
              variant="solid"
              size="sm"
              :loading="syncPending"
              :disabled="!provider.stripe.stripeAccountId"
              class="rounded-full"
              @click="onSyncStripe"
            >
              <UIcon
                name="lucide:refresh-cw"
                size="16"
                :class="{ 'animate-spin': syncPending }"
              />
              <span class="hidden sm:inline">Synchroniser</span>
            </UButton>
          </div>

          <!-- Success Toast -->
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="syncSuccess"
              class="mt-4 flex items-center gap-2 rounded-full bg-[color:var(--color-success-100)] px-4 py-2 text-sm font-medium text-[color:var(--color-success-700)]"
            >
              <UIcon
                name="lucide:check-circle"
                size="16"
              />
              Synchronisation réussie — données mises à jour depuis Stripe
            </div>
          </Transition>

          <!-- Sync Error -->
          <Transition
            enter-active-class="transition duration-300 ease-out"
            enter-from-class="opacity-0 translate-y-2"
            enter-to-class="opacity-100 translate-y-0"
            leave-active-class="transition duration-200 ease-in"
            leave-from-class="opacity-100 translate-y-0"
            leave-to-class="opacity-0 translate-y-2"
          >
            <div
              v-if="syncError"
              class="mt-4 flex items-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              <UIcon
                name="lucide:alert-triangle"
                size="16"
                class="flex-shrink-0"
              />
              {{ syncError }}
            </div>
          </Transition>

          <!-- No Stripe Account -->
          <div
            v-if="!provider.stripe.stripeAccountId"
            class="mt-6 rounded-2xl border border-dashed border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)]/50 p-6 text-center"
          >
            <UIcon
              name="lucide:link-2-off"
              size="32"
              class="mx-auto mb-3 text-[color:var(--color-brand-muted)]"
            />
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Aucun compte Stripe Connect lié à ce provider
            </p>
          </div>

          <!-- Stripe Data Grid -->
          <div
            v-else
            class="mt-6 space-y-6"
          >
            <!-- Account ID -->
            <div class="rounded-2xl bg-[color:var(--color-surface-highlight)]/50 p-4">
              <dt class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Account ID
              </dt>
              <dd class="mt-1 font-mono text-sm text-[color:var(--color-brand-primary)]">
                {{ provider.stripe.stripeAccountId }}
              </dd>
            </div>

            <!-- Status Grid -->
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-2xl bg-white p-4 shadow-sm">
                <dt class="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Charges
                </dt>
                <dd class="flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      provider.stripe.chargesEnabled
                        ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
                        : 'bg-red-100 text-red-700'
                    ]"
                  >
                    <UIcon
                      :name="provider.stripe.chargesEnabled ? 'lucide:check' : 'lucide:x'"
                      size="14"
                    />
                  </span>
                  <span class="text-sm text-[color:var(--color-brand-secondary)]">
                    {{ provider.stripe.chargesEnabled ? 'Activé' : 'Désactivé' }}
                  </span>
                </dd>
              </div>

              <div class="rounded-2xl bg-white p-4 shadow-sm">
                <dt class="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Payouts
                </dt>
                <dd class="flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      provider.stripe.payoutsEnabled
                        ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
                        : 'bg-red-100 text-red-700'
                    ]"
                  >
                    <UIcon
                      :name="provider.stripe.payoutsEnabled ? 'lucide:check' : 'lucide:x'"
                      size="14"
                    />
                  </span>
                  <span class="text-sm text-[color:var(--color-brand-secondary)]">
                    {{ provider.stripe.payoutsEnabled ? 'Activé' : 'Désactivé' }}
                  </span>
                </dd>
              </div>

              <div class="rounded-2xl bg-white p-4 shadow-sm">
                <dt class="mb-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Details
                </dt>
                <dd class="flex items-center gap-2">
                  <span
                    :class="[
                      'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                      provider.stripe.detailsSubmitted
                        ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]'
                        : 'bg-amber-100 text-amber-700'
                    ]"
                  >
                    <UIcon
                      :name="provider.stripe.detailsSubmitted ? 'lucide:check' : 'lucide:clock'"
                      size="14"
                    />
                  </span>
                  <span class="text-sm text-[color:var(--color-brand-secondary)]">
                    {{ provider.stripe.detailsSubmitted ? 'Soumis' : 'En attente' }}
                  </span>
                </dd>
              </div>
            </div>

            <!-- Disabled Reason -->
            <div
              v-if="provider.stripe.disabledReason"
              class="rounded-2xl border border-red-300 bg-red-50 p-4"
            >
              <dt class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700">
                <UIcon
                  name="lucide:alert-octagon"
                  size="14"
                />
                Compte désactivé
              </dt>
              <dd class="font-mono text-xs text-red-800">
                {{ provider.stripe.disabledReason }}
              </dd>
            </div>

            <!-- Requirements Past Due (Critical) -->
            <div
              v-if="provider.stripe.requirementsPastDue.length > 0"
              class="rounded-2xl border border-red-200 bg-red-50 p-4"
            >
              <dt class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700">
                <UIcon
                  name="lucide:alert-triangle"
                  size="14"
                />
                Requirements Past Due ({{ provider.stripe.requirementsPastDue.length }})
              </dt>
              <dd>
                <ul class="space-y-2">
                  <li
                    v-for="req in provider.stripe.requirementsPastDue"
                    :key="req"
                  >
                    <p class="text-sm text-red-800">
                      {{ mapRequirementKeyToMessage(req) }}
                    </p>
                    <p class="font-mono text-xs text-red-600/70">
                      {{ req }}
                    </p>
                  </li>
                </ul>
              </dd>
            </div>

            <!-- Requirements Currently Due -->
            <div
              v-if="provider.stripe.requirementsDue.length > 0"
              class="rounded-2xl border border-amber-200 bg-amber-50 p-4"
            >
              <dt class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                <UIcon
                  name="lucide:alert-circle"
                  size="14"
                />
                Requirements Due ({{ provider.stripe.requirementsDue.length }})
              </dt>
              <dd>
                <ul class="space-y-2">
                  <li
                    v-for="req in provider.stripe.requirementsDue"
                    :key="req"
                  >
                    <p class="text-sm text-amber-800">
                      {{ mapRequirementKeyToMessage(req) }}
                    </p>
                    <p class="font-mono text-xs text-amber-600/70">
                      {{ req }}
                    </p>
                  </li>
                </ul>
              </dd>
            </div>

            <!-- Requirements Eventually Due -->
            <div
              v-if="provider.stripe.requirementsEventuallyDue.length > 0"
              class="rounded-2xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)]/50 p-4"
            >
              <dt class="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                <UIcon
                  name="lucide:info"
                  size="14"
                />
                Requirements Eventually Due ({{ provider.stripe.requirementsEventuallyDue.length }})
              </dt>
              <dd>
                <ul class="space-y-2">
                  <li
                    v-for="req in provider.stripe.requirementsEventuallyDue"
                    :key="req"
                  >
                    <p class="text-sm text-[color:var(--color-brand-secondary)]">
                      {{ mapRequirementKeyToMessage(req) }}
                    </p>
                    <p class="font-mono text-xs text-[color:var(--color-brand-muted)]">
                      {{ req }}
                    </p>
                  </li>
                </ul>
              </dd>
            </div>

            <!-- Onboarding Completed -->
            <div
              v-if="provider.stripe.onboardingCompletedAt"
              class="rounded-2xl bg-[color:var(--color-success-50)] p-4"
            >
              <dt class="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-success-700)]">
                Onboarding complété
              </dt>
              <dd class="text-sm text-[color:var(--color-success-800)]">
                {{ formatDate(provider.stripe.onboardingCompletedAt) }}
              </dd>
            </div>
          </div>
        </section>
      </div>

      <!-- Sidebar -->
      <aside class="space-y-8 lg:col-span-4">
        <!-- Debug Info -->
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Debug
          </p>
          <dl class="mt-4 space-y-4 text-sm">
            <div>
              <dt class="text-[color:var(--color-brand-muted)]">
                Requirements count
              </dt>
              <dd class="font-mono text-[color:var(--color-brand-primary)]">
                {{ provider.debug.requirementsDueCount }}
              </dd>
            </div>
            <div>
              <dt class="text-[color:var(--color-brand-muted)]">
                Dernier webhook
              </dt>
              <dd class="font-mono text-[color:var(--color-brand-primary)]">
                {{ provider.debug.lastWebhookAt ? formatDate(provider.debug.lastWebhookAt) : '—' }}
              </dd>
            </div>
          </dl>
        </div>

        <!-- Actions -->
        <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-8 shadow-soft backdrop-blur">
          <p class="text-xs font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
            Actions
          </p>
          <div class="mt-4 space-y-3">
            <UButton
              v-if="provider.stripe.stripeAccountId"
              variant="outline"
              color="neutral"
              block
              class="justify-start rounded-full"
              :href="`https://dashboard.stripe.com/connect/accounts/${provider.stripe.stripeAccountId}`"
              target="_blank"
            >
              <UIcon
                name="lucide:external-link"
                size="16"
              />
              Voir sur Stripe Dashboard
            </UButton>
            <UButton
              variant="ghost"
              color="neutral"
              block
              class="justify-start rounded-full"
              @click="() => refresh()"
            >
              <UIcon
                name="lucide:refresh-cw"
                size="16"
              />
              Rafraîchir les données
            </UButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>

<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { mapRequirementKeyToMessage } from '~/features/finance/domain/finance-state'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Détail Provider'
})

const route = useRoute()
const providerId = computed(() => route.params.id as string)

type AdminProviderStripeStatus = {
  providerId: string
  timezone: string
  stripe: {
    stripeAccountId: string | null
    chargesEnabled: boolean
    payoutsEnabled: boolean
    detailsSubmitted: boolean
    requirementsDue: string[]
    requirementsEventuallyDue: string[]
    requirementsPastDue: string[]
    disabledReason: string | null
    onboardingCompletedAt: string | null
  }
  debug: {
    requirementsDueCount: number
    lastWebhookAt: string | null
  }
}

const { data: provider, pending, error, refresh } = await useAsyncData<AdminProviderStripeStatus>(
  `admin-provider-${providerId.value}`,
  () => apiFetch<AdminProviderStripeStatus>(`/admin/providers/${providerId.value}/stripe/status`)
)

const syncPending = ref(false)
const syncSuccess = ref(false)
const syncError = ref<string | null>(null)

async function onSyncStripe() {
  syncPending.value = true
  syncSuccess.value = false
  syncError.value = null

  try {
    await apiFetch(`/admin/providers/${providerId.value}/stripe/sync`, {
      method: 'POST'
    })
    syncSuccess.value = true
    await refresh()

    // Auto-hide success message after 5s
    setTimeout(() => {
      syncSuccess.value = false
    }, 5000)
  } catch (err) {
    syncError.value = err instanceof Error ? err.message : 'Erreur lors de la synchronisation'
  } finally {
    syncPending.value = false
  }
}

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoString))
}
</script>
