<script setup lang="ts">
import { SLUG_REGEX, SIRET_REGEX, EMAIL_REGEX } from '~/utils/validation-regex'

const props = defineProps<{
  open: boolean
}>()

const emit = defineEmits<{
  'update:open': [value: boolean]
  'created': [id: string]
}>()

const toast = useToast()

const isDesktop = useMediaQuery('(min-width: 1024px)', { defaultValue: true })
const direction = computed(() => (isDesktop.value ? 'right' : 'bottom'))
const inset = computed(() => !isDesktop.value)

const form = reactive({
  firstName: '',
  lastName: '',
  email: '',
  slug: '',
  siret: '',
  legalIdentifier: '',
  isTest: false
})

const saving = ref(false)

const formErrors = computed(() => {
  const errors: Record<string, string> = {}
  if (!form.firstName.trim()) errors.firstName = 'Requis'
  if (!form.lastName.trim()) errors.lastName = 'Requis'
  if (!form.email.trim()) errors.email = 'Requis'
  else if (!EMAIL_REGEX.test(form.email)) errors.email = 'Email invalide'
  if (!form.slug.trim()) errors.slug = 'Requis'
  else if (form.slug.length < 3 || form.slug.length > 60) errors.slug = 'Entre 3 et 60 caractères'
  else if (!SLUG_REGEX.test(form.slug)) errors.slug = 'Lettres minuscules, chiffres et tirets uniquement'
  if (form.siret && !SIRET_REGEX.test(form.siret)) errors.siret = 'Format SIREN (9) ou SIRET (14) invalide'
  return errors
})

const hasErrors = computed(() => Object.keys(formErrors.value).length > 0)

function resetForm() {
  form.firstName = ''
  form.lastName = ''
  form.email = ''
  form.slug = ''
  form.siret = ''
  form.legalIdentifier = ''
  form.isTest = false
}

// Auto-focus firstName on drawer open
const firstNameRef = ref<{ focus: () => void } | null>(null)
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
    const body: Record<string, string | boolean> = {
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      email: form.email.trim(),
      slug: form.slug.trim()
    }
    if (form.siret.trim()) body.siret = form.siret.trim()
    if (form.legalIdentifier.trim()) body.legalIdentifier = form.legalIdentifier.trim()
    if (form.isTest) body.isTest = true

    const { apiFetch } = await import('~/services/api/apiFetch')
    const result = await apiFetch<{ id: string }>('/admin/providers', { method: 'POST', body })

    toast.add({
      title: 'Provider créé',
      description: 'Email d\'activation envoyé.',
      color: 'success'
    })

    emit('update:open', false)
    emit('created', result.id)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Erreur lors de la création'
    toast.add({
      title: 'Erreur',
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
            Nouveau provider
          </h3>
          <p class="text-sm text-stone-500">
            Un email d'activation sera envoyé
          </p>
        </div>
      </div>
    </template>

    <template #body>
      <div class="space-y-4">
        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="Prénom"
            :error="form.firstName ? formErrors.firstName : undefined"
            required
          >
            <UInput
              ref="firstNameRef"
              v-model="form.firstName"
              class="w-full"
              placeholder="Sophie"
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
              placeholder="Martin"
              autocomplete="family-name"
            />
          </UFormField>
        </div>

        <UFormField
          label="Email"
          :error="form.email ? formErrors.email : undefined"
          required
        >
          <UInput
            v-model="form.email"
            type="email"
            class="w-full"
            placeholder="sophie@example.com"
            autocomplete="email"
          />
        </UFormField>

        <UFormField
          label="Slug"
          :error="form.slug ? formErrors.slug : undefined"
          hint="URL publique : /coach/{slug}"
          required
        >
          <UInput
            v-model="form.slug"
            class="w-full font-mono"
            placeholder="sophie-martin"
          />
        </UFormField>

        <div class="grid gap-4 sm:grid-cols-2">
          <UFormField
            label="SIRET / SIREN"
            :error="form.siret ? formErrors.siret : undefined"
            hint="Optionnel"
          >
            <UInput
              v-model="form.siret"
              class="w-full font-mono"
              placeholder="12345678901234"
            />
          </UFormField>

          <UFormField
            label="Identifiant légal"
            hint="Optionnel"
          >
            <UInput
              v-model="form.legalIdentifier"
              class="w-full"
              placeholder="TVA, RNA..."
            />
          </UFormField>
        </div>

        <UCheckbox
          v-model="form.isTest"
          label="Compte de test"
          description="Ce compte ne sera pas visible publiquement"
        />
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
          Créer le provider
        </UButton>
      </div>
    </template>
  </UDrawer>
</template>
