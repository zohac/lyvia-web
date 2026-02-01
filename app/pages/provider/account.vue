<script setup lang="ts">
// TODO: extract AccountEmailSection + AccountPasswordSection shared components (duplicated with client/account.vue)
import { useProviderAccount } from '../../features/account/useProviderAccount'
import { useAuthActions } from '../../features/auth/useAuthActions'
import { isPasswordStrong, getPasswordCriteria } from '../../features/auth/password/password-policy'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mon compte'
})

const toast = useToast()
const { account, loading, saving, error, fetchAccount, updateAccount } = useProviderAccount()
const { changingPassword, requestingEmailChange, changePassword, requestEmailChange } = useAuthActions()

// ── Personal info form state ────────────────────────
const personalForm = reactive({
  firstname: '',
  lastname: '',
  bio: '' as string | null,
  specialties: [] as string[]
})
const specialtyInput = ref('')
const specialtyError = ref<string | null>(null)

// ── Email change form state ─────────────────────────
const emailForm = reactive({
  newEmail: '',
  currentPassword: ''
})
const emailChangeSuccess = ref(false)

// ── Password change form state ──────────────────────
const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})
const passwordError = ref<string | null>(null)

// ── Computed ────────────────────────────────────────
const bioCharCount = computed(() => personalForm.bio?.length ?? 0)
const criteria = computed(() => getPasswordCriteria(passwordForm.newPassword))
const isStrong = computed(() => isPasswordStrong(passwordForm.newPassword))

// ── Init ────────────────────────────────────────────
onMounted(async () => {
  await fetchAccount()
  if (account.value) {
    personalForm.firstname = account.value.firstname
    personalForm.lastname = account.value.lastname
    personalForm.bio = account.value.bio
    personalForm.specialties = [...(account.value.specialties ?? [])]
  }
})

// ── Specialty tag handlers ──────────────────────────
function addSpecialty() {
  specialtyError.value = null
  const value = specialtyInput.value.trim()
  if (!value) return
  if (value.length < 2 || value.length > 50) {
    specialtyError.value = 'Chaque spécialité doit contenir entre 2 et 50 caractères.'
    return
  }
  if (personalForm.specialties.length >= 10) {
    specialtyError.value = 'Maximum 10 spécialités autorisées.'
    return
  }
  if (personalForm.specialties.includes(value)) {
    specialtyError.value = 'Cette spécialité existe déjà.'
    return
  }
  personalForm.specialties.push(value)
  specialtyInput.value = ''
}

function removeSpecialty(index: number) {
  personalForm.specialties.splice(index, 1)
}

// ── Form handlers ───────────────────────────────────
async function handlePersonalSubmit() {
  const success = await updateAccount({
    firstname: personalForm.firstname,
    lastname: personalForm.lastname,
    bio: personalForm.bio,
    specialties: personalForm.specialties
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
  <div class="space-y-8">
    <!-- Page header -->
    <header>
      <h1 class="font-serif text-2xl font-semibold text-[color:var(--color-brand-primary)] sm:text-3xl">
        Mon compte
      </h1>
      <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
        Gérez vos informations professionnelles, votre email et votre mot de passe.
      </p>
    </header>

    <!-- Loading -->
    <div
      v-if="loading"
      class="space-y-6"
    >
      <USkeleton class="h-64 w-full" />
      <USkeleton class="h-48 w-full" />
      <USkeleton class="h-48 w-full" />
    </div>

    <!-- Error state -->
    <div
      v-else-if="error && !account"
      class="flex flex-col items-center justify-center gap-4 py-16 text-center"
    >
      <div class="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--color-surface-highlight)]">
        <UIcon
          name="i-lucide-alert-circle"
          class="h-8 w-8 text-[color:var(--color-error)]"
        />
      </div>
      <div>
        <p class="font-medium text-[color:var(--color-brand-primary)]">
          Impossible de charger vos informations
        </p>
        <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
          {{ error }}
        </p>
      </div>
      <UButton
        label="Réessayer"
        variant="outline"
        @click="fetchAccount()"
      />
    </div>

    <template v-else>
      <!-- Section 1: Informations professionnelles -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-briefcase"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Informations professionnelles
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Votre identité et profil professionnel.
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

          <!-- Bio textarea avec compteur -->
          <FormControl
            id="bio"
            label="Bio"
            hint="Décrivez votre expertise en quelques mots"
            class="sm:col-span-2"
          >
            <template #default="{ inputAttrs }">
              <UTextarea
                v-model="personalForm.bio"
                v-bind="inputAttrs"
                placeholder="Coach certifiée en développement personnel..."
                :maxlength="500"
                autoresize
              />
            </template>
            <template #label-aside>
              <span
                class="text-xs"
                :class="bioCharCount > 450 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
              >
                {{ bioCharCount }}/500
              </span>
            </template>
          </FormControl>

          <!-- Spécialités (tags) -->
          <FormControl
            id="specialties"
            label="Spécialités"
            :hint="specialtyError ? undefined : 'Appuyez sur Entrée pour ajouter (max 10)'"
            :error="specialtyError"
            class="sm:col-span-2"
          >
            <template #default="{ inputAttrs }">
              <div class="flex flex-wrap gap-2 rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] p-3">
                <span
                  v-for="(tag, index) in personalForm.specialties"
                  :key="index"
                  class="inline-flex items-center gap-1 rounded-full bg-[color:var(--color-surface-highlight)] px-3 py-1 text-sm"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="ml-1"
                    :aria-label="'Supprimer ' + tag"
                    @click="removeSpecialty(index)"
                  >
                    <UIcon
                      name="i-lucide-x"
                      class="h-3 w-3"
                    />
                  </button>
                </span>
                <input
                  v-if="personalForm.specialties.length < 10"
                  v-bind="inputAttrs"
                  v-model="specialtyInput"
                  class="min-w-[120px] flex-1 border-none bg-transparent text-sm outline-none"
                  placeholder="Ajouter une spécialité..."
                  @keydown.enter.prevent="addSpecialty"
                >
              </div>
            </template>
          </FormControl>

          <div class="sm:col-span-2">
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving"
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
    </template>
  </div>
</template>
