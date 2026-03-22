<script setup lang="ts">
// TODO: extract AccountEmailSection + AccountPasswordSection shared components (duplicated with client/account.vue)
import { useProviderAccount } from '../../features/account/useProviderAccount'
import { useAuthActions } from '../../features/auth/useAuthActions'
import { apiFetch } from '../../services/api/apiFetch'
import { isPasswordStrong, getPasswordCriteria } from '../../features/auth/password/password-policy'
import type { CredentialItem, SocialLinks, TestimonialItem } from '../../features/account/api/provider-account.contract'

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

// ── Professional profile form state ─────────────────
const profileForm = reactive({
  longBio: '' as string | null,
  city: '' as string | null,
  region: '' as string | null
})

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
const phoneForm = reactive({ publicPhone: '' as string | null })
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

// ── Secondary photo upload state ─────────────────────
const secondaryPhotoFile = ref<File | null>(null)
const secondaryPhotoPreview = ref<string | null>(null)
const secondaryPhotoUploading = ref(false)
const secondaryPhotoError = ref<string | null>(null)
const secondaryFileInputRef = ref<HTMLInputElement | null>(null)

// ── Hero headline form state ────────────────────────
const heroHeadlineForm = reactive({ heroHeadline: '' as string | null })

// ── Urgency text form state ─────────────────────────
const urgencyForm = reactive({ urgencyText: '' as string | null })

// ── Testimonials form state ─────────────────────────
const testimonialsForm = ref<TestimonialItem[]>([])

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
const longBioCharCount = computed(() => profileForm.longBio?.length ?? 0)
const heroHeadlineCharCount = computed(() => heroHeadlineForm.heroHeadline?.length ?? 0)
const urgencyCharCount = computed(() => urgencyForm.urgencyText?.length ?? 0)
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
  personalForm.bio = acc.bio
  personalForm.specialties = [...(acc.specialties ?? [])]

  // Professional profile
  profileForm.longBio = acc.longBio
  profileForm.city = acc.city
  profileForm.region = acc.region

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
  phoneForm.publicPhone = acc.publicPhone

  // Hero headline
  heroHeadlineForm.heroHeadline = acc.heroHeadline

  // Urgency
  urgencyForm.urgencyText = acc.urgencyText

  // Testimonials
  testimonialsForm.value = acc.testimonialsJson?.length
    ? acc.testimonialsJson.map(t => ({ ...t }))
    : []
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

// ── Testimonials handlers ───────────────────────────
function addTestimonial() {
  if (testimonialsForm.value.length >= 10) return
  testimonialsForm.value.push({ quote: '', firstName: '' })
}

function removeTestimonial(index: number) {
  testimonialsForm.value.splice(index, 1)
}

// ── Shared upload helper (uses apiFetch for auth retry + error normalization) ──
async function uploadAsset(type: string, file: File): Promise<{ url: string, thumbnailUrl?: string }> {
  const formData = new FormData()
  formData.append('type', type)
  formData.append('file', file)
  return apiFetch<{ url: string, thumbnailUrl?: string }>('/provider/assets/upload', {
    method: 'POST',
    body: formData
  })
}

function formatUploadError(e: unknown): string {
  const msg = e instanceof Error ? e.message : ''
  if (msg.includes('INVALID_MIME')) return 'Format d\'image non reconnu. Utilisez un fichier JPEG, PNG ou WebP valide.'
  return 'Erreur lors de l\'upload de la photo.'
}

// ── Photo upload handlers ───────────────────────────
function triggerFileInput() {
  fileInputRef.value?.click()
}

function onFileSelected(event: Event) {
  photoError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'La taille maximale est de 2 Mo.'
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    photoError.value = 'Formats acceptés : JPEG, PNG ou WebP.'
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

// ── Secondary photo upload handlers ──────────────────
function triggerSecondaryFileInput() {
  secondaryFileInputRef.value?.click()
}

function onSecondaryFileSelected(event: Event) {
  secondaryPhotoError.value = null
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    secondaryPhotoError.value = 'La taille maximale est de 2 Mo.'
    return
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    secondaryPhotoError.value = 'Formats acceptés : JPEG, PNG ou WebP.'
    return
  }

  secondaryPhotoFile.value = file
  secondaryPhotoPreview.value = URL.createObjectURL(file)
}

async function handleSecondaryPhotoUpload() {
  if (!secondaryPhotoFile.value) return
  secondaryPhotoUploading.value = true
  secondaryPhotoError.value = null

  try {
    const result = await uploadAsset('secondary_photo', secondaryPhotoFile.value)
    secondaryPhotoPreview.value = result.url
    secondaryPhotoFile.value = null
    toast.add({ title: 'Photo secondaire mise à jour', color: 'primary' })
  } catch (e: unknown) {
    secondaryPhotoError.value = formatUploadError(e)
    toast.add({ title: 'Erreur', description: secondaryPhotoError.value, color: 'error' })
  } finally {
    secondaryPhotoUploading.value = false
  }
}

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

async function handleProfileSubmit() {
  const success = await updateAccount({
    longBio: profileForm.longBio || null,
    city: profileForm.city || null,
    region: profileForm.region || null
  })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

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

async function handleUrgencySubmit() {
  const success = await updateAccount({
    heroHeadline: heroHeadlineForm.heroHeadline?.trim() || null,
    urgencyText: urgencyForm.urgencyText?.trim() || null
  })
  if (success) {
    toast.add({ title: 'Informations mises à jour', color: 'primary' })
  } else {
    toast.add({ title: 'Erreur', description: error.value ?? 'Une erreur est survenue', color: 'error' })
  }
}

async function handleTestimonialsSubmit() {
  const filtered = testimonialsForm.value.filter(t => t.quote.trim() && t.firstName.trim())
  const success = await updateAccount({ testimonialsJson: filtered })
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

      <!-- Section 2: Profil professionnel -->
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
              Profil professionnel
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Détaillez votre parcours pour renforcer votre page publique.
            </p>
          </div>
        </div>

        <form
          class="mt-6 grid gap-4 sm:grid-cols-2"
          @submit.prevent="handleProfileSubmit"
        >
          <FormControl
            id="longBio"
            label="Bio détaillée (visible sur votre page publique)"
            class="sm:col-span-2"
          >
            <template #default="{ inputAttrs }">
              <UTextarea
                v-model="profileForm.longBio"
                v-bind="inputAttrs"
                placeholder="Détaillez votre parcours, vos méthodes, votre philosophie..."
                :maxlength="5000"
                autoresize
                :rows="5"
              />
            </template>
            <template #label-aside>
              <span
                class="text-xs"
                :class="longBioCharCount > 4500 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
              >
                {{ longBioCharCount }}/5000
              </span>
            </template>
          </FormControl>

          <FormControl
            id="city"
            label="Ville"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="profileForm.city"
                v-bind="inputAttrs"
                placeholder="Paris"
                :maxlength="100"
              />
            </template>
          </FormControl>

          <FormControl
            id="region"
            label="Région"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="profileForm.region"
                v-bind="inputAttrs"
                placeholder="Île-de-France"
                :maxlength="100"
              />
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

      <!-- Section 4b: Photo secondaire (section "Qui suis-je") -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-image"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Photo secondaire
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Photo affichée dans la section "Qui suis-je" de votre page publique. JPEG, PNG ou WebP, max 2 Mo.
            </p>
          </div>
        </div>

        <div class="mt-6 flex items-center gap-6">
          <div class="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <img
              v-if="secondaryPhotoPreview"
              :src="secondaryPhotoPreview"
              alt="Photo secondaire"
              class="h-full w-full object-cover"
            >
            <UIcon
              v-else
              name="i-lucide-image"
              class="h-10 w-10 text-[color:var(--color-brand-muted)]"
            />
          </div>

          <div class="space-y-2">
            <input
              ref="secondaryFileInputRef"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onSecondaryFileSelected"
            >
            <UButton
              variant="outline"
              icon="i-lucide-upload"
              label="Modifier la photo"
              size="sm"
              type="button"
              @click="triggerSecondaryFileInput"
            />
            <UButton
              v-if="secondaryPhotoFile"
              :loading="secondaryPhotoUploading"
              :disabled="secondaryPhotoUploading"
              label="Enregistrer"
              size="sm"
              @click="handleSecondaryPhotoUpload"
            />
            <p
              v-if="secondaryPhotoError"
              class="text-sm text-[color:var(--color-error)]"
            >
              {{ secondaryPhotoError }}
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

      <!-- Section 7: Message sous le bouton de réservation -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-message-circle"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Page publique
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Personnalisez l'affichage de votre page de réservation.
            </p>
          </div>
        </div>

        <form
          class="mt-6 grid gap-4"
          @submit.prevent="handleUrgencySubmit"
        >
          <FormControl
            id="heroHeadline"
            label="Titre principal de votre page (optionnel)"
            hint="Ce titre apparaît en grand sur votre page. Laissez vide pour un titre par défaut."
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="heroHeadlineForm.heroHeadline"
                v-bind="inputAttrs"
                placeholder="Ex: Retrouvez votre équilibre pendant la ménopause"
                :maxlength="200"
              />
            </template>
            <template #label-aside>
              <span
                class="text-xs"
                :class="heroHeadlineCharCount > 180 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
              >
                {{ heroHeadlineCharCount }}/200
              </span>
            </template>
          </FormControl>

          <FormControl
            id="urgencyText"
            label="Message sous le bouton de réservation (optionnel)"
            hint="Ce texte apparaît sous le bouton 'Réserver' sur votre page publique"
            class="max-w-lg"
          >
            <template #default="{ inputAttrs }">
              <UInput
                v-model="urgencyForm.urgencyText"
                v-bind="inputAttrs"
                placeholder="Ex: Prochaines disponibilités : semaine du 21 avril"
                :maxlength="200"
              />
            </template>
            <template #label-aside>
              <span
                class="text-xs"
                :class="urgencyCharCount > 180 ? 'text-[color:var(--color-warning)]' : 'text-[color:var(--color-brand-muted)]'"
              >
                {{ urgencyCharCount }}/200
              </span>
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

      <!-- Section 8: Témoignages -->
      <div class="rounded-[var(--radius-lg)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] p-6 shadow-[var(--shadow-card)]">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[color:var(--color-surface-highlight)]">
            <UIcon
              name="i-lucide-quote"
              class="h-6 w-6 text-[color:var(--color-brand-accent)]"
            />
          </div>
          <div>
            <h2 class="font-serif text-xl font-semibold text-[color:var(--color-brand-primary)]">
              Témoignages
            </h2>
            <p class="mt-1 text-sm text-[color:var(--color-brand-secondary)]">
              Les retours de vos clientes (max 10).
            </p>
          </div>
        </div>

        <form
          class="mt-6 space-y-6"
          @submit.prevent="handleTestimonialsSubmit"
        >
          <div
            v-for="(t, index) in testimonialsForm"
            :key="index"
            class="rounded-[var(--radius-md)] border border-[color:var(--color-brand-subtle)] p-4"
          >
            <div class="mb-3 flex items-center justify-between">
              <span class="text-sm font-medium text-[color:var(--color-brand-primary)]">Témoignage {{ index + 1 }}</span>
              <UButton
                variant="ghost"
                color="neutral"
                icon="i-lucide-trash-2"
                size="xs"
                aria-label="Supprimer ce témoignage"
                @click="removeTestimonial(index)"
              />
            </div>
            <div class="grid gap-3 sm:grid-cols-2">
              <div class="sm:col-span-2">
                <UTextarea
                  v-model="t.quote"
                  placeholder="Citation du témoignage *"
                  :minlength="10"
                  :maxlength="500"
                  autoresize
                  required
                />
              </div>
              <UInput
                v-model="t.firstName"
                placeholder="Prénom *"
                :minlength="2"
                :maxlength="50"
                required
              />
              <UInput
                v-model.number="t.age"
                type="number"
                placeholder="Âge"
                :min="18"
                :max="120"
              />
              <UInput
                v-model="t.location"
                placeholder="Localisation"
                :maxlength="100"
              />
              <USelectMenu
                v-model="t.rating"
                :items="[1, 2, 3, 4, 5]"
                placeholder="Note (1-5)"
              />
              <UInput
                v-model="t.result"
                placeholder="Résultat après X mois..."
                :maxlength="200"
                class="sm:col-span-2"
              />
            </div>
          </div>

          <div
            v-if="testimonialsForm.length === 0"
            class="py-4 text-center text-sm text-[color:var(--color-brand-muted)]"
          >
            Aucun témoignage ajouté.
          </div>

          <div class="flex items-center gap-3">
            <UButton
              v-if="testimonialsForm.length < 10"
              variant="outline"
              icon="i-lucide-plus"
              label="Ajouter un témoignage"
              size="sm"
              type="button"
              @click="addTestimonial"
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

      <!-- Section 9: Adresse email -->
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

      <!-- Section 10: Mot de passe -->
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
