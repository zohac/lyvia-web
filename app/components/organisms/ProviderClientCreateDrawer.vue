<script setup lang="ts">
import { EMAIL_REGEX } from '~/utils/validation-regex'
import { createProviderClient } from '~/features/clients/services/provider-clients.service'

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

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  phone: ''
})

const saving = ref(false)

const formErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!form.firstName.trim()) errors.firstName = 'Le prénom est requis'
  if (!form.lastName.trim()) errors.lastName = 'Le nom est requis'
  if (!form.email.trim()) errors.email = 'L\'email est requis'
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Format email invalide'
  return errors
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.phone = ''
}

// Auto-focus firstName on drawer open
const firstNameRef = ref<HTMLInputElement | null>(null)
watch(() => props.open, (open) => {
  if (open) {
    resetForm()
    nextTick(() => firstNameRef.value?.focus())
  }
})

async function handleSubmit() {
  if (hasErrors.value || saving.value) return

  saving.value = true
  try {
    await createProviderClient({
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || undefined
    })

    toast.add({
      title: 'Client créé',
      description: 'Un email d\'activation a été envoyé.',
      color: 'success'
    })

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
          <h3 class="text-lg font-semibold text-stone-900">
            Nouvelle cliente
          </h3>
          <p class="text-sm text-stone-500">
            Remplissez les informations pour créer le compte
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <UFormField
          label="Prénom"
          :error="formErrors.firstName"
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
          :error="formErrors.lastName"
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
          :error="formErrors.email"
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
          Créer la cliente
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
