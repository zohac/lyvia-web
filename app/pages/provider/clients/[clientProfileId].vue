<template>
  <div class="space-y-6">
    <!-- Back link + Header -->
    <div class="space-y-4">
      <UButton
        to="/provider/clients"
        variant="link"
        color="neutral"
        size="sm"
        class="px-0"
      >
        <UIcon
          name="lucide:arrow-left"
          class="mr-1.5 h-4 w-4"
        />
        Retour aux clientes
      </UButton>

      <!-- Header card -->
      <UCard class="bg-white">
        <div
          v-if="pending"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <USkeleton class="h-14 w-14 rounded-full" />
            <div class="space-y-2">
              <USkeleton class="h-5 w-40" />
              <USkeleton class="h-4 w-56" />
            </div>
          </div>
          <USkeleton class="h-10 w-36 rounded-lg" />
        </div>

        <div
          v-else-if="client"
          class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div class="flex items-center gap-4">
            <UAvatar
              :text="getClientInitials(client)"
              size="xl"
              :class="avatarClass"
            />
            <div>
              <h1 class="text-2xl font-semibold text-stone-900">
                {{ formatClientName(client) }}
              </h1>
              <div class="mt-1 flex flex-wrap items-center gap-2 text-sm text-stone-500">
                <a
                  :href="`mailto:${client.email}`"
                  class="hover:text-crepuscule-600 hover:underline"
                >
                  {{ client.email }}
                </a>
                <span class="text-stone-300">·</span>
                <a
                  :href="`tel:${client.phone}`"
                  class="hover:text-crepuscule-600 hover:underline"
                >
                  {{ client.phone }}
                </a>
              </div>
            </div>
          </div>
          <UButton
            :to="`/provider/calendar?action=create&type=consultation&clientProfileId=${clientProfileId}`"
            color="primary"
          >
            <UIcon
              name="lucide:calendar-plus"
              class="mr-2 h-4 w-4"
            />
            Planifier un RDV
          </UButton>
        </div>
      </UCard>
    </div>

    <!-- Error alert -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Chargement impossible"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <!-- Main content grid -->
    <div class="grid gap-6 lg:grid-cols-3">
      <!-- Main content (2 cols) -->
      <div class="space-y-6 lg:col-span-2">
        <!-- Appointments section -->
        <ClientAppointmentHistorySection
          v-if="clientProfileId"
          :client-profile-id="clientProfileId"
          :timezone="timezoneLabel"
        />

        <!-- Payments section -->
        <ClientPaymentHistorySection
          v-if="clientProfileId"
          :client-profile-id="clientProfileId"
          :timezone="timezoneLabel"
        />
      </div>

      <!-- Sidebar (1 col) -->
      <aside class="space-y-6 lg:order-first lg:order-last">
        <!-- Synthesis card -->
        <UCard class="bg-white">
          <template #header>
            <div class="flex items-center justify-between">
              <h2 class="font-semibold text-stone-900">
                Synthèse
              </h2>
              <UBadge
                v-if="currentStatusMeta"
                :color="currentStatusMeta.color"
                variant="soft"
              >
                {{ currentStatusMeta.label }}
              </UBadge>
            </div>
          </template>

          <!-- Loading -->
          <div
            v-if="pending"
            class="space-y-4"
          >
            <USkeleton class="h-4 w-full" />
            <USkeleton class="h-4 w-4/5" />
            <USkeleton class="h-10 w-full" />
          </div>

          <!-- Content -->
          <div
            v-else-if="detail"
            class="space-y-6"
          >
            <!-- Status description -->
            <p class="text-sm text-stone-600">
              {{ currentStatusMicrocopy }}
            </p>

            <!-- Pause reason (US-7) -->
            <div
              v-if="detail.computedStatus === 'paused' && detail.pauseReason"
              class="rounded-lg border border-amber-200 bg-amber-50 p-3"
            >
              <p class="text-xs font-medium uppercase tracking-wider text-amber-700">
                Motif de la pause
              </p>
              <p class="mt-1 text-sm text-amber-900">
                {{ detail.pauseReason }}
              </p>
              <p
                v-if="pausedAtLabel"
                class="mt-1 text-xs text-amber-600"
              >
                Mise en pause {{ pausedAtLabel }}
              </p>
            </div>

            <!-- Stats -->
            <div class="divide-y divide-stone-100">
              <div class="py-3 first:pt-0">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Prochain RDV
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ nextAppointmentLabel }}
                </p>
              </div>

              <div class="py-3">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Consultations terminées
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ detail.stats.consultationsCompleted }}
                </p>
              </div>

              <div class="py-3 last:pb-0">
                <span class="text-xs font-medium uppercase tracking-wider text-stone-500">
                  Fuseau horaire
                </span>
                <p class="mt-1 font-medium text-stone-900">
                  {{ timezoneLabel }}
                </p>
              </div>
            </div>
          </div>
        </UCard>

        <!-- Edit form card (Story 14-2) -->
        <UCard
          v-if="client"
          class="bg-white"
        >
          <template #header>
            <h2 class="font-semibold text-stone-900">
              Informations
            </h2>
          </template>

          <div class="space-y-4">
            <UFormField
              label="Prénom"
              :error="editErrors.firstName"
            >
              <UInput
                v-model="editForm.firstName"
                class="w-full"
                autocomplete="given-name"
              />
            </UFormField>

            <UFormField
              label="Nom"
              :error="editErrors.lastName"
            >
              <UInput
                v-model="editForm.lastName"
                class="w-full"
                autocomplete="family-name"
              />
            </UFormField>

            <UFormField
              label="Email"
              :error="editErrors.email"
            >
              <UInput
                v-model="editForm.email"
                type="email"
                class="w-full"
                autocomplete="email"
              />
            </UFormField>

            <UFormField label="Téléphone">
              <UInput
                v-model="editForm.phone"
                type="tel"
                class="w-full"
                autocomplete="tel"
              />
            </UFormField>

            <UAlert
              v-if="editDirty && editForm.email !== initialEditForm.email"
              color="info"
              variant="soft"
              icon="i-lucide-mail"
              title="Changement d'email"
              description="Le client recevra un email de vérification à la nouvelle adresse."
            />

            <div class="flex items-center gap-3">
              <UButton
                color="primary"
                :loading="editSaving"
                :disabled="!editDirty || editHasErrors"
                @click="saveClientProfile"
              >
                Enregistrer
              </UButton>
              <UButton
                v-if="editDirty"
                variant="outline"
                color="neutral"
                @click="resetEditForm"
              >
                Annuler
              </UButton>
            </div>
          </div>
        </UCard>

        <!-- Quick actions card -->
        <UCard
          v-if="client"
          class="bg-white"
        >
          <template #header>
            <h2 class="font-semibold text-stone-900">
              Actions rapides
            </h2>
          </template>

          <div class="space-y-2">
            <UButton
              :href="`mailto:${client.email}`"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon
                name="lucide:mail"
                class="mr-2 h-4 w-4"
              />
              Envoyer un email
            </UButton>
            <UButton
              :href="`tel:${client.phone}`"
              variant="soft"
              color="neutral"
              block
              class="justify-start"
            >
              <UIcon
                name="lucide:phone"
                class="mr-2 h-4 w-4"
              />
              Appeler
            </UButton>

            <!-- Story 10.3: Resend activation email -->
            <UButton
              v-if="detail && !detail.isActivated && detail.stage === 'active'"
              variant="soft"
              color="secondary"
              block
              class="justify-start"
              :loading="resendLoading"
              @click="handleResendActivation"
            >
              <UIcon
                name="lucide:send"
                class="mr-2 h-4 w-4"
              />
              Renvoyer l'invitation
            </UButton>

            <!-- Convert lead to active client -->
            <UButton
              v-if="canConvert"
              variant="soft"
              color="primary"
              block
              class="justify-start"
              :loading="convertLoading"
              @click="handleConvert"
            >
              <UIcon
                name="lucide:user-check"
                class="mr-2 h-4 w-4"
              />
              Convertir en cliente
            </UButton>

            <!-- US-7: Pause/Reactivate actions (pause allowed from any stage except paused) -->
            <UButton
              v-if="detail?.computedStatus && detail.computedStatus !== 'paused'"
              variant="soft"
              color="warning"
              block
              class="justify-start"
              :loading="pauseLoading"
              @click="openPauseModal"
            >
              <UIcon
                name="lucide:pause-circle"
                class="mr-2 h-4 w-4"
              />
              Mettre en pause
            </UButton>

            <UButton
              v-else-if="detail?.computedStatus === 'paused'"
              variant="soft"
              color="success"
              block
              class="justify-start"
              :loading="reactivateLoading"
              @click="handleReactivate"
            >
              <UIcon
                name="lucide:play-circle"
                class="mr-2 h-4 w-4"
              />
              Réactiver
            </UButton>
          </div>
        </UCard>
      </aside>
    </div>

    <!-- US-7: Pause confirmation modal -->
    <ClientPauseModal
      :open="pauseModalOpen"
      :client-name="client ? formatClientName(client) : ''"
      :loading="pauseLoading"
      @update:open="pauseModalOpen = $event"
      @confirm="handlePauseConfirm"
    />
  </div>
</template>

<script setup lang="ts">
import { useProviderClientDetail } from '../../../features/clients/useProviderClientDetail'
import { pauseClient, reactivateClient, convertLeadToActive, updateProviderClient } from '../../../features/clients/services/provider-clients.service'
import { resendActivation } from '../../../features/clients/services/provider-client-detail.service'
import { validateClientFields } from '../../../utils/validate-client-fields'
import {
  formatClientName,
  formatNextAppointment,
  getClientInitials,
  getClientStatusMeta,
  getClientStatusMicrocopy,
  getClientAvatarClass
} from '../../../features/clients/domain/clients'
import ClientAppointmentHistorySection from '../../../components/organisms/ClientAppointmentHistorySection.vue'
import ClientPaymentHistorySection from '../../../components/organisms/ClientPaymentHistorySection.vue'
import ClientPauseModal from '../../../components/organisms/ClientPauseModal.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Fiche cliente'
})

const route = useRoute()
const clientProfileId = computed(() => {
  const value = route.params.clientProfileId
  return typeof value === 'string' ? value : value?.[0]
})

if (!clientProfileId.value) {
  throw createError({ statusCode: 404, statusMessage: 'Cliente introuvable.' })
}

const { pending, errorMessage, detail, refresh } = await useProviderClientDetail(clientProfileId.value)

const toast = useToast()

const client = computed(() => detail.value?.client ?? null)
const timezoneLabel = computed(() => detail.value?.timezone ?? 'Europe/Paris')

// Avatar color based on status
const avatarClass = computed(() => {
  if (!detail.value) return 'bg-stone-100 text-stone-700'
  return getClientAvatarClass(detail.value.computedStatus)
})

// ============================================================================
// Program Month Update (D5-b)
// ============================================================================

const currentStatusMeta = computed(() => {
  const status = detail.value?.computedStatus ?? 'discovery'
  return getClientStatusMeta(status)
})

const currentStatusMicrocopy = computed(() => {
  const status = detail.value?.computedStatus ?? 'discovery'
  return getClientStatusMicrocopy(status)
})

const nextAppointmentLabel = computed(() => {
  if (!detail.value) return 'Aucun rendez-vous planifié'
  const formatted = formatNextAppointment(detail.value.stats.nextConsultationAt, timezoneLabel.value)
  if (!formatted) return 'Aucun rendez-vous planifié'
  return formatted
})

// ============================================================================
// Edit form (Story 14-2)
// ============================================================================

const editForm = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const initialEditForm = ref({ firstName: '', lastName: '', email: '', phone: '' })

function resetEditForm() {
  if (!client.value) return
  const c = client.value
  const values = {
    firstName: c.firstname,
    lastName: c.lastname,
    email: c.email,
    phone: c.phone ?? ''
  }
  Object.assign(editForm, values)
  initialEditForm.value = { ...values }
}

watch(client, () => resetEditForm(), { immediate: true })

const editDirty = computed(() => {
  const i = initialEditForm.value
  return editForm.firstName !== i.firstName
    || editForm.lastName !== i.lastName
    || editForm.email !== i.email
    || editForm.phone !== i.phone
})

const editErrors = computed(() => validateClientFields(editForm))

const editHasErrors = computed(() => Object.keys(editErrors.value).length > 0)
const editSaving = ref(false)

async function saveClientProfile() {
  if (!editDirty.value || editHasErrors.value || !clientProfileId.value) return

  const changedFields: Record<string, string> = {}
  const i = initialEditForm.value
  if (editForm.firstName !== i.firstName) changedFields.firstName = editForm.firstName.trim()
  if (editForm.lastName !== i.lastName) changedFields.lastName = editForm.lastName.trim()
  if (editForm.email !== i.email) changedFields.email = editForm.email.trim()
  if (editForm.phone !== i.phone) changedFields.phone = editForm.phone.trim()

  if (Object.keys(changedFields).length === 0) return

  editSaving.value = true
  try {
    await updateProviderClient(clientProfileId.value, changedFields)

    const emailChanged = 'email' in changedFields
    toast.add({
      title: 'Informations mises à jour',
      description: emailChanged ? 'Le client recevra un email de vérification à la nouvelle adresse.' : undefined,
      color: 'success'
    })

    await refresh()
  } catch (err) {
    toast.add({
      title: 'Erreur lors de la mise à jour',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    editSaving.value = false
  }
}

// ============================================================================
// US-7: Pause / Reactivate Client
// ============================================================================

const pausedAtLabel = computed(() => {
  if (!detail.value?.pausedAt) return null
  try {
    const date = new Date(detail.value.pausedAt)
    return `le ${date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`
  } catch {
    return null
  }
})

const pauseModalOpen = ref(false)
const pauseLoading = ref(false)
const reactivateLoading = ref(false)
const convertLoading = ref(false)
const resendLoading = ref(false)

/**
 * Find the completed discovery appointment ID (needed for conversion).
 * Returns the first discovery appointment with status 'completed'.
 */
const completedDiscoveryId = computed(() => {
  if (!detail.value) return null
  const discovery = detail.value.appointments.find(
    apt => apt.type === 'discovery' && apt.status === 'completed'
  )
  return discovery?.id ?? null
})

/**
 * Check if conversion is available (lead status + completed discovery exists).
 */
const canConvert = computed(() => {
  return detail.value?.computedStatus === 'lead' && completedDiscoveryId.value !== null
})

async function handleResendActivation() {
  if (!clientProfileId.value) return
  resendLoading.value = true

  try {
    const result = await resendActivation(clientProfileId.value)
    if (result.alreadyActivated) {
      toast.add({
        title: 'Compte déjà activé',
        description: 'Cette cliente a déjà activé son compte.',
        color: 'primary'
      })
      await refresh()
    } else if (result.sent) {
      toast.add({
        title: `Invitation envoyée à ${client.value?.firstname ?? 'la cliente'}`,
        color: 'primary'
      })
    }
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible d\'envoyer l\'invitation.',
      color: 'error'
    })
  } finally {
    resendLoading.value = false
  }
}

function openPauseModal() {
  pauseModalOpen.value = true
}

async function handlePauseConfirm(reason: string) {
  if (!clientProfileId.value) return
  pauseLoading.value = true

  try {
    await pauseClient(clientProfileId.value, reason || undefined)
    await refresh()
    pauseModalOpen.value = false
    toast.add({
      title: 'Cliente mise en pause',
      description: 'Elle n\'apparaîtra plus dans les clientes actives.',
      color: 'primary'
    })
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de mettre la cliente en pause.',
      color: 'error'
    })
  } finally {
    pauseLoading.value = false
  }
}

async function handleReactivate() {
  if (!clientProfileId.value) return
  reactivateLoading.value = true

  try {
    await reactivateClient(clientProfileId.value)
    await refresh()
    toast.add({
      title: 'Cliente réactivée',
      description: 'Elle apparaît à nouveau dans les clientes actives.',
      color: 'primary'
    })
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de réactiver la cliente.',
      color: 'error'
    })
  } finally {
    reactivateLoading.value = false
  }
}

/**
 * Convert lead to active client.
 */
async function handleConvert() {
  if (!completedDiscoveryId.value) return
  convertLoading.value = true

  try {
    await convertLeadToActive(completedDiscoveryId.value)
    await refresh()
    toast.add({
      title: 'Cliente convertie',
      description: 'Elle fait maintenant partie de vos clientes actives.',
      color: 'primary'
    })
  } catch {
    toast.add({
      title: 'Erreur',
      description: 'Impossible de convertir la cliente.',
      color: 'error'
    })
  } finally {
    convertLoading.value = false
  }
}
</script>
