<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { SeoFieldValues } from '~/types/seo.types'
import { apiFetch } from '~/services/api/apiFetch'
import { mapRequirementKeyToMessage } from '~/features/finance/domain/finance-state'
import AdminSeoForm from '~/components/organisms/AdminSeoForm.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Détail Provider'
})

const route = useRoute()
const toast = useToast()
const providerId = computed(() => route.params.id as string)

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

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

type AdminSeoEntry = {
  targetType: string
  targetId: string | null
  label: string
  providerConfig: SeoFieldValues | null
  adminConfig: SeoFieldValues | null
  resolvedConfig: SeoFieldValues
}

// ──────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────

const { data: provider, pending, error, refresh } = await useAsyncData<AdminProviderStripeStatus>(
  `admin-provider-${providerId.value}`,
  () => apiFetch<AdminProviderStripeStatus>(`/admin/providers/${providerId.value}/stripe/status`)
)

const { data: allSeoEntries, status: seoStatus, refresh: refreshSeo } = await useAsyncData<AdminSeoEntry[]>(
  `admin-seo-provider-${providerId.value}`,
  () => apiFetch<AdminSeoEntry[]>('/admin/seo')
)

// ──────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────

const providerSeoEntries = computed(() =>
  allSeoEntries.value?.filter(e => e.targetId === providerId.value) ?? []
)

const providerDisplayName = computed(() => {
  const entry = providerSeoEntries.value[0]
  return entry ? entry.label.split(' — ')[0] : null
})

const stripeStatusInfo = computed(() => {
  const s = provider.value?.stripe
  if (!s?.stripeAccountId) return { label: 'Stripe non lié', color: 'neutral' as const, dot: 'bg-[color:var(--color-neutral-400)]' }
  if (s.chargesEnabled && s.payoutsEnabled) return { label: 'Stripe actif', color: 'success' as const, dot: 'bg-[color:var(--color-success-500)]' }
  if (s.requirementsPastDue.length > 0) return { label: 'Stripe bloqué', color: 'error' as const, dot: 'bg-red-500' }
  if (s.requirementsDue.length > 0) return { label: `Stripe : ${s.requirementsDue.length} action${s.requirementsDue.length > 1 ? 's' : ''}`, color: 'warning' as const, dot: 'bg-amber-500' }
  return { label: 'Stripe en cours', color: 'neutral' as const, dot: 'bg-[color:var(--color-neutral-400)]' }
})

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────

const tabItems = [
  { label: 'Stripe Connect', icon: 'i-lucide-credit-card', slot: 'stripe' as const },
  { label: 'Référencement', icon: 'i-lucide-globe', slot: 'seo' as const }
] satisfies TabsItem[]

// ──────────────────────────────────────────────
// Actions dropdown
// ──────────────────────────────────────────────

const syncPending = ref(false)

const actionItems = computed(() => [
  [
    {
      label: 'Synchroniser Stripe',
      icon: 'i-lucide-refresh-cw',
      disabled: !provider.value?.stripe.stripeAccountId || syncPending.value,
      onSelect: onSyncStripe
    },
    ...(provider.value?.stripe.stripeAccountId
      ? [{
          label: 'Stripe Dashboard',
          icon: 'i-lucide-external-link',
          onSelect: () => window.open(
            `https://dashboard.stripe.com/connect/accounts/${provider.value!.stripe.stripeAccountId}`,
            '_blank'
          )
        }]
      : []
    )
  ],
  [
    {
      label: 'Rafraîchir tout',
      icon: 'i-lucide-rotate-cw',
      onSelect: () => {
        refresh()
        refreshSeo()
      }
    }
  ]
])

// ──────────────────────────────────────────────
// Stripe sync
// ──────────────────────────────────────────────

async function onSyncStripe() {
  syncPending.value = true
  try {
    await apiFetch(`/admin/providers/${providerId.value}/stripe/sync`, { method: 'POST' })
    toast.add({ title: 'Synchronisation Stripe réussie', color: 'success' })
    await refresh()
  } catch (err) {
    toast.add({
      title: 'Erreur de synchronisation',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    syncPending.value = false
  }
}

// ──────────────────────────────────────────────
// SEO save / restore
// ──────────────────────────────────────────────

const seoSavingMap = ref<Record<string, boolean>>({})

async function saveSeo(targetType: string, patch: SeoFieldValues) {
  seoSavingMap.value[targetType] = true
  try {
    await apiFetch(`/admin/seo/${targetType}/${providerId.value}`, { method: 'PUT', body: patch })
    toast.add({ title: 'Métadonnées SEO mises à jour', color: 'success' })
    await refreshSeo()
  } catch {
    toast.add({ title: 'Erreur lors de la sauvegarde', color: 'error' })
  } finally {
    seoSavingMap.value[targetType] = false
  }
}

const seoRestoringMap = ref<Record<string, boolean>>({})

async function confirmRestoreSeo(targetType: string) {
  if (!window.confirm('Supprimer l\'override admin ? Les valeurs du provider seront restaurées.')) return

  seoRestoringMap.value[targetType] = true
  try {
    await apiFetch(`/admin/seo/${targetType}/${providerId.value}/override`, { method: 'DELETE' })
    toast.add({ title: 'Override supprimé', color: 'success' })
    await refreshSeo()
  } catch {
    toast.add({ title: 'Erreur lors de la suppression', color: 'error' })
  } finally {
    seoRestoringMap.value[targetType] = false
  }
}

// ──────────────────────────────────────────────
// SEO slideover
// ──────────────────────────────────────────────

const seoSlideoverOpen = ref(false)
const selectedSeoEntry = ref<AdminSeoEntry | null>(null)

function openSeoEntry(entry: AdminSeoEntry) {
  selectedSeoEntry.value = entry
  seoSlideoverOpen.value = true
}

// ──────────────────────────────────────────────
// Utilities
// ──────────────────────────────────────────────

function formatDate(isoString: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(new Date(isoString))
}

function truncateSeo(text: string | null, max: number): string {
  if (!text) return '—'
  return text.length > max ? text.slice(0, max) + '...' : text
}

const SEO_TARGET_LABELS: Record<string, string> = {
  coach_profile: 'Page profil',
  coach_booking: 'Page réservation'
}

const SEO_TARGET_ICONS: Record<string, string> = {
  coach_profile: 'i-lucide-user',
  coach_booking: 'i-lucide-calendar-check'
}
</script>

<template>
  <div class="mx-auto max-w-5xl">
    <!-- Back link -->
    <NuxtLink
      to="/admin/providers"
      class="group mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-primary)]"
    >
      <UIcon
        name="lucide:arrow-left"
        size="16"
        class="transition-transform group-hover:-translate-x-1"
      />
      Retour aux providers
    </NuxtLink>

    <!-- Loading -->
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

    <!-- Error -->
    <div
      v-else-if="error"
      class="rounded-2xl border border-red-200 bg-red-50 p-8 text-center"
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
    <template v-else-if="provider">
      <!-- Header Card -->
      <section class="rounded-2xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-crepuscule-50)]/55 p-6 shadow-soft sm:p-8">
        <div class="flex items-start justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[color:var(--color-crepuscule-100)]">
              <UIcon
                name="lucide:user"
                size="28"
                class="text-[color:var(--color-crepuscule-600)]"
              />
            </div>

            <div>
              <h1 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)] sm:text-3xl">
                {{ providerDisplayName || 'Provider' }}
              </h1>

              <!-- Badges -->
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <span
                  :class="[
                    'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
                    stripeStatusInfo.color === 'success' ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]' : '',
                    stripeStatusInfo.color === 'error' ? 'bg-red-100 text-red-700' : '',
                    stripeStatusInfo.color === 'warning' ? 'bg-amber-100 text-amber-700' : '',
                    stripeStatusInfo.color === 'neutral' ? 'bg-[color:var(--color-neutral-100)] text-[color:var(--color-neutral-600)]' : ''
                  ]"
                >
                  <span
                    :class="['h-1.5 w-1.5 rounded-full', stripeStatusInfo.dot]"
                  />
                  {{ stripeStatusInfo.label }}
                </span>

                <span class="inline-flex items-center gap-1.5 rounded-full bg-[rgba(212,184,160,0.15)] px-2.5 py-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-accent)]">
                  {{ provider.timezone }}
                </span>
              </div>

              <!-- IDs -->
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
                <span>
                  ID : <span class="font-mono">{{ provider.providerId }}</span>
                </span>
                <span v-if="provider.stripe.stripeAccountId">
                  Stripe : <span class="font-mono">{{ provider.stripe.stripeAccountId }}</span>
                </span>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <UDropdownMenu :items="actionItems">
            <UButton
              variant="outline"
              color="neutral"
              size="sm"
              class="rounded-full"
              icon="i-lucide-more-vertical"
              :loading="syncPending"
            />
          </UDropdownMenu>
        </div>
      </section>

      <!-- Tabs -->
      <UTabs
        :items="tabItems"
        variant="link"
        class="mt-8 w-full gap-6"
        :ui="{
          trigger: 'grow'
        }"
      >
        <!-- ═══════════════════════════════════════ -->
        <!-- Tab: Stripe Connect                    -->
        <!-- ═══════════════════════════════════════ -->
        <template #stripe>
          <!-- No Stripe Account -->
          <div
            v-if="!provider.stripe.stripeAccountId"
            class="rounded-2xl border border-dashed border-[color:var(--color-brand-subtle)] bg-[color:var(--color-crepuscule-50)]/50 p-12 text-center"
          >
            <UIcon
              name="lucide:link-2-off"
              size="48"
              class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
            />
            <p class="text-lg font-medium text-[color:var(--color-brand-primary)]">
              Aucun compte Stripe Connect
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Ce provider n'a pas encore lié de compte Stripe.
            </p>
          </div>

          <!-- Stripe Data -->
          <div
            v-else
            class="space-y-6"
          >
            <!-- Status Grid -->
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
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

              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
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

              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
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
            <UAlert
              v-if="provider.stripe.disabledReason"
              color="error"
              variant="soft"
              icon="i-lucide-alert-octagon"
              title="Compte désactivé"
              :description="provider.stripe.disabledReason"
            />

            <!-- Requirements Past Due -->
            <div
              v-if="provider.stripe.requirementsPastDue.length > 0"
              class="rounded-xl border border-red-200 bg-red-50 p-5"
            >
              <h3 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-red-700">
                <UIcon
                  name="lucide:alert-triangle"
                  size="14"
                />
                Requirements Past Due ({{ provider.stripe.requirementsPastDue.length }})
              </h3>
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
            </div>

            <!-- Requirements Currently Due -->
            <div
              v-if="provider.stripe.requirementsDue.length > 0"
              class="rounded-xl border border-amber-200 bg-amber-50 p-5"
            >
              <h3 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-amber-700">
                <UIcon
                  name="lucide:alert-circle"
                  size="14"
                />
                Requirements Due ({{ provider.stripe.requirementsDue.length }})
              </h3>
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
            </div>

            <!-- Requirements Eventually Due -->
            <div
              v-if="provider.stripe.requirementsEventuallyDue.length > 0"
              class="rounded-xl border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-crepuscule-50)]/50 p-5"
            >
              <h3 class="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                <UIcon
                  name="lucide:info"
                  size="14"
                />
                Requirements Eventually Due ({{ provider.stripe.requirementsEventuallyDue.length }})
              </h3>
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
            </div>

            <!-- Onboarding Completed -->
            <div
              v-if="provider.stripe.onboardingCompletedAt"
              class="rounded-xl bg-[color:var(--color-success-50)] p-4"
            >
              <dt class="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-success-700)]">
                Onboarding complété
              </dt>
              <dd class="text-sm text-[color:var(--color-success-800)]">
                {{ formatDate(provider.stripe.onboardingCompletedAt) }}
              </dd>
            </div>

            <!-- Debug info -->
            <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-crepuscule-50)]/30 p-4">
              <p class="mb-3 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                Debug
              </p>
              <div class="flex flex-wrap gap-x-8 gap-y-2 text-sm">
                <div>
                  <span class="text-[color:var(--color-brand-muted)]">Requirements count : </span>
                  <span class="font-mono text-[color:var(--color-brand-primary)]">{{ provider.debug.requirementsDueCount }}</span>
                </div>
                <div>
                  <span class="text-[color:var(--color-brand-muted)]">Dernier webhook : </span>
                  <span class="font-mono text-[color:var(--color-brand-primary)]">{{ provider.debug.lastWebhookAt ? formatDate(provider.debug.lastWebhookAt) : '—' }}</span>
                </div>
              </div>
            </div>
          </div>
        </template>

        <!-- ═══════════════════════════════════════ -->
        <!-- Tab: SEO                               -->
        <!-- ═══════════════════════════════════════ -->
        <template #seo>
          <!-- Loading SEO -->
          <div
            v-if="seoStatus === 'pending'"
            class="space-y-3"
          >
            <div
              v-for="i in 2"
              :key="i"
              class="h-20 animate-pulse rounded-2xl border border-[color:var(--color-border-subtle)] bg-white/75"
            />
          </div>

          <!-- Empty SEO -->
          <div
            v-else-if="providerSeoEntries.length === 0"
            class="rounded-2xl border border-dashed border-[color:var(--color-brand-subtle)] bg-[color:var(--color-crepuscule-50)]/50 p-12 text-center"
          >
            <UIcon
              name="lucide:globe"
              size="48"
              class="mx-auto mb-4 text-[color:var(--color-brand-muted)]"
            />
            <p class="text-lg font-medium text-[color:var(--color-brand-primary)]">
              Aucune configuration SEO
            </p>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Ce provider n'a pas encore de pages publiques avec métadonnées SEO.
            </p>
          </div>

          <!-- SEO Entries — List -->
          <div
            v-else
            class="overflow-hidden rounded-2xl border border-[rgba(28,25,23,0.10)] bg-white/75 shadow-soft backdrop-blur"
          >
            <button
              v-for="(entry, index) in providerSeoEntries"
              :key="entry.targetType"
              :class="[
                'flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-[color:var(--color-crepuscule-50)]/60',
                index < providerSeoEntries.length - 1 ? 'border-b border-[color:var(--color-border-subtle)]' : ''
              ]"
              @click="openSeoEntry(entry)"
            >
              <!-- Icon -->
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[color:var(--color-crepuscule-100)]">
                <UIcon
                  :name="SEO_TARGET_ICONS[entry.targetType] ?? 'i-lucide-file-text'"
                  size="20"
                  class="text-[color:var(--color-crepuscule-600)]"
                />
              </div>

              <!-- Content -->
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <span class="font-serif text-base italic text-[color:var(--color-brand-primary)]">
                    {{ SEO_TARGET_LABELS[entry.targetType] ?? entry.targetType }}
                  </span>
                  <UBadge
                    v-if="entry.adminConfig"
                    color="warning"
                    variant="subtle"
                    size="xs"
                  >
                    Override
                  </UBadge>
                </div>
                <p class="mt-0.5 truncate text-sm text-[color:var(--color-brand-secondary)]">
                  {{ truncateSeo(entry.resolvedConfig.title, 60) }}
                </p>
                <p class="truncate text-xs text-[color:var(--color-brand-muted)]">
                  {{ entry.resolvedConfig.canonicalUrl || '—' }}
                </p>
              </div>

              <!-- Chevron -->
              <UIcon
                name="lucide:chevron-right"
                size="18"
                class="shrink-0 text-[color:var(--color-brand-muted)]"
              />
            </button>
          </div>

          <!-- SEO Slideover -->
          <USlideover
            v-model:open="seoSlideoverOpen"
            :title="selectedSeoEntry ? (SEO_TARGET_LABELS[selectedSeoEntry.targetType] ?? selectedSeoEntry.targetType) : ''"
            :description="selectedSeoEntry?.resolvedConfig.canonicalUrl ?? ''"
            :ui="{ content: 'sm:max-w-xl', body: 'space-y-6' }"
          >
            <template #body>
              <template v-if="selectedSeoEntry">
                <!-- Provider config info -->
                <UAlert
                  v-if="selectedSeoEntry.providerConfig"
                  color="info"
                  variant="soft"
                  icon="i-lucide-user"
                >
                  <template #title>
                    Config provider
                  </template>
                  <template #description>
                    {{ selectedSeoEntry.providerConfig.title || '—' }} · {{ truncateSeo(selectedSeoEntry.providerConfig.description, 80) }}
                  </template>
                </UAlert>

                <!-- Form -->
                <AdminSeoForm
                  :admin-config="selectedSeoEntry.adminConfig"
                  :resolved-config="selectedSeoEntry.resolvedConfig"
                  :saving="seoSavingMap[selectedSeoEntry.targetType]"
                  @save="(patch) => saveSeo(selectedSeoEntry!.targetType, patch)"
                />
              </template>
            </template>

            <template #footer>
              <UButton
                v-if="selectedSeoEntry?.adminConfig"
                color="warning"
                variant="outline"
                size="sm"
                class="w-full"
                :loading="selectedSeoEntry ? seoRestoringMap[selectedSeoEntry.targetType] : false"
                @click="selectedSeoEntry && confirmRestoreSeo(selectedSeoEntry.targetType)"
              >
                Restaurer les valeurs du provider
              </UButton>
            </template>
          </USlideover>
        </template>
      </UTabs>
    </template>
  </div>
</template>
