<script setup lang="ts">
/**
 * IconPicker — Sélecteur d'icônes orienté coach (Story 0-37 AC-7).
 *
 * Propose une liste ordonnée d'icônes Lucide pertinentes pour les coachs ménopause/santé,
 * avec aperçu visuel, libellé français accessible, filtre de recherche et sélection au clavier.
 */
import { computed, ref } from 'vue'

interface CuratedIcon {
  name: string
  label: string
  category: 'planning' | 'sante' | 'relation' | 'action' | 'etat'
}

const CURATED_ICONS: CuratedIcon[] = [
  // Planning & Temps
  { name: 'calendar', label: 'Calendrier', category: 'planning' },
  { name: 'clock', label: 'Horloge / Temps', category: 'planning' },
  { name: 'calendar-check', label: 'Rendez-vous validé', category: 'planning' },
  { name: 'hourglass', label: 'Sablier', category: 'planning' },

  // Santé & Bien-être
  { name: 'heart', label: 'Cœur / Bien-être', category: 'sante' },
  { name: 'heart-pulse', label: 'Santé / Vitalité', category: 'sante' },
  { name: 'moon-star', label: 'Sommeil / Nuit', category: 'sante' },
  { name: 'sun', label: 'Énergie / Jour', category: 'sante' },
  { name: 'sparkles', label: 'Éclat / Sérénité', category: 'sante' },
  { name: 'flower', label: 'Nature / Équilibre', category: 'sante' },
  { name: 'apple', label: 'Nutrition', category: 'sante' },
  { name: 'wind', label: 'Respiration / Calme', category: 'sante' },

  // Relation & Écoute
  { name: 'phone', label: 'Téléphone / Appel', category: 'relation' },
  { name: 'video', label: 'Visio / Vidéo', category: 'relation' },
  { name: 'users', label: 'Communauté / Groupe', category: 'relation' },
  { name: 'user-check', label: 'Accompagnement individuel', category: 'relation' },
  { name: 'message-circle', label: 'Échange / Discussion', category: 'relation' },
  { name: 'heart-handshake', label: 'Confiance / Partenariat', category: 'relation' },
  { name: 'smile', label: 'Sourire / Positif', category: 'relation' },

  // Action & Méthode
  { name: 'target', label: 'Objectif / Cible', category: 'action' },
  { name: 'compass', label: 'Orientation / Cap', category: 'action' },
  { name: 'map-pin', label: 'Localisation / Lieu', category: 'action' },
  { name: 'check-circle-2', label: 'Validation / Succès', category: 'action' },
  { name: 'shield-check', label: 'Sécurité / Protection', category: 'action' },
  { name: 'award', label: 'Certification / Diplôme', category: 'action' },
  { name: 'book-open', label: 'Savoir / Guide', category: 'action' },
  { name: 'lightbulb', label: 'Idée / Déclic', category: 'action' }
]

const props = defineProps<{
  modelValue?: string | null
  label?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const isOpen = ref(false)
const searchQuery = ref('')

function normalizeRawName(name?: string | null): string {
  if (!name) return ''
  return name.replace(/^i-lucide-/, '')
}

const currentNormalized = computed(() => normalizeRawName(props.modelValue))

const filteredIcons = computed(() => {
  const q = searchQuery.value.trim().toLowerCase()
  if (!q) return CURATED_ICONS
  return CURATED_ICONS.filter(
    icon => icon.label.toLowerCase().includes(q) || icon.name.toLowerCase().includes(q)
  )
})

function selectIcon(name: string) {
  emit('update:modelValue', `i-lucide-${name}`)
  isOpen.value = false
}

const selectedIconLabel = computed(() => {
  const norm = currentNormalized.value
  if (!norm) return 'Choisir une icône'
  const match = CURATED_ICONS.find(i => i.name === norm)
  return match ? match.label : norm
})
</script>

<template>
  <div class="flex items-center gap-3">
    <!-- Trigger button -->
    <button
      type="button"
      class="inline-flex items-center gap-2.5 rounded-lg border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)] px-3 py-2 text-sm font-medium text-[color:var(--color-text-primary)] transition hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-surface-page)]"
      :aria-label="label ? `${label} : ${selectedIconLabel}` : `Choisir une icône : ${selectedIconLabel}`"
      @click="isOpen = true"
    >
      <div class="flex size-7 items-center justify-center rounded-md bg-[color:var(--color-brand-primary)]/10 text-[color:var(--color-brand-primary)]">
        <UIcon
          :name="props.modelValue || 'i-lucide-circle'"
          class="size-4"
        />
      </div>
      <span class="text-xs font-normal text-[color:var(--color-brand-secondary)]">
        {{ selectedIconLabel }}
      </span>
      <UIcon
        name="i-lucide-chevron-down"
        class="size-3.5 text-[color:var(--color-text-muted)]"
      />
    </button>

    <!-- Modal picker -->
    <UModal
      v-model:open="isOpen"
      title="Choisir une icône"
    >
      <template #content>
        <div class="p-5 space-y-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <h3 class="text-base font-semibold text-[color:var(--color-text-primary)]">
                Sélectionner une icône
              </h3>
              <p class="text-xs text-[color:var(--color-brand-secondary)]">
                Choisissez une icône représentative parmi notre sélection soignée.
              </p>
            </div>
          </div>

          <!-- Search input -->
          <UInput
            v-model="searchQuery"
            icon="i-lucide-search"
            placeholder="Rechercher une icône (ex: sommeil, nutrition, appel)..."
            class="w-full"
            autofocus
          />

          <!-- Grid of curated icons -->
          <div class="grid max-h-72 grid-cols-4 gap-2.5 overflow-y-auto p-1 sm:grid-cols-6">
            <button
              v-for="icon in filteredIcons"
              :key="icon.name"
              type="button"
              class="flex flex-col items-center gap-1.5 rounded-xl border p-2.5 text-center transition"
              :class="currentNormalized === icon.name
                ? 'border-[color:var(--color-brand-primary)] bg-[color:var(--color-brand-primary)]/10 text-[color:var(--color-brand-primary)] font-semibold ring-2 ring-[color:var(--color-brand-primary)]/20'
                : 'border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] text-[color:var(--color-text-primary)] hover:border-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-surface-card)]'"
              :aria-label="icon.label"
              :aria-pressed="currentNormalized === icon.name"
              @click="selectIcon(icon.name)"
            >
              <UIcon
                :name="`i-lucide-${icon.name}`"
                class="size-5"
              />
              <span class="line-clamp-1 text-[11px] leading-tight">
                {{ icon.label }}
              </span>
            </button>
          </div>

          <div
            v-if="filteredIcons.length === 0"
            class="py-8 text-center text-xs text-[color:var(--color-brand-muted)]"
          >
            Aucune icône ne correspond à votre recherche.
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton
              color="neutral"
              variant="outline"
              size="sm"
              @click="isOpen = false"
            >
              Fermer
            </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
