<script setup lang="ts">
import { validateClientFields } from '~/utils/validate-client-fields'
import {
  createProviderClient,
  createProviderDiscoveryClient
} from '~/features/clients/services/provider-clients.service'
import { zonedLocalDateTimeToUtcIso } from '~/features/calendar/domain/zoned-datetime'
import { getYmdInTimeZone } from '~/features/slots/domain/slots'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': []
}>()

const toast = useToast()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const direction = computed(() => (isDesktop.value ? 'right' : 'bottom'))
const inset = computed(() => !isDesktop.value)

type ClientTypeMode = 'active' | 'discovery'
const clientType = ref<ClientTypeMode>('active')

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const discoveryDate = ref('')
const discoveryTime = ref('10:00')
const discoveryNotes = ref('')
const providerTimeZone = ref('Europe/Paris')

const saving = ref(false)

const formErrors = computed(() => validateClientFields(form))

const discoveryErrors = computed(() => {
  if (clientType.value !== 'discovery') return {}
  const errors: Record<string, string> = {}
  if (!discoveryDate.value) {
    errors.discoveryDate = 'Date requise pour le rendez-vous'
  }
  if (!discoveryTime.value) {
    errors.discoveryTime = 'Heure requise pour le rendez-vous'
  }
  if (discoveryNotes.value && discoveryNotes.value.length > 500) {
    errors.discoveryNotes = 'Notes limitées à 500 caractères'
  }
  return errors
})

const hasErrors = computed(() => {
  const baseHasErrors = Object.keys(formErrors.value).length > 0
  if (clientType.value === 'discovery') {
    return baseHasErrors || Object.keys(discoveryErrors.value).length > 0
  }
  return baseHasErrors
})

function resetForm() {
  clientType.value = 'active'
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
  discoveryNotes.value = ''
  const today = new Date()
  discoveryDate.value = getYmdInTimeZone(today, providerTimeZone.value)
  discoveryTime.value = '10:00'
}

// Auto-focus firstName on drawer open
const firstNameRef = ref<{ focus: () => void } | null>(null)
watch(
  () => props.open,
  (open) => {
    if (open) {
      resetForm()
      nextTick(() => firstNameRef.value?.focus())
    }
  }
)

async function handleSubmit() {
  if (hasErrors.value || saving.value) return

  saving.value = true
  try {
    if (clientType.value === 'active') {
      await createProviderClient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined
      })

      toast.add({
        title: 'Cliente créée',
        description: 'Compte actif créé. Un email d\'activation a été envoyé.',
        color: 'success'
      })
    } else {
      const utcIso = zonedLocalDateTimeToUtcIso({
        dayKey: discoveryDate.value,
        time: discoveryTime.value,
        timeZone: providerTimeZone.value
      })

      if (!utcIso) {
        toast.add({
          title: 'Date ou heure invalide',
          description: 'Veuillez vérifier la date et l\'heure sélectionnées.',
          color: 'error'
        })
        return
      }

      await createProviderDiscoveryClient({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        startAt: utcIso,
        notes: discoveryNotes.value.trim() || undefined
      })

      toast.add({
        title: 'Prospecte enregistrée',
        description: 'Appel découverte planifié et email de confirmation envoyé.',
        color: 'success'
      })
    }

    emit('update:open', false)
    emit('created')
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur inattendue'
    toast.add({
      title: 'Erreur lors de la création',
      description: message,
      color: 'error'
    })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <UDrawer
    :open="open"
    :direction="direction"
    :inset="inset"
    :handle="!isDesktop"
    @update:open="emit('update:open', $event)"
  >
    <template #header>
      <div class="flex items-center gap-3">
        <div class="flex h-10 w-10 items-center justify-center rounded-full bg-crepuscule-100">
          <UIcon
            name="lucide:user-plus"
            size="20"
            class="text-crepuscule-600"
          />
        </div>
        <div>
          <h3 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
            Nouvelle cliente
          </h3>
          <p class="text-sm text-[color:var(--color-text-muted)]">
            Remplissez les informations pour créer le compte
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <!-- Type de cliente / Mode selector -->
        <div class="space-y-1.5">
          <label class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-text-muted)]">
            Type de profil
          </label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              class="flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all"
              :class="[
                clientType === 'active'
                  ? 'border-crepuscule-500 bg-crepuscule-50/50 dark:bg-crepuscule-950/20'
                  : 'border-[color:var(--color-border-default)] hover:border-crepuscule-300'
              ]"
              @click="clientType = 'active'"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="lucide:user-check"
                  class="size-4 text-crepuscule-600"
                />
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">
                  Cliente active
                </span>
              </div>
              <span class="text-xs text-[color:var(--color-text-muted)]">
                Accompagnement en cours (envoi lien activation)
              </span>
            </button>

            <button
              type="button"
              class="flex flex-col items-start gap-1 rounded-xl border p-3 text-left transition-all"
              :class="[
                clientType === 'discovery'
                  ? 'border-sunset-500 bg-sunset-50/50 dark:bg-sunset-950/20'
                  : 'border-[color:var(--color-border-default)] hover:border-sunset-300'
              ]"
              @click="clientType = 'discovery'"
            >
              <div class="flex items-center gap-2">
                <UIcon
                  name="lucide:phone-call"
                  class="size-4 text-sunset-600"
                />
                <span class="text-sm font-semibold text-[color:var(--color-text-primary)]">
                  Prospecte
                </span>
              </div>
              <span class="text-xs text-[color:var(--color-text-muted)]">
                Planifier un appel découverte préalable
              </span>
            </button>
          </div>
        </div>

        <UFormField
          label="Prénom"
          :error="form.firstName ? formErrors.firstName : undefined"
          required
        >
          <UInput
            ref="firstNameRef"
            v-model="form.firstName"
            class="w-full"
            placeholder="Prénom"
            autocomplete="given-name"
          />
        </UFormField>

        <UFormField
          label="Nom"
          :error="form.lastName ? formErrors.lastName : undefined"
          required
        >
          <UInput
            v-model="form.lastName"
            class="w-full"
            placeholder="Nom"
            autocomplete="family-name"
          />
        </UFormField>

        <UFormField
          label="Email"
          :error="form.email ? formErrors.email : undefined"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            class="w-full"
            placeholder="email@exemple.com"
            autocomplete="email"
          />
        </UFormField>

        <UFormField label="Téléphone">
          <UInput
            v-model="form.phone"
            type="tel"
            class="w-full"
            placeholder="06 00 00 00 00"
            autocomplete="tel"
          />
        </UFormField>

        <!-- Discovery Fields (shown only if prospecte) -->
        <div
          v-if="clientType === 'discovery'"
          class="space-y-4 rounded-xl border border-sunset-200 bg-sunset-50/30 p-3.5 dark:border-sunset-900/40 dark:bg-sunset-950/10"
        >
          <div class="flex items-center gap-2">
            <UIcon
              name="lucide:calendar-clock"
              class="size-4 text-sunset-600"
            />
            <span class="text-xs font-semibold uppercase tracking-wider text-sunset-800 dark:text-sunset-300">
              Appel découverte (15 min)
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <UFormField
              label="Date"
              :error="discoveryErrors.discoveryDate"
              required
            >
              <UInput
                v-model="discoveryDate"
                type="date"
                class="w-full"
              />
            </UFormField>

            <UFormField
              label="Heure"
              :error="discoveryErrors.discoveryTime"
              required
            >
              <UInput
                v-model="discoveryTime"
                type="time"
                class="w-full"
              />
            </UFormField>
          </div>

          <UFormField
            label="Notes internes (optionnel)"
            :error="discoveryErrors.discoveryNotes"
          >
            <UTextarea
              v-model="discoveryNotes"
              class="w-full"
              placeholder="Origine du contact, attentes..."
              :rows="2"
            />
          </UFormField>
        </div>
      </div>
    </template>

    <template #footer>
      <div class="flex justify-end gap-3">
        <UButton
          variant="outline"
          color="neutral"
          :disabled="saving"
          @click="emit('update:open', false)"
        >
          Annuler
        </UButton>
        <UButton
          color="primary"
          :loading="saving"
          :disabled="hasErrors"
          @click="handleSubmit"
        >
          {{ clientType === 'discovery' ? 'Créer la prospecte & planifier' : 'Créer la cliente' }}
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
