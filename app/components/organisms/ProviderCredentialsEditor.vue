<script setup lang="ts">
import type { CredentialItem } from '~/features/account/api/provider-account.contract'
import {
  uploadAsset,
  formatUploadError,
  validateCertificationLogoFile
} from '~/features/assets/use-asset-upload'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

const emit = defineEmits<{
  'update:credentials': [value: CredentialItem[]]
}>()

const toast = useToast()

// ── Local form state (single source of truth inside the component) ──
const form = ref<CredentialItem[]>([])

// Sync whenever the parent passes a new list (initial load / post-save refetch).
watch(
  () => props.credentials,
  (value) => {
    form.value = (value ?? []).map(c => ({ ...c }))
  },
  { immediate: true, deep: true }
)

/**
 * L'année est nullable côté API, mais `@IsInt`/`@Min(1900)`/`@Max(2100)` y
 * rejettent tout le tableau : une valeur hors bornes ne doit donc jamais
 * partir. `Number('  ')` vaut 0 et `Number('-5')` vaut -5, d'où le clamp
 * explicite plutôt qu'un simple `Number.isNaN`.
 */
function sanitizeYear(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = Math.trunc(Number(value))
  return Number.isFinite(n) && n >= 1900 && n <= 2100 ? n : null
}

function emitUpdate() {
  emit(
    'update:credentials',
    form.value.map(c => ({ ...c, year: sanitizeYear(c.year) }))
  )
}

// ── Handlers ──
/**
 * Compteur de mutations STRUCTURELLES (ajout / suppression de ligne).
 *
 * Le watcher ci-dessus remplace tous les objets de `form` à chaque émission
 * du parent — donc à chaque frappe. Comparer l'identité de l'objet capturé
 * avant l'upload avec celui trouvé après `await` ne prouve donc rien : la
 * garde d'origine jetait le logo silencieusement dès qu'une frappe survenait
 * pendant l'envoi. L'index, lui, reste valide tant que la structure n'a pas
 * bougé — c'est ce que ce compteur mesure.
 */
let structureVersion = 0

function addCredential() {
  if (form.value.length >= 20) return
  form.value.push({ title: '' })
  structureVersion += 1
  emitUpdate()
}

function removeCredential(index: number) {
  form.value.splice(index, 1)
  structureVersion += 1
  emitUpdate()
}

function toggleFeaturedCredential(index: number, value: boolean) {
  form.value.forEach((c, i) => {
    c.featured = i === index ? value : false
  })
  emitUpdate()
}

/**
 * LAB.3 — nom accessible de l'interrupteur. Le texte visible est identique sur
 * chaque ligne (« Mettre en avant sur ma page ») : sans ce libellé, un lecteur
 * d'écran annonce N interrupteurs sans savoir à quelle certification ils se
 * rapportent. Il contient le texte visible (WCAG 2.5.3).
 */
function featuredSwitchLabel(cred: CredentialItem, index: number) {
  const title = cred.title?.trim() || `certification ${index + 1}`
  return `Mettre en avant ${title} sur ma page`
}

// ── Certification logo upload ──
const logoFileInput = ref<HTMLInputElement | null>(null)
const pendingLogoIndex = ref<number | null>(null)
const uploadingLogo = ref(false)

function triggerCredentialLogoUpload(index: number) {
  if (uploadingLogo.value) return
  pendingLogoIndex.value = index
  logoFileInput.value?.click()
}

async function onCredentialLogoFileChange(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || pendingLogoIndex.value === null) {
    input.value = ''
    return
  }
  const idx = pendingLogoIndex.value
  const validationError = validateCertificationLogoFile(file)
  if (validationError) {
    toast.add({ title: validationError, color: 'error' })
    input.value = ''
    pendingLogoIndex.value = null
    return
  }
  const versionAtStart = structureVersion
  uploadingLogo.value = true
  try {
    const result = await uploadAsset('certification_logo', file)
    const cred = form.value[idx]
    if (structureVersion !== versionAtStart || !cred) {
      // La ligne a été ajoutée/supprimée pendant l'envoi : l'index ne désigne
      // plus la même certification. On préfère perdre l'upload (objet orphelin
      // côté serveur, comme avant) plutôt que d'attacher le logo au mauvais
      // diplôme — mais on le DIT, au lieu de jeter le résultat en silence.
      toast.add({ title: 'Logo non appliqué : la liste a changé pendant l\'envoi. Réessayez.', color: 'error' })
      return
    }
    cred.logoAssetId = result.assetId
    cred.logoUrl = result.url
    emitUpdate()
  } catch (e) {
    toast.add({ title: formatUploadError(e, 'certification_logo'), color: 'error' })
  } finally {
    uploadingLogo.value = false
    input.value = ''
    pendingLogoIndex.value = null
  }
}

function removeCredentialLogo(index: number) {
  const cred = form.value[index]
  if (cred) {
    delete cred.logoAssetId
    delete cred.logoUrl
  }
  emitUpdate()
}
</script>

<template>
  <div class="space-y-4">
    <input
      ref="logoFileInput"
      type="file"
      accept="image/png,image/jpeg,image/webp"
      class="hidden"
      @change="onCredentialLogoFileChange"
    >

    <div
      v-for="(cred, index) in form"
      :key="index"
      class="space-y-2 rounded-lg border border-[color:var(--color-brand-subtle)] p-3"
    >
      <div class="flex items-start gap-3">
        <div class="grid flex-1 gap-3 sm:grid-cols-3">
          <UInput
            v-model="cred.title"
            placeholder="Intitulé *"
            aria-label="Intitulé (obligatoire)"
            :maxlength="200"
            required
            @update:model-value="emitUpdate"
          />
          <UInput
            v-model="cred.institution"
            placeholder="Établissement"
            aria-label="Établissement"
            :maxlength="200"
            @update:model-value="emitUpdate"
          />
          <UInput
            :model-value="cred.year ?? undefined"
            type="number"
            placeholder="Année (optionnelle)"
            aria-label="Année (optionnelle)"
            :min="1900"
            :max="2100"
            @update:model-value="(v: string | number | null) => { cred.year = v === '' || v === null ? null : Number(v); emitUpdate() }"
          />
        </div>
        <UButton
          variant="ghost"
          color="neutral"
          icon="i-lucide-trash-2"
          size="sm"
          :aria-label="`Supprimer ${cred.title?.trim() || `l'entrée ${index + 1}`}`"
          @click="removeCredential(index)"
        />
      </div>
      <div class="flex items-center gap-2">
        <img
          v-if="cred.logoUrl"
          :src="cred.logoUrl"
          :alt="cred.institution ? cred.institution + ' — ' + cred.title : cred.title"
          width="96"
          height="24"
          class="h-6 w-auto max-w-[4rem] object-contain"
        >
        <UButton
          type="button"
          size="xs"
          variant="outline"
          icon="i-lucide-image"
          :aria-describedby="`credential-logo-hint-${index}`"
          :label="cred.logoAssetId ? 'Changer le logo' : 'Ajouter un logo'"
          :loading="uploadingLogo && pendingLogoIndex === index"
          @click="triggerCredentialLogoUpload(index)"
        />
        <UButton
          v-if="cred.logoAssetId"
          type="button"
          size="xs"
          variant="ghost"
          color="neutral"
          icon="i-lucide-x"
          label="Retirer le logo"
          @click="removeCredentialLogo(index)"
        />
        <span
          :id="`credential-logo-hint-${index}`"
          class="text-xs text-[color:var(--color-brand-muted)]"
        >
          PNG, JPEG ou WebP — SVG non accepté.
        </span>
      </div>
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <span class="text-xs text-[color:var(--color-brand-secondary)]">
            Nature
          </span>
          <!--
            `value: ''` est interdit par Reka UI (il lève « must have a value
            prop that is not an empty string ») et n'apparaît donc pas dans le
            DOM : le retour à « non renseigné » passe par la sentinelle
            `unset`, convertie en `undefined` dans le handler. Sans elle, une
            fois « Diplôme » choisi, l'AC1 (revenir à non renseigné) était
            inatteignable.
          -->
          <USelect
            :model-value="cred.kind ?? 'unset'"
            :items="[
              { label: 'Non renseigné', value: 'unset' },
              { label: 'Diplôme', value: 'diploma' },
              { label: 'Certification ou formation', value: 'certification' }
            ]"
            size="xs"
            :aria-label="`Nature de ${cred.title?.trim() || `l'entrée ${index + 1}`}`"
            @update:model-value="(v: string | null) => {
              cred.kind = v === 'unset' || v === '' || v === null
                ? undefined
                : (v as 'diploma' | 'certification')
              emitUpdate()
            }"
          />
        </div>
        <div class="flex items-center gap-2">
          <USwitch
            :model-value="cred.featured ?? false"
            :aria-label="featuredSwitchLabel(cred, index)"
            @update:model-value="(v: boolean) => toggleFeaturedCredential(index, v)"
          />
          <span class="text-xs text-[color:var(--color-brand-secondary)]">
            Mettre en avant sur ma page
          </span>
        </div>
      </div>
      <p
        :id="`credential-kind-hint-${index}`"
        class="text-xs text-[color:var(--color-brand-muted)]"
      >
        Sert à distinguer vos diplômes de vos certifications sur votre page publique
        (icône diplôme ou certification). Laisser « Non renseigné » affiche l'icône
        diplôme par défaut.
      </p>
    </div>

    <div
      v-if="form.length === 0"
      class="py-4 text-center text-sm text-[color:var(--color-brand-muted)]"
    >
      Aucune entrée ajoutée.
    </div>

    <UButton
      v-if="form.length < 20"
      variant="outline"
      icon="i-lucide-plus"
      label="Ajouter une entrée"
      size="sm"
      type="button"
      @click="addCredential"
    />
  </div>
</template>
