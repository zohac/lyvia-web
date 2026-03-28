<script setup lang="ts">
import { apiFetch } from '~/services/api/apiFetch'
import { validateClientFields } from '~/utils/validate-client-fields'
import { getStatusBadgeClasses } from '~/composables/useAdminBadges'
import { type ClientStage, STAGE_LABELS, STAGE_VARIANT } from '~/utils/client-stage'
import ClientDeactivationModal from '~/components/organisms/ClientDeactivationModal.vue'

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Détail Client'
})

const route = useRoute()
const toast = useToast()
const clientId = computed(() => route.params.id as string)

// ──────────────────────────────────────────────
// Types
// ──────────────────────────────────────────────

// API response shape (GET /admin/clients/:clientProfileId — ProviderClientDetailResponseDto)
type ApiClientDetailResponse = {
  client: {
    clientProfileId: string
    firstname: string
    lastname: string
    email: string
    phone: string
  }
  stage: ClientStage
  computedStatus: ClientStage
  isActivated: boolean
  pausedAt: string | null
  pauseReason: string | null
  timezone: string
  stats: {
    consultationsCompleted: number
    lastAppointmentAt: string | null
    nextConsultationAt: string | null
  }
}

// Normalized view used by the template
type AdminClientDetail = {
  id: string
  firstName: string
  lastName: string
  email: string
  phone: string
  stage: ClientStage
  isActive: boolean
}

type ClientDeactivationImpact = {
  scheduledAppointmentsCount: number
  pendingPaymentsCount: number
  completedAppointmentsCount: number
  totalPaidAmount: number
  hasActiveTransactions: boolean
}

function mapApiToDetail(raw: ApiClientDetailResponse): AdminClientDetail {
  return {
    id: raw.client.clientProfileId,
    firstName: raw.client.firstname,
    lastName: raw.client.lastname,
    email: raw.client.email,
    phone: raw.client.phone,
    stage: raw.stage,
    isActive: raw.isActivated
  }
}

// ──────────────────────────────────────────────
// Data fetching
// ──────────────────────────────────────────────

const { data: detail, pending, error, refresh: refreshDetail } = await useAsyncData<AdminClientDetail>(
  `admin-client-detail-${clientId.value}`,
  async () => {
    const raw = await apiFetch<ApiClientDetailResponse>(`/admin/clients/${clientId.value}`)
    return mapApiToDetail(raw)
  }
)

// ──────────────────────────────────────────────
// Computed
// ──────────────────────────────────────────────

const displayName = computed(() => {
  if (!detail.value) return 'Client'
  return `${detail.value.firstName} ${detail.value.lastName}`
})

const activeStatusInfo = computed(() => {
  if (!detail.value) return null
  const variant = detail.value.isActive ? 'success' as const : 'error' as const
  const s = getStatusBadgeClasses(variant)
  return { label: detail.value.isActive ? 'Actif' : 'Désactivé', badge: s.badge, dot: s.dot }
})

const stageInfo = computed(() => {
  if (!detail.value) return null
  const s = getStatusBadgeClasses(STAGE_VARIANT[detail.value.stage])
  return { label: STAGE_LABELS[detail.value.stage], badge: s.badge, dot: s.dot }
})

// ──────────────────────────────────────────────
// Edit form
// ──────────────────────────────────────────────

const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const initialForm = ref({ firstName: '', lastName: '', email: '', phone: '' })

function resetForm() {
  if (!detail.value) return
  const d = detail.value
  const values = {
    firstName: d.firstName,
    lastName: d.lastName,
    email: d.email,
    phone: d.phone ?? ''
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
    || editForm.phone !== i.phone
})

const formErrors = computed(() => validateClientFields(editForm))

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

const saving = ref(false)

async function saveProfile() {
  if (!isDirty.value || hasErrors.value) return

  const changedFields: Record<string, string> = {}
  const i = initialForm.value
  if (editForm.firstName !== i.firstName) changedFields.firstName = editForm.firstName.trim()
  if (editForm.lastName !== i.lastName) changedFields.lastName = editForm.lastName.trim()
  if (editForm.email !== i.email) changedFields.email = editForm.email.trim()
  if (editForm.phone !== i.phone) changedFields.phone = editForm.phone.trim()

  if (Object.keys(changedFields).length === 0) return

  saving.value = true
  try {
    await apiFetch(`/admin/clients/${clientId.value}`, {
      method: 'PATCH',
      body: changedFields
    })

    const emailChanged = 'email' in changedFields
    toast.add({
      title: 'Client mis à jour',
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
const deactivationImpact = ref<ClientDeactivationImpact | null>(null)
const deactivating = ref(false)

async function openDeactivationModal() {
  deactivationImpact.value = null
  deactivationModalOpen.value = true

  try {
    deactivationImpact.value = await apiFetch<ClientDeactivationImpact>(
      `/admin/clients/${clientId.value}/deactivation-impact`
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
    await apiFetch(`/admin/clients/${clientId.value}/deactivate`, { method: 'PATCH' })
    toast.add({ title: 'Client désactivé', color: 'success' })
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

async function reactivateClient() {
  reactivating.value = true
  try {
    await apiFetch(`/admin/clients/${clientId.value}/reactivate`, { method: 'PATCH' })
    toast.add({ title: 'Client réactivé', color: 'success' })
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
</script>

<template>
  <div class="mx-auto max-w-3xl">
    <!-- Back link -->
    <NuxtLink
      to="/admin/clients"
      class="group mb-6 inline-flex items-center gap-2 text-sm text-[color:var(--color-brand-muted)] transition-colors hover:text-[color:var(--color-brand-primary)]"
    >
      <UIcon
        name="lucide:arrow-left"
        size="16"
        class="transition-transform group-hover:-translate-x-1"
      />
      Retour aux clients
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
        {{ error.message || 'Client introuvable' }}
      </p>
      <NuxtLink
        to="/admin/clients"
        class="mt-4 inline-flex items-center gap-2 text-sm text-red-600 underline"
      >
        Retour à la liste
      </NuxtLink>
    </div>

    <!-- Content -->
    <template v-else-if="detail">
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

                <!-- Stage badge -->
                <span
                  v-if="stageInfo"
                  :class="stageInfo.badge"
                >
                  <span :class="stageInfo.dot" />
                  {{ stageInfo.label }}
                </span>
              </div>

              <!-- IDs -->
              <div class="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[color:var(--color-brand-muted)]">
                <span>
                  ID : <span class="font-mono">{{ detail.id }}</span>
                </span>
              </div>
            </div>
          </div>

          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            class="rounded-full"
            icon="i-lucide-rotate-cw"
            @click="refreshDetail()"
          />
        </div>
      </section>

      <!-- Info cards placeholder — createdAt/updatedAt not available in current API response -->

      <!-- Edit form -->
      <section class="mt-6 rounded-2xl border border-white/60 bg-gradient-to-br from-white to-[color:var(--color-crepuscule-50)]/55 p-6 shadow-soft">
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
            label="Téléphone"
          >
            <UInput
              v-model="editForm.phone"
              type="tel"
              class="w-full"
              autocomplete="tel"
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
      <section class="mt-6 rounded-2xl border border-[color:var(--color-border-subtle)] bg-white p-6">
        <h2 class="mb-4 font-serif text-xl italic text-[color:var(--color-brand-primary)]">
          Statut du compte
        </h2>

        <div
          v-if="detail.isActive"
          class="flex items-center justify-between"
        >
          <div>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              Ce client est actuellement <strong class="text-[color:var(--color-success-700)]">actif</strong>.
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              La désactivation empêchera le client de se connecter et de prendre de nouveaux rendez-vous.
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
              Ce client est actuellement <strong class="text-red-700">désactivé</strong>.
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              La réactivation rendra l'accès au compte.
            </p>
          </div>
          <UButton
            color="success"
            :loading="reactivating"
            @click="reactivateClient"
          >
            Réactiver
          </UButton>
        </div>
      </section>
    </template>

    <!-- Deactivation Modal -->
    <ClientDeactivationModal
      v-model:open="deactivationModalOpen"
      :client-name="displayName"
      :loading="deactivating"
      :impact="deactivationImpact"
      @confirm="confirmDeactivation"
    />
  </div>
</template>
