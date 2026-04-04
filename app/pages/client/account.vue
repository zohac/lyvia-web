<script setup lang="ts">
import { useClientAccount } from '../../features/account/useClientAccount'
import { useAuthActions } from '../../features/auth/useAuthActions'
import { isPasswordStrong, getPasswordCriteria } from '../../features/auth/password/password-policy'
import ClientPaymentsPanel from '../../components/organisms/ClientPaymentsPanel.vue'
import ClientPreferencesSection from '../../components/organisms/ClientPreferencesSection.vue'

definePageMeta({
  layout: 'client',
  middleware: 'auth-client',
  pageTitle: 'Mon compte'
})

// ── Tab deep-linking ───────────────────────────────
type TabValue = 'informations' | 'paiements' | 'preferences'

const tabItems = [
  { label: 'Informations', value: 'informations' as const, icon: 'i-lucide-user', slot: 'informations' as const },
  { label: 'Paiements', value: 'paiements' as const, icon: 'i-lucide-receipt', slot: 'paiements' as const },
  { label: 'Préférences', value: 'preferences' as const, icon: 'i-lucide-settings', slot: 'preferences' as const }
]

const route = useRoute()
const router = useRouter()

const validTabs: TabValue[] = ['informations', 'paiements', 'preferences']
const activeTab = computed<TabValue>({
  get() {
    const tab = route.query.tab as string
    return validTabs.includes(tab as TabValue) ? (tab as TabValue) : 'informations'
  },
  set(value: TabValue) {
    router.replace({ query: { ...route.query, tab: value === 'informations' ? undefined : value } })
  }
})

// ── Account data ───────────────────────────────────
const toast = useToast()
const { account, loading, saving, error, fetchAccount, updateAccount } = useClientAccount()
const { changingPassword, requestingEmailChange, changePassword, requestEmailChange } = useAuthActions()

const personalForm = reactive({
  firstname: '',
  lastname: '',
  phone: ''
})

const emailForm = reactive({
  newEmail: '',
  currentPassword: ''
})
const emailChangeSuccess = ref(false)

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref<string | null>(null)

const phoneValid = computed(() => {
  const p = personalForm.phone.trim()
  return p === '' || /^\+[1-9]\d{6,14}$/.test(p)
})
const criteria = computed(() => getPasswordCriteria(passwordForm.newPassword))
const isStrong = computed(() => isPasswordStrong(passwordForm.newPassword))

onMounted(async () => {
  await fetchAccount()
  if (account.value) {
    personalForm.firstname = account.value.firstname
    personalForm.lastname = account.value.lastname
    personalForm.phone = account.value.phone
  }
})

async function handlePersonalSubmit() {
  const success = await updateAccount({
    firstname: personalForm.firstname,
    lastname: personalForm.lastname,
    phone: personalForm.phone
  })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

async function handleEmailChange() {
  emailChangeSuccess.value = false
  const result = await requestEmailChange({
    newEmail: emailForm.newEmail,
    currentPassword: emailForm.currentPassword
  })
  if (result.success) {
    emailChangeSuccess.value = true
    emailForm.newEmail = ''
    emailForm.currentPassword = ''
  } else {
    toast.add({ title: 'Erreur', description: result.errorMessage, color: 'error' })
  }
}

async function handlePasswordChange() {
  passwordError.value = null
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = 'Les mots de passe ne correspondent pas.'
    return
  }
  if (!isPasswordStrong(passwordForm.newPassword)) {
    passwordError.value = 'Le mot de passe ne respecte pas les critères de sécurité.'
    return
  }
  const result = await changePassword({
    currentPassword: passwordForm.currentPassword,
    newPassword: passwordForm.newPassword
  })
  if (result.success) {
    toast.add({ title: 'Mot de passe modifié avec succès', color: 'primary' })
    passwordForm.currentPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  } else {
    passwordError.value = result.errorMessage ?? 'Une erreur est survenue.'
  }
}
</script>

<template>
  <div class="space-y-6">
    <h1 class="font-heading text-2xl font-bold text-[color:var(--color-text-primary)]">
      Mon compte
    </h1>

    <UTabs
      :model-value="activeTab"
      :items="tabItems"
      variant="link"
      class="w-full"
      @update:model-value="activeTab = $event as TabValue"
    >
      <template #informations>
        <!-- Loading -->
        <div
          v-if="loading"
          class="mt-6 space-y-6"
        >
          <USkeleton class="h-64 w-full" />
          <USkeleton class="h-48 w-full" />
          <USkeleton class="h-48 w-full" />
        </div>

        <!-- Error State -->
        <AtomsDsErrorState
          v-else-if="error && !account"
          class="mt-6"
          :message="error"
          @retry="fetchAccount()"
        />

        <div
          v-else
          class="mt-6 space-y-8"
        >
          <!-- Section 1: Informations personnelles -->
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="i-lucide-user"
                  class="h-6 w-6 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
                  Informations personnelles
                </h2>
                <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                  Votre identité et coordonnées.
                </p>
              </div>
            </div>

            <form
              class="mt-6 grid gap-4 sm:grid-cols-2"
              @submit.prevent="handlePersonalSubmit"
            >
              <FormControl
                id="firstname"
                label="Prénom"
                required
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="personalForm.firstname"
                    v-bind="inputAttrs"
                    placeholder="Prénom"
                    autocomplete="given-name"
                  />
                </template>
              </FormControl>

              <FormControl
                id="lastname"
                label="Nom"
                required
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="personalForm.lastname"
                    v-bind="inputAttrs"
                    placeholder="Nom"
                    autocomplete="family-name"
                  />
                </template>
              </FormControl>

              <FormControl
                id="phone"
                label="Téléphone"
                :hint="!phoneValid ? undefined : 'Format international (ex : +33612345678)'"
                :error="!phoneValid ? 'Format E.164 requis (ex : +33612345678)' : undefined"
                class="sm:col-span-2"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="personalForm.phone"
                    v-bind="inputAttrs"
                    type="tel"
                    placeholder="+33612345678"
                    autocomplete="tel"
                  />
                </template>
              </FormControl>

              <div class="sm:col-span-2">
                <UButton
                  type="submit"
                  :loading="saving"
                  :disabled="saving || !personalForm.firstname.trim() || !personalForm.lastname.trim() || !phoneValid"
                  label="Enregistrer"
                />
              </div>
            </form>
          </div>

          <!-- Section 2: Adresse email -->
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="i-lucide-mail"
                  class="h-6 w-6 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
                  Adresse email
                </h2>
                <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                  Votre adresse actuelle : <strong>{{ account?.email }}</strong>
                </p>
              </div>
            </div>

            <SystemAlert
              v-if="emailChangeSuccess"
              class="mt-6"
              variant="success"
              description="Un email de vérification a été envoyé à votre nouvelle adresse. Consultez votre boîte de réception pour confirmer le changement."
            />

            <form
              class="mt-6 grid gap-4 sm:grid-cols-2"
              @submit.prevent="handleEmailChange"
            >
              <FormControl
                id="new-email"
                label="Nouvelle adresse email"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="emailForm.newEmail"
                    v-bind="inputAttrs"
                    type="email"
                    placeholder="nouvelle@adresse.com"
                    autocomplete="email"
                  />
                </template>
              </FormControl>

              <FormControl
                id="email-password"
                label="Mot de passe actuel"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="emailForm.currentPassword"
                    v-bind="inputAttrs"
                    type="password"
                    placeholder="Votre mot de passe"
                    autocomplete="current-password"
                  />
                </template>
              </FormControl>

              <div class="sm:col-span-2">
                <UButton
                  type="submit"
                  :loading="requestingEmailChange"
                  :disabled="requestingEmailChange || !emailForm.newEmail || !emailForm.currentPassword"
                  label="Modifier l'email"
                  variant="outline"
                />
              </div>
            </form>
          </div>

          <!-- Section 3: Mot de passe -->
          <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
                <UIcon
                  name="i-lucide-lock"
                  class="h-6 w-6 text-[color:var(--color-brand-accent)]"
                />
              </div>
              <div>
                <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
                  Mot de passe
                </h2>
                <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
                  Modifiez votre mot de passe de connexion.
                </p>
              </div>
            </div>

            <SystemAlert
              v-if="passwordError"
              class="mt-6"
              variant="error"
              :description="passwordError"
            />

            <form
              class="mt-6 grid gap-4"
              @submit.prevent="handlePasswordChange"
            >
              <FormControl
                id="current-password"
                label="Mot de passe actuel"
                class="max-w-md"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="passwordForm.currentPassword"
                    v-bind="inputAttrs"
                    type="password"
                    placeholder="Mot de passe actuel"
                    autocomplete="current-password"
                  />
                </template>
              </FormControl>

              <FormControl
                id="new-password"
                label="Nouveau mot de passe"
                class="max-w-md"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="passwordForm.newPassword"
                    v-bind="inputAttrs"
                    type="password"
                    placeholder="Nouveau mot de passe"
                    autocomplete="new-password"
                  />
                </template>
              </FormControl>

              <!-- Password criteria -->
              <ul
                v-if="passwordForm.newPassword.length > 0"
                class="max-w-md space-y-1 text-sm"
              >
                <li :class="criteria.minLength ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-brand-muted)]'">
                  {{ criteria.minLength ? '✓' : '○' }} Au moins 10 caractères
                </li>
                <li :class="criteria.hasLetter ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-brand-muted)]'">
                  {{ criteria.hasLetter ? '✓' : '○' }} Une lettre
                </li>
                <li :class="criteria.hasDigit ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-brand-muted)]'">
                  {{ criteria.hasDigit ? '✓' : '○' }} Un chiffre
                </li>
                <li :class="criteria.hasSpecial ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-brand-muted)]'">
                  {{ criteria.hasSpecial ? '✓' : '○' }} Un caractère spécial
                </li>
                <li :class="criteria.notCommon ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-brand-muted)]'">
                  {{ criteria.notCommon ? '✓' : '○' }} Pas un mot de passe courant
                </li>
              </ul>

              <FormControl
                id="confirm-password"
                label="Confirmer le nouveau mot de passe"
                class="max-w-md"
              >
                <template #default="{ inputAttrs }">
                  <UInput
                    v-model="passwordForm.confirmPassword"
                    v-bind="inputAttrs"
                    type="password"
                    placeholder="Confirmer le mot de passe"
                    autocomplete="new-password"
                  />
                </template>
              </FormControl>

              <div>
                <UButton
                  type="submit"
                  :loading="changingPassword"
                  :disabled="changingPassword || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword || !isStrong"
                  label="Modifier le mot de passe"
                  variant="outline"
                />
              </div>
            </form>
          </div>
        </div>
      </template>

      <template #paiements>
        <div class="mt-6">
          <ClientPaymentsPanel />
        </div>
      </template>

      <template #preferences>
        <div class="mt-6">
          <ClientPreferencesSection />
        </div>
      </template>
    </UTabs>
  </div>
</template>
