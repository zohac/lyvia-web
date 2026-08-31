<script setup lang="ts">
// TODO: extract AccountEmailSection + AccountPasswordSection shared components (duplicated with client/account.vue)
import { useProviderAccount } from '../../features/account/useProviderAccount'
import { useAuthActions } from '../../features/auth/useAuthActions'
import {
  GOOGLE_ADS_CONVERSION_LABEL_REGEX,
  GOOGLE_ADS_ID_REGEX
} from '../../features/consent/consent-logic'
import { CLARITY_ID_REGEX } from '../../features/clarity/microsoft-clarity-helpers'
import { isPasswordStrong, getPasswordCriteria } from '../../features/auth/password/password-policy'
import {
  uploadAsset,
  formatUploadError,
  validateFileUpload
} from '../../features/assets/use-asset-upload'
import type { CredentialItem, SocialLinks } from '../../features/account/api/provider-account.contract'
import { useSupportSession } from '../../features/support-session/state/useSupportSession'
import FormControl from '../../components/molecules/FormControl.vue'
import SystemAlert from '../../components/atoms/SystemAlert.vue'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Mon compte'
})

const toast = useToast()
const supportSession = useSupportSession()
const isSupportMode = computed(() => supportSession.isSupportActive.value)
const { account, loading, saving, error, fetchAccount, updateAccount } = useProviderAccount()
const { changingPassword, requestingEmailChange, changePassword, requestEmailChange } = useAuthActions()

// ── Personal info form state ────────────────────────
const personalForm = reactive({
  firstname: '',
  lastname: '',
  bio: '',
  specialties: [] as string[]
})
const specialtyInput = ref('')
const specialtyError = ref<string | null>(null)

// Story 0-26 round terrain — `longBio` + `city` + `region` édités inline sur
// /provider/coach-page (section "Qui suis-je"), retirés de cette page pour
// éviter la double source de vérité.

// ── Credentials form state ──────────────────────────
const credentialsForm = ref<CredentialItem[]>([])

// ── Social links form state ─────────────────────────
const socialForm = reactive<SocialLinks>({
  linkedin: '',
  facebook: '',
  instagram: '',
  website: ''
})
const socialError = ref<string | null>(null)

// ── Public phone form state ─────────────────────────
const phoneForm = reactive({ publicPhone: '' })
const phoneValid = computed(() => {
  const p = (phoneForm.publicPhone ?? '').trim()
  return p === '' || /^\+[1-9]\d{6,14}$/.test(p)
})

// ── Photo upload state ──────────────────────────────
const photoFile = ref<File | null>(null)
const photoPreview = ref<string | null>(null)
const photoUploading = ref(false)
const photoError = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

// Story 0-26 round terrain — secondary photo state migré vers /provider/coach-page
// (section "Qui suis-je"), supprimé d'ici pour éviter la double source de vérité.

// Story 0-37 — heroHeadline et urgencyText migrés vers /provider/coach-page (section Hero)

// ── Lead magnet form state ──────────────────────────
const leadMagnetForm = reactive({
  url: null as string | null,
  title: undefined as string | undefined
})
const leadMagnetFile = ref<File | null>(null)
const leadMagnetUploading = ref(false)
const leadMagnetError = ref<string | null>(null)

// ── Marketing form state (Google Ads + Clarity) ─────
const marketingForm = reactive({
  googleAdsId: '' as string | undefined,
  googleAdsConversionLabel: '' as string | undefined,
  microsoftClarityId: '' as string | undefined
})
const clarityIdValid = computed(() => {
  const v = (marketingForm.microsoftClarityId ?? '').trim()
  return v === '' || CLARITY_ID_REGEX.test(v)
})
const adsIdValid = computed(() => {
  const v = (marketingForm.googleAdsId ?? '').trim()
  return v === '' || GOOGLE_ADS_ID_REGEX.test(v)
})
const adsLabelValid = computed(() => {
  const v = (marketingForm.googleAdsConversionLabel ?? '').trim()
  return v === '' || GOOGLE_ADS_CONVERSION_LABEL_REGEX.test(v)
})

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
const leadMagnetTitleCharCount = computed(() => leadMagnetForm.title?.length ?? 0)
const criteria = computed(() => getPasswordCriteria(passwordForm.newPassword))
const isStrong = computed(() => isPasswordStrong(passwordForm.newPassword))

// ── Init ────────────────────────────────────────────
onMounted(async () => {
  await fetchAccount()
  if (account.value) {
    syncFormsFromAccount()
  }
})

function syncFormsFromAccount() {
  const acc = account.value
  if (!acc) return

  // Personal
  personalForm.firstname = acc.firstname
  personalForm.lastname = acc.lastname
  personalForm.bio = acc.bio ?? ''
  personalForm.specialties = [...(acc.specialties ?? [])]

  // Credentials — preserve verified flag on round-trip (CR1 HIGH fix)
  credentialsForm.value = acc.credentials?.length
    ? acc.credentials.map(c => ({ ...c }))
    : []

  // Social links
  socialForm.linkedin = acc.socialLinks?.linkedin ?? ''
  socialForm.facebook = acc.socialLinks?.facebook ?? ''
  socialForm.instagram = acc.socialLinks?.instagram ?? ''
  socialForm.website = acc.socialLinks?.website ?? ''

  // Phone
  phoneForm.publicPhone = acc.publicPhone ?? ''

  // Lead magnet
  leadMagnetForm.url = acc.leadMagnetUrl
  leadMagnetForm.title = acc.leadMagnetTitle ?? undefined

  // Marketing (Google Ads + Clarity)
  marketingForm.googleAdsId = acc.googleAdsId ?? undefined
  marketingForm.googleAdsConversionLabel = acc.googleAdsConversionLabel ?? undefined
  marketingForm.microsoftClarityId = acc.microsoftClarityId ?? undefined

  // Story 0-26/0-37 — testimonials, branding, hero moved to /provider/coach-page
}

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

// ── Credentials handlers ────────────────────────────
function addCredential() {
  if (credentialsForm.value.length >= 20) return
  credentialsForm.value.push({ title: '' })
}

function removeCredential(index: number) {
  credentialsForm.value.splice(index, 1)
}

// ── Photo upload handlers ───────────────────────────
// uploadAsset / formatUploadError / validateFileUpload extracted to
// ~/features/assets/use-asset-upload (Story 0-27 — DRY A25)
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  photoError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const err = validateFileUpload(file, 2 * 1024 * 1024, ['image/jpeg', 'image/png', 'image/webp'])
  if (err) {
    photoError.value = err
    return
  }

  photoFile.value = file
  photoPreview.value = URL.createObjectURL(file)
}

async function handlePhotoUpload() {
  if (!photoFile.value) return
  photoUploading.value = true
  photoError.value = null

  try {
    const result = await uploadAsset('profile_photo', photoFile.value)
    photoPreview.value = result.url
    photoFile.value = null
    toast.add({ title: 'Photo mise à jour', color: 'primary' })
  } catch (e: unknown) {
    photoError.value = formatUploadError(e)
    toast.add({ title: 'Erreur', description: photoError.value, color: 'error' })
  } finally {
    photoUploading.value = false
  }
}

// Story 0-26 round terrain — handlers photo secondaire migrés vers /provider/coach-page

// ── Social links validation ─────────────────────────
function validateSocialUrl(url: string): boolean {
  if (!url) return true
  return url.startsWith('https://')
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

// Story 0-26 round terrain — handleProfileSubmit supprimé : longBio + city + region
// désormais édités via la section "Qui suis-je" de /provider/coach-page.

async function handleCredentialsSubmit() {
  const filtered = credentialsForm.value.filter(c => c.title.trim())
  const success = await updateAccount({ credentials: filtered })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

async function handleSocialSubmit() {
  socialError.value = null
  const links: SocialLinks = {}
  if (socialForm.linkedin) {
    if (!validateSocialUrl(socialForm.linkedin)) {
      socialError.value = 'Les URLs doivent commencer par https://'
      return
    }
    links.linkedin = socialForm.linkedin
  }
  if (socialForm.facebook) {
    if (!validateSocialUrl(socialForm.facebook)) {
      socialError.value = 'Les URLs doivent commencer par https://'
      return
    }
    links.facebook = socialForm.facebook
  }
  if (socialForm.instagram) {
    if (!validateSocialUrl(socialForm.instagram)) {
      socialError.value = 'Les URLs doivent commencer par https://'
      return
    }
    links.instagram = socialForm.instagram
  }
  if (socialForm.website) {
    if (!validateSocialUrl(socialForm.website)) {
      socialError.value = 'Les URLs doivent commencer par https://'
      return
    }
    links.website = socialForm.website
  }
  const success = await updateAccount({ socialLinks: links })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

async function handlePhoneSubmit() {
  if (!phoneValid.value) return
  const success = await updateAccount({
    publicPhone: phoneForm.publicPhone?.trim() || null
  })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

// ── Lead magnet handlers ────────────────────────────
const leadMagnetInputRef = ref<HTMLInputElement | null>(null)

function triggerLeadMagnetInput() {
  leadMagnetInputRef.value?.click()
}

function onLeadMagnetSelected(event: Event) {
  leadMagnetError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  const err = validateFileUpload(file, 10 * 1024 * 1024, ['application/pdf'])
  if (err) {
    leadMagnetError.value = err
    return
  }

  leadMagnetFile.value = file
}

async function handleLeadMagnetUpload() {
  if (!leadMagnetFile.value) return
  leadMagnetUploading.value = true
  leadMagnetError.value = null

  try {
    const result = await uploadAsset('lead_magnet', leadMagnetFile.value)
    leadMagnetForm.url = result.url
    leadMagnetFile.value = null
    toast.add({ title: 'PDF uploadé avec succès', color: 'primary' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : ''
    if (msg.includes('INVALID_MIME')) {
      leadMagnetError.value = 'Format non reconnu. Utilisez un fichier PDF valide.'
    } else {
      leadMagnetError.value = 'Erreur lors de l\'upload du fichier.'
    }
  } finally {
    leadMagnetUploading.value = false
  }
}

async function handleLeadMagnetSubmit() {
  const success = await updateAccount({
    leadMagnetUrl: leadMagnetForm.url,
    leadMagnetTitle: leadMagnetForm.title?.trim() || null
  })
  if (success) {
    toast.add({ title: 'Lead magnet mis à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

function removeLeadMagnet() {
  leadMagnetForm.url = null
  leadMagnetForm.title = undefined
  leadMagnetFile.value = null
}

async function handleMarketingSubmit() {
  if (!adsIdValid.value || !adsLabelValid.value || !clarityIdValid.value) return
  const success = await updateAccount({
    googleAdsId: marketingForm.googleAdsId?.trim() || null,
    googleAdsConversionLabel: marketingForm.googleAdsConversionLabel?.trim() || null,
    microsoftClarityId: marketingForm.microsoftClarityId?.trim() || null
  })
  if (success) {
    toast.add({ title: 'Configuration Marketing enregistrée', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

async function handleEmailChange() {
  if (isSupportMode.value) {
    toast.add({ title: 'Action interdite', description: 'La modification de l\'email n\'est pas autorisée en mode assistance.', color: 'warning' })
    return
  }
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
  if (isSupportMode.value) {
    toast.add({ title: 'Action interdite', description: 'La modification du mot de passe n\'est pas autorisée en mode assistance.', color: 'warning' })
    return
  }
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
    <AtomsDsPageHeader
      title="Mon compte"
      :subtitle="isSupportMode ? 'Gérez les informations professionnelles de la provider.' : 'Gérez vos informations professionnelles, votre email et votre mot de passe.'"
    />

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
    <AtomsDsErrorState
      v-else-if="error && !account"
      :message="error"
      @retry="fetchAccount()"
    />

    <template v-else>
      <!-- Section 1: Informations personnelles -->
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
              Informations personnelles
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

      <!-- Section 3: Diplômes & certifications -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-award"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Diplômes & certifications
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Vos formations et accréditations professionnelles.
            </p>
          </div>
        </div>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleCredentialsSubmit"
        >
          <div
            v-for="(cred, index) in credentialsForm"
            :key="index"
            class="flex items-start gap-3"
          >
            <div class="grid flex-1 gap-3 sm:grid-cols-3">
              <UInput
                v-model="cred.title"
                placeholder="Titre du diplôme *"
                :maxlength="200"
                required
              />
              <UInput
                v-model="cred.institution"
                placeholder="Établissement"
                :maxlength="200"
              />
              <UInput
                v-model.number="cred.year"
                type="number"
                placeholder="Année"
                :min="1900"
                :max="2100"
              />
            </div>
            <UButton
              variant="ghost"
              color="neutral"
              icon="i-lucide-trash-2"
              size="sm"
              :aria-label="'Supprimer le diplôme ' + cred.title"
              @click="removeCredential(index)"
            />
          </div>

          <div
            v-if="credentialsForm.length === 0"
            class="py-4 text-center text-sm text-[color:var(--color-brand-muted)]"
          >
            Aucun diplôme ajouté.
          </div>

          <div class="flex items-center gap-3">
            <UButton
              v-if="credentialsForm.length < 20"
              variant="outline"
              icon="i-lucide-plus"
              label="Ajouter un diplôme"
              size="sm"
              type="button"
              @click="addCredential"
            />
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving"
              label="Enregistrer"
            />
          </div>
        </form>
      </div>

      <!-- Section 4: Photo de profil -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-camera"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Photo de profil
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Votre photo visible sur votre page publique. JPEG, PNG ou WebP, max 2 Mo.
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-6">
          <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[color:var(--color-surface-highlight)]">
            <img
              v-if="photoPreview"
              :src="photoPreview"
              alt="Photo de profil"
              class="h-full w-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-user"
              class="h-10 w-10 text-[color:var(--color-brand-muted)]"
            />
          </div>

          <div class="space-y-2">
            <input
              ref="fileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onFileSelected"
            >
            <UButton
              variant="outline"
              icon="i-lucide-upload"
              label="Modifier ma photo"
              size="sm"
              type="button"
              @click="triggerFileInput"
            />
            <UButton
              v-if="photoFile"
              :loading="photoUploading"
              :disabled="photoUploading"
              label="Enregistrer"
              size="sm"
              @click="handlePhotoUpload"
            />
            <p
              v-if="photoError"
              class="text-sm text-[color:var(--color-error)]"
            >
              {{ photoError }}
            </p>
          </div>
        </div>
      </div>

      <!-- Section 5: Réseaux sociaux -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-share-2"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Réseaux sociaux
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Vos liens professionnels en ligne.
            </p>
          </div>
        </div>

        <SystemAlert
          v-if="socialError"
          class="mt-4"
          variant="error"
          :description="socialError"
        />

        <form
          class="mt-6 grid gap-4"
          @submit.prevent="handleSocialSubmit"
        >
          <FormControl
            id="linkedin"
            label="LinkedIn"
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="socialForm.linkedin"
                v-bind="inputAttrs"
                placeholder="https://linkedin.com/in/..."
              />
            </template>
          </FormControl>

          <FormControl
            id="facebook"
            label="Facebook"
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="socialForm.facebook"
                v-bind="inputAttrs"
                placeholder="https://facebook.com/..."
              />
            </template>
          </FormControl>

          <FormControl
            id="instagram"
            label="Instagram"
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="socialForm.instagram"
                v-bind="inputAttrs"
                placeholder="https://instagram.com/..."
              />
            </template>
          </FormControl>

          <FormControl
            id="website"
            label="Site web"
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="socialForm.website"
                v-bind="inputAttrs"
                placeholder="https://..."
              />
            </template>
          </FormControl>

          <div>
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving"
              label="Enregistrer"
            />
          </div>
        </form>
      </div>

      <!-- Section 6: Téléphone public -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-phone"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Téléphone public
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Numéro affiché sur votre page publique (optionnel).
            </p>
          </div>
        </div>

        <form
          class="mt-6 grid gap-4"
          @submit.prevent="handlePhoneSubmit"
        >
          <FormControl
            id="publicPhone"
            label="Téléphone public (affiché sur votre page)"
            :error="!phoneValid ? 'Format E.164 requis (ex : +33612345678)' : undefined"
            class="max-w-md"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="phoneForm.publicPhone"
                v-bind="inputAttrs"
                placeholder="+33 6 12 34 56 78"
                type="tel"
              />
            </template>
          </FormControl>

          <div>
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving || !phoneValid"
              label="Enregistrer"
            />
          </div>
        </form>
      </div>

      <!-- Section 8b: Lead magnet -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-file-text"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Lead magnet
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Proposez un guide PDF gratuit pour capturer les emails de vos visiteuses.
            </p>
          </div>
        </div>

        <form
          class="mt-6 space-y-6"
          @submit.prevent="handleLeadMagnetSubmit"
        >
          <!-- PDF upload -->
          <div>
            <label class="mb-2 block text-sm font-medium text-[color:var(--color-brand-primary)]">
              Fichier PDF
            </label>
            <div
              v-if="leadMagnetForm.url"
              class="flex items-center gap-3 rounded-lg border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-highlight)] p-3"
            >
              <UIcon
                name="i-lucide-file-text"
                class="size-5 text-[color:var(--color-brand-accent)]"
              />
              <a
                :href="leadMagnetForm.url"
                target="_blank"
                rel="noopener noreferrer"
                class="flex-1 truncate text-sm text-[color:var(--color-brand-primary)] underline hover:no-underline"
              >
                {{ leadMagnetForm.url.split('/').pop() }}
              </a>
              <UButton
                variant="ghost"
                size="xs"
                color="error"
                icon="i-lucide-trash-2"
                @click="removeLeadMagnet"
              />
            </div>
            <div
              v-else
              class="space-y-2"
            >
              <input
                ref="leadMagnetInputRef"
                type="file"
                accept="application/pdf"
                class="hidden"
                @change="onLeadMagnetSelected"
              >
              <div class="flex items-center gap-3">
                <UButton
                  type="button"
                  variant="outline"
                  icon="i-lucide-upload"
                  :loading="leadMagnetUploading"
                  @click="triggerLeadMagnetInput"
                >
                  Choisir un PDF
                </UButton>
                <span
                  v-if="leadMagnetFile"
                  class="text-sm text-[color:var(--color-brand-secondary)]"
                >
                  {{ leadMagnetFile.name }}
                </span>
              </div>
              <UButton
                v-if="leadMagnetFile"
                type="button"
                size="sm"
                :loading="leadMagnetUploading"
                @click="handleLeadMagnetUpload"
              >
                Uploader
              </UButton>
            </div>
            <p
              v-if="leadMagnetError"
              class="mt-2 text-sm text-[color:var(--color-error)]"
            >
              {{ leadMagnetError }}
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              Format : PDF uniquement · Taille max : 10 Mo
            </p>
          </div>

          <!-- Title -->
          <div>
            <label
              for="leadMagnetTitle"
              class="mb-2 block text-sm font-medium text-[color:var(--color-brand-primary)]"
            >
              Titre du guide
            </label>
            <UInput
              id="leadMagnetTitle"
              v-model="leadMagnetForm.title"
              placeholder="Ex : Les 7 signaux que votre corps vous envoie en périménopause"
              :maxlength="200"
            />
            <p
              class="mt-1 text-right text-xs"
              :class="leadMagnetTitleCharCount > 180 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
            >
              {{ leadMagnetTitleCharCount }}/200
            </p>
            <p class="text-xs text-[color:var(--color-brand-muted)]">
              Ce titre apparaît sur votre page publique dans la section de téléchargement.
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving"
              label="Enregistrer"
            />
          </div>
        </form>
      </div>

      <!-- Section 8c: Google Ads -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-megaphone"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Marketing
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Configurez le suivi de vos campagnes publicitaires.
            </p>
          </div>
        </div>

        <form
          class="mt-6 space-y-4"
          @submit.prevent="handleMarketingSubmit"
        >
          <div>
            <div class="flex items-center gap-2">
              <label
                for="googleAdsId"
                class="block text-sm font-medium text-[color:var(--color-brand-primary)]"
              >
                ID de conversion Google Ads
              </label>
              <span
                v-if="marketingForm.googleAdsId"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="adsIdValid ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]' : 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]'"
              >
                {{ adsIdValid ? 'Actif' : 'Format invalide' }}
              </span>
            </div>
            <UInput
              id="googleAdsId"
              v-model="marketingForm.googleAdsId"
              placeholder="AW-123456789"
              :maxlength="20"
              class="mt-1"
            />
            <p
              v-if="!adsIdValid"
              class="mt-1 text-xs text-[color:var(--color-error)]"
            >
              Format attendu : AW- suivi de 5 à 12 chiffres
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              Trouvez cette valeur dans Google Ads > Outils > Conversions
            </p>
          </div>

          <div>
            <label
              for="googleAdsConversionLabel"
              class="block text-sm font-medium text-[color:var(--color-brand-primary)]"
            >
              Label de conversion
            </label>
            <UInput
              id="googleAdsConversionLabel"
              v-model="marketingForm.googleAdsConversionLabel"
              placeholder="abcDEF123"
              :maxlength="50"
              class="mt-1"
            />
            <p
              v-if="!adsLabelValid"
              class="mt-1 text-xs text-[color:var(--color-error)]"
            >
              Caractères alphanumériques, tirets ou underscores uniquement (max 50)
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              Optionnel — fourni par Google Ads lors de la création de la conversion
            </p>
          </div>

          <!-- Microsoft Clarity (same Marketing section) -->
          <div class="border-t border-[color:var(--color-brand-subtle)] pt-4">
            <div class="flex items-center gap-2">
              <label
                for="microsoftClarityId"
                class="block text-sm font-medium text-[color:var(--color-brand-primary)]"
              >
                ID de projet Microsoft Clarity
              </label>
              <span
                v-if="marketingForm.microsoftClarityId"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                :class="clarityIdValid ? 'bg-[color:var(--color-success-100)] text-[color:var(--color-success-700)]' : 'bg-[color:var(--color-error-100)] text-[color:var(--color-error-700)]'"
              >
                {{ clarityIdValid ? 'Actif' : 'Format invalide' }}
              </span>
            </div>
            <UInput
              id="microsoftClarityId"
              v-model="marketingForm.microsoftClarityId"
              placeholder="lz1abc2def"
              :maxlength="20"
              class="mt-1"
            />
            <p
              v-if="!clarityIdValid"
              class="mt-1 text-xs text-[color:var(--color-error)]"
            >
              Format attendu : 6 à 20 caractères alphanumériques minuscules
            </p>
            <p class="mt-1 text-xs text-[color:var(--color-brand-muted)]">
              Trouvez cette valeur dans Clarity > Settings > Overview > Project ID
            </p>
          </div>

          <div class="flex justify-end">
            <UButton
              type="submit"
              :loading="saving"
              :disabled="saving || !adsIdValid || !adsLabelValid || !clarityIdValid"
              label="Enregistrer"
            />
          </div>
        </form>
      </div>

      <!-- Section 9: Adresse email -->
      <div
        v-if="!isSupportMode"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]"
      >
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

      <!-- Section 10: Mot de passe -->
      <div
        v-if="!isSupportMode"
        class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]"
      >
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
