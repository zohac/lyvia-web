<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'
import type { SeoFieldValues } from '~/types/seo.types'
import { apiFetch } from '~/services/api/apiFetch'
import { mapRequirementKeyToMessage } from '~/features/finance/domain/finance-state'
import { SLUG_REGEX, SIRET_REGEX, EMAIL_REGEX } from '~/utils/validation-regex'
import { formatDateTime } from '~/composables/useDateFormat'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'
import AdminSeoForm from '~/components/organisms/AdminSeoForm.vue'
import ProviderDeactivationModal from '~/components/organisms/ProviderDeactivationModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Détail Provider'
})

const route = useRoute()
const toast = useToast()
const providerId = computed(() => route.params.id as string)

// ──────────────────────────────────────────────
// Types (verified against OpenAPI DTOs)
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

type AdminProviderDetail = {
  id: string
  userId: string
  firstName: string
  lastName: string
  email: string
  slug: string | null
  siret: string | null
  legalIdentifier: string | null
  isActive: boolean
  activatedAt: string | null
  clientsCount: number
  createdAt: string
  updatedAt: string
}

type DeactivationImpact = {
  activeClientsCount: number
  scheduledAppointmentsCount: number
  pendingPaymentsCount: number
  canDeactivate: boolean
}

// ──────────────────────────────────────────────
// Data fetching (parallel — Epic 11 action #3)
// ──────────────────────────────────────────────

const [
  { data: provider, pending: stripePending, error: stripeError, refresh: refreshStripe },
  { data: detail, pending: detailPending, error: detailError, refresh: refreshDetail },
  { data: allSeoEntries, status: seoStatus, refresh: refreshSeo }
] = await Promise.all([
  useAsyncData<AdminProviderStripeStatus>(
    `admin-provider-${providerId.value}`,
    () => apiFetch<AdminProviderStripeStatus>(`/admin/providers/${providerId.value}/stripe/status`)
  ),
  useAsyncData<AdminProviderDetail>(
    `admin-provider-detail-${providerId.value}`,
    () => apiFetch<AdminProviderDetail>(`/admin/providers/${providerId.value}/detail`)
  ),
  useAsyncData<AdminSeoEntry[]>(
    `admin-seo-provider-${providerId.value}`,
    () => apiFetch<AdminSeoEntry[]>('/admin/seo')
  )
])

const pending = computed(() => stripePending.value || detailPending.value)
const error = computed(() => stripeError.value || detailError.value)

function refreshAll() {
  refreshStripe()
  refreshDetail()
  refreshSeo()
}

// ──────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────

const providerSeoEntries = computed(() =>
  allSeoEntries.value?.filter(e => e.targetId === providerId.value) ?? []
)

const displayName = computed((): string => {
  if (detail.value) return `${detail.value.firstName} ${detail.value.lastName}`
  const entry = providerSeoEntries.value[0]
  return entry ? (entry.label.split(' — ')[0] ?? 'Provider') : 'Provider'
})

const stripeStatusInfo = computed(() => {
  const s = provider.value?.stripe
  let variant: 'neutral' | 'success' | 'error' | 'warning' = 'neutral'
  let label = 'Stripe non lié'
  if (s?.stripeAccountId) {
    if (s.chargesEnabled && s.payoutsEnabled) {
      variant = 'success'
      label = 'Stripe actif'
    } else if (s.requirementsPastDue.length > 0) {
      variant = 'error'
      label = 'Stripe bloqué'
    } else if (s.requirementsDue.length > 0) {
      variant = 'warning'
      label = `Stripe : ${s.requirementsDue.length} action${s.requirementsDue.length > 1 ? 's' : ''}`
    } else {
      label = 'Stripe en cours'
    }
  }
  const cls = getStatusBadgeClasses(variant)
  return { label, badge: cls.badge, dot: cls.dot }
})

const activeStatusInfo = computed(() => {
  if (!detail.value) return null
  const variant = detail.value.isActive ? 'success' as const : 'error' as const
  const s = getStatusBadgeClasses(variant)
  return { label: detail.value.isActive ? 'Actif' : 'Désactivé', badge: s.badge, dot: s.dot }
})

// ──────────────────────────────────────────────
// Tabs
// ──────────────────────────────────────────────

const tabItems = [
  { label: 'Profil', icon: 'i-lucide-user', slot: 'profil' as const },
  { label: 'Stripe Connect', icon: 'i-lucide-credit-card', slot: 'stripe' as const },
  { label: 'Référencement', icon: 'i-lucide-globe', slot: 'seo' as const }
] satisfies TabsItem[]

// ──────────────────────────────────────────────
// Profile edit form
// ──────────────────────────────────────────────

const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  slug: '',
  siret: '',
  legalIdentifier: ''
})

const initialForm = ref({ firstName: '', lastName: '', email: '', slug: '', siret: '', legalIdentifier: '' })

function resetForm() {
  if (!detail.value) return
  const d = detail.value
  const values = {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    slug: d.slug ?? '',
    siret: d.siret ?? '',
    legalIdentifier: d.legalIdentifier ?? ''
  }
  Object.assign(editForm, values)
  initialForm.value = { ...values }
}

watch(detail, () => resetForm(), { immediate: true })

const isDirty = computed(() => {
  const i = initialForm.value
  return editForm.firstName !== i.firstName
    || editForm.lastName !== i.lastName
    || editForm.email !== i.email
    || editForm.slug !== i.slug
    || editForm.siret !== i.siret
    || editForm.legalIdentifier !== i.legalIdentifier
})

const formErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!editForm.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!editForm.lastName.trim()) errors.lastName = 'Le nom est requis'
  if (!editForm.email.trim()) errors.email = 'L\'email est requis'
  else if (!EMAIL_REGEX.test(editForm.email)) errors.email = 'Format email invalide'
  if (editForm.slug && !SLUG_REGEX.test(editForm.slug)) errors.slug = 'Format slug invalide (kebab-case, ex: marie-dupont)'
  if (editForm.slug && (editForm.slug.length < 3 || editForm.slug.length > 60)) errors.slug = 'Le slug doit faire entre 3 et 60 caractères'
  if (editForm.siret && !SIRET_REGEX.test(editForm.siret)) errors.siret = 'Format SIRET invalide (9 ou 14 chiffres)'
  return errors
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

const saving = ref(false)

async function saveProfile() {
  if (!isDirty.value || hasErrors.value) return

  const changedFields: Record<string, string> = {}
  const i = initialForm.value
  if (editForm.firstName !== i.firstName) changedFields.firstName = editForm.firstName.trim()
  if (editForm.lastName !== i.lastName) changedFields.lastName = editForm.lastName.trim()
  if (editForm.email !== i.email) changedFields.email = editForm.email.trim()
  if (editForm.slug !== i.slug) changedFields.slug = editForm.slug.trim()
  if (editForm.siret !== i.siret) changedFields.siret = editForm.siret.trim()
  if (editForm.legalIdentifier !== i.legalIdentifier) changedFields.legalIdentifier = editForm.legalIdentifier.trim()

  if (Object.keys(changedFields).length === 0) return

  saving.value = true
  try {
    await apiFetch(`/admin/providers/${providerId.value}`, {
      method: 'PATCH',
      body: changedFields
    })

    const emailChanged = 'email' in changedFields
    toast.add({
      title: 'Provider mis à jour',
      description: emailChanged ? 'Un email de vérification sera envoyé à la nouvelle adresse.' : undefined,
      color: 'success'
    })

    await refreshDetail()
  } catch (err) {
    toast.add({
      title: 'Erreur lors de la mise à jour',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}

// ──────────────────────────────────────────────
// Deactivation flow
// ──────────────────────────────────────────────

const deactivationModalOpen = ref(false)
const deactivationImpact = ref<DeactivationImpact | null>(null)
const deactivating = ref(false)

async function openDeactivationModal() {
  deactivationImpact.value = null
  deactivationModalOpen.value = true

  try {
    deactivationImpact.value = await apiFetch<DeactivationImpact>(
      `/admin/providers/${providerId.value}/deactivation-impact`
    )
  } catch (err) {
    toast.add({
      title: 'Erreur lors du chargement de l\'impact',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
    deactivationModalOpen.value = false
  }
}

async function confirmDeactivation() {
  deactivating.value = true
  try {
    await apiFetch(`/admin/providers/${providerId.value}/deactivate`, { method: 'PATCH' })
    toast.add({ title: 'Provider désactivé', color: 'success' })
    deactivationModalOpen.value = false
    await refreshDetail()
  } catch (err) {
    toast.add({
      title: 'Erreur lors de la désactivation',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    deactivating.value = false
  }
}

// ──────────────────────────────────────────────
// Reactivation
// ──────────────────────────────────────────────

const reactivating = ref(false)

async function reactivateProvider() {
  reactivating.value = true
  try {
    await apiFetch(`/admin/providers/${providerId.value}/reactivate`, { method: 'PATCH' })
    toast.add({ title: 'Provider réactivé', color: 'success' })
    await refreshDetail()
  } catch (err) {
    toast.add({
      title: 'Erreur lors de la réactivation',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    reactivating.value = false
  }
}

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
      onSelect: refreshAll
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
    await refreshStripe()
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
const seoRestoreConfirmOpen = ref(false)
const seoRestoreTargetType = ref<string | null>(null)

function promptRestoreSeo(targetType: string) {
  seoRestoreTargetType.value = targetType
  seoRestoreConfirmOpen.value = true
}

async function confirmRestoreSeo() {
  const targetType = seoRestoreTargetType.value
  if (!targetType) return
  seoRestoreConfirmOpen.value = false

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
                {{ displayName }}
              </h1>

              <!-- Badges -->
              <div class="mt-2 flex flex-wrap items-center gap-2">
                <!-- Active status badge -->
                <span
                  v-if="activeStatusInfo"
                  :class="activeStatusInfo.badge"
                >
                  <span :class="activeStatusInfo.dot" />
                  {{ activeStatusInfo.label }}
                </span>

                <!-- Stripe badge -->
                <span
                  :class="stripeStatusInfo.badge"
                >
                  <span :class="stripeStatusInfo.dot" />
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
        <!-- Tab: Profil                            -->
        <!-- ═══════════════════════════════════════ -->
        <template #profil>
          <div
            v-if="detailPending"
            class="space-y-4"
          >
            <div
              v-for="i in 3"
              :key="i"
              class="h-16 animate-pulse rounded-xl border border-[color:var(--color-border-subtle)] bg-white/75"
            />
          </div>

          <div
            v-else-if="detail"
            class="space-y-6"
          >
            <!-- Info cards -->
            <div class="grid gap-4 sm:grid-cols-3">
              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
                <dt class="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Clients
                </dt>
                <dd class="text-2xl font-semibold text-[color:var(--color-brand-primary)]">
                  {{ detail.clientsCount }}
                </dd>
              </div>
              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
                <dt class="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Inscription
                </dt>
                <dd class="text-sm text-[color:var(--color-brand-secondary)]">
                  {{ formatDateTime(detail.createdAt) }}
                </dd>
              </div>
              <div class="rounded-xl border border-[color:var(--color-border-subtle)] bg-white p-4">
                <dt class="mb-1 text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">
                  Activation
                </dt>
                <dd class="text-sm text-[color:var(--color-brand-secondary)]">
                  {{ detail.activatedAt ? formatDateTime(detail.activatedAt) : 'Non activé' }}
                </dd>
              </div>
            </div>

            <!-- Edit form -->
            <section class="rounded-2xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-crepuscule-50)]/55 p-6 shadow-soft">
              <h2 class="mb-6 font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Informations
              </h2>

              <div class="grid gap-4 sm:grid-cols-2">
                <UFormField
                  label="Prénom"
                  :error="formErrors.firstName"
                >
                  <UInput
                    v-model="editForm.firstName"
                    class="w-full"
                    autocomplete="given-name"
                  />
                </UFormField>

                <UFormField
                  label="Nom"
                  :error="formErrors.lastName"
                >
                  <UInput
                    v-model="editForm.lastName"
                    class="w-full"
                    autocomplete="family-name"
                  />
                </UFormField>

                <UFormField
                  label="Email"
                  :error="formErrors.email"
                >
                  <UInput
                    v-model="editForm.email"
                    type="email"
                    class="w-full"
                    autocomplete="email"
                  />
                </UFormField>

                <UFormField
                  label="Slug"
                  :error="formErrors.slug"
                >
                  <UInput
                    v-model="editForm.slug"
                    placeholder="marie-dupont"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="SIRET"
                  :error="formErrors.siret"
                >
                  <UInput
                    v-model="editForm.siret"
                    placeholder="12345678901234"
                    class="w-full font-mono"
                  />
                </UFormField>

                <UFormField
                  label="Identifiant légal"
                  :error="formErrors.legalIdentifier"
                >
                  <UInput
                    v-model="editForm.legalIdentifier"
                    placeholder="FR12345678901"
                    class="w-full font-mono"
                  />
                </UFormField>
              </div>

              <UAlert
                v-if="isDirty && editForm.email !== initialForm.email"
                color="info"
                variant="soft"
                icon="i-lucide-mail"
                title="Changement d'email"
                description="Un email de vérification sera envoyé à la nouvelle adresse."
                class="mt-4"
              />

              <div class="mt-6 flex items-center gap-3">
                <UButton
                  color="primary"
                  :loading="saving"
                  :disabled="!isDirty || hasErrors"
                  @click="saveProfile"
                >
                  Enregistrer
                </UButton>
                <UButton
                  v-if="isDirty"
                  variant="outline"
                  color="neutral"
                  @click="resetForm"
                >
                  Annuler
                </UButton>
              </div>
            </section>

            <!-- Deactivation / Reactivation -->
            <section class="rounded-2xl border border-[color:var(--color-border-subtle)] bg-white p-6">
              <h2 class="mb-4 font-serif text-xl italic text-[color:var(--color-brand-primary)]">
                Statut du compte
              </h2>

              <div
                v-if="detail.isActive"
                class="flex items-center justify-between"
              >
                <div>
                  <p class="text-sm text-[color:var(--color-brand-secondary)]">
                    Ce provider est actuellement <strong class="text-[color:var(--color-success-700)]">actif</strong>.
                  </p>
                  <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
                    La désactivation masquera sa page publique et empêchera les nouvelles réservations.
                  </p>
                </div>
                <UButton
                  color="error"
                  variant="outline"
                  @click="openDeactivationModal"
                >
                  Désactiver
                </UButton>
              </div>

              <div
                v-else
                class="flex items-center justify-between"
              >
                <div>
                  <p class="text-sm text-[color:var(--color-brand-secondary)]">
                    Ce provider est actuellement <strong class="text-red-700">désactivé</strong>.
                  </p>
                  <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
                    La réactivation rendra sa page publique à nouveau visible.
                  </p>
                </div>
                <UButton
                  color="success"
                  :loading="reactivating"
                  @click="reactivateProvider"
                >
                  Réactiver
                </UButton>
              </div>
            </section>
          </div>
        </template>

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
                {{ formatDateTime(provider.stripe.onboardingCompletedAt) }}
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
                  <span class="font-mono text-[color:var(--color-brand-primary)]">{{ provider.debug.lastWebhookAt ? formatDateTime(provider.debug.lastWebhookAt) : '—' }}</span>
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
                @click="selectedSeoEntry && promptRestoreSeo(selectedSeoEntry.targetType)"
              >
                Restaurer les valeurs du provider
              </UButton>
            </template>
          </USlideover>
        </template>
      </UTabs>
    </template>

    <!-- SEO Restore Confirmation Modal -->
    <UModal
      :open="seoRestoreConfirmOpen"
      @update:open="(v: boolean) => { seoRestoreConfirmOpen = v }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <UIcon
              name="lucide:alert-triangle"
              size="20"
              class="text-amber-600"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
              Supprimer l'override admin
            </h3>
            <p class="text-sm text-[color:var(--color-brand-muted)]">
              Les valeurs du provider seront restaurées.
            </p>
          </div>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            color="neutral"
            @click="seoRestoreConfirmOpen = false"
          >
            Annuler
          </UButton>
          <UButton
            color="warning"
            @click="confirmRestoreSeo"
          >
            Confirmer la suppression
          </UButton>
        </div>
      </template>
    </UModal>

    <!-- Deactivation Modal -->
    <ProviderDeactivationModal
      v-model:open="deactivationModalOpen"
      :provider-name="displayName"
      :loading="deactivating"
      :impact="deactivationImpact"
      @confirm="confirmDeactivation"
    />
  </div>
</template>
