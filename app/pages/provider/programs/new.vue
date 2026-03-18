<script setup lang="ts">
import type { CreateProgramRequest } from '../../../features/programs/api/programs.contract'
import { createProgram } from '../../../features/programs/services/provider-programs.service'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Nouveau programme'
})

const toast = useToast()
const router = useRouter()

const loading = ref(false)
const errorMessage = ref<string | null>(null)

const form = reactive<CreateProgramRequest>({
  name: '',
  description: '',
  totalSessions: 6,
  validityMonths: 3,
  gracePeriodDays: 14,
  priceCents: 30000,
  allowInstallments: false,
  installmentCount: 3,
  discoveryGate: false,
  sessionDurationMinutes: 60,
  sortOrder: 0
})

/** Price in euros for the input (two-way binding with priceCents) */
const priceEuros = computed({
  get: () => form.priceCents / 100,
  set: (v: number) => { form.priceCents = Math.round(v * 100) }
})

const sessionDurationOptions = Array.from({ length: 8 }, (_, i) => ({
  label: `${(i + 1) * 15} min`,
  value: (i + 1) * 15
}))

const localValidationError = computed(() => {
  if (!form.name.trim()) return 'Le nom du programme est requis.'
  if (!form.description.trim()) return 'La description est requise.'
  if (form.totalSessions < 1) return 'Le nombre de séances doit être au moins 1.'
  if (form.validityMonths < 1) return 'La durée de validité doit être au moins 1 mois.'
  if (form.priceCents < 1) return 'Le prix doit être supérieur à 0.'
  if (form.allowInstallments && (!form.installmentCount || form.installmentCount < 2)) {
    return 'Le nombre de mensualités doit être au moins 2.'
  }
  return null
})

async function handleSubmit() {
  if (loading.value) return
  if (localValidationError.value) return

  loading.value = true
  errorMessage.value = null

  try {
    const payload: CreateProgramRequest = {
      name: form.name.trim(),
      description: form.description.trim(),
      totalSessions: form.totalSessions,
      validityMonths: form.validityMonths,
      gracePeriodDays: form.gracePeriodDays,
      priceCents: form.priceCents,
      sessionDurationMinutes: form.sessionDurationMinutes,
      sortOrder: form.sortOrder,
      allowInstallments: form.allowInstallments,
      installmentCount: form.allowInstallments ? form.installmentCount : undefined,
      discoveryGate: form.discoveryGate
    }

    const program = await createProgram(payload)

    toast.add({
      title: 'Programme créé',
      description: `"${program.name}" a été créé en brouillon.`,
      color: 'primary'
    })

    await router.push(`/provider/programs/${program.id}`)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création du programme.'
    errorMessage.value = message
    toast.add({ title: 'Erreur', description: message, color: 'error' })
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="mx-auto max-w-2xl space-y-6">
    <!-- Header -->
    <div class="flex items-center gap-4">
      <UButton
        to="/provider/programs"
        color="neutral"
        variant="ghost"
        icon="i-lucide-arrow-left"
        size="sm"
      />
      <div>
        <h1 class="text-2xl font-bold text-stone-900">
          Nouveau programme
        </h1>
        <p class="mt-1 text-sm text-stone-500">
          Définissez les détails de votre programme d'accompagnement.
        </p>
      </div>
    </div>

    <!-- Error -->
    <UAlert
      v-if="errorMessage"
      color="error"
      variant="soft"
      title="Erreur"
      :description="errorMessage"
      icon="i-lucide-alert-circle"
    />

    <UAlert
      v-else-if="localValidationError"
      color="warning"
      variant="soft"
      title="Vérification"
      :description="localValidationError"
      icon="i-lucide-alert-triangle"
    />

    <!-- Form -->
    <div class="rounded-xl border border-stone-200 bg-white p-6">
      <div class="grid gap-6">
        <!-- Name -->
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
            Nom du programme
          </label>
          <UInput
            v-model="form.name"
            placeholder="Programme Ménopause 3 mois"
            :maxlength="100"
            :disabled="loading"
          />
        </div>

        <!-- Description -->
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
            Description
          </label>
          <UTextarea
            v-model="form.description"
            placeholder="Décrivez votre programme d'accompagnement..."
            :rows="4"
            :maxlength="5000"
            :disabled="loading"
          />
        </div>

        <!-- Sessions + Duration -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Nombre de séances
            </label>
            <UInput
              v-model.number="form.totalSessions"
              type="number"
              :min="1"
              :max="100"
              :disabled="loading"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Durée par séance
            </label>
            <USelect
              v-model="form.sessionDurationMinutes"
              :items="sessionDurationOptions"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Validity + Grace period -->
        <div class="grid gap-4 md:grid-cols-2">
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Validité (mois)
            </label>
            <UInput
              v-model.number="form.validityMonths"
              type="number"
              :min="1"
              :max="24"
              :disabled="loading"
            />
          </div>
          <div class="grid gap-2">
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Délai de grâce (jours)
            </label>
            <UInput
              v-model.number="form.gracePeriodDays"
              type="number"
              :min="0"
              :max="90"
              :disabled="loading"
            />
            <p class="text-xs text-stone-400">
              Jours supplémentaires après expiration pour utiliser les séances restantes.
            </p>
          </div>
        </div>

        <!-- Price -->
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
            Prix total (€)
          </label>
          <UInput
            v-model.number="priceEuros"
            type="number"
            :min="0.01"
            step="0.01"
            :disabled="loading"
          />
        </div>

        <!-- Installments -->
        <div class="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-stone-700">
                Paiement en plusieurs fois
              </p>
              <p class="text-xs text-stone-400">
                Permettre le paiement en mensualités.
              </p>
            </div>
            <USwitch v-model="form.allowInstallments" />
          </div>

          <div
            v-if="form.allowInstallments"
            class="mt-4 grid gap-2"
          >
            <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
              Nombre de mensualités
            </label>
            <UInput
              v-model.number="form.installmentCount"
              type="number"
              :min="2"
              :max="24"
              :disabled="loading"
            />
          </div>
        </div>

        <!-- Discovery gate -->
        <div class="rounded-lg border border-stone-200 bg-stone-50 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-stone-700">
                Discovery gate
              </p>
              <p class="text-xs text-stone-400">
                Exiger un appel découverte avant la souscription.
              </p>
            </div>
            <USwitch v-model="form.discoveryGate" />
          </div>
        </div>

        <!-- Sort order -->
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-wider text-stone-500">
            Ordre d'affichage
          </label>
          <UInput
            v-model.number="form.sortOrder"
            type="number"
            :min="0"
            :disabled="loading"
          />
          <p class="text-xs text-stone-400">
            0 = premier affiché. Plus le nombre est élevé, plus le programme est affiché en bas.
          </p>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex justify-end gap-3">
      <UButton
        to="/provider/programs"
        color="neutral"
        variant="ghost"
        :disabled="loading"
      >
        Annuler
      </UButton>
      <UButton
        color="primary"
        :loading="loading"
        :disabled="!!localValidationError"
        @click="handleSubmit"
      >
        Créer le programme
      </UButton>
    </div>
  </div>
</template>
