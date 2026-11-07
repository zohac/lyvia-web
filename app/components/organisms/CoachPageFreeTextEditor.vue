<script setup lang="ts">
/**
 * CPD.5 — Éditeur « Bloc de texte libre », extrait de `coach-page.vue`.
 *
 * La carte est contrôlée : elle reçoit le formulaire en prop et émet
 * `update:title`, `update:paragraph`, `add-paragraph`, `remove-paragraph` —
 * sans jamais toucher au store.
 *
 * Le verrou (I3) reste dans l'enveloppe (`CoachPageSectionCard`) : la carte est
 * montée dans les deux états (on et off) et ne décide jamais de se replier. Le
 * prédicat `hasCoachFreeTextContent` reste l'unique source.
 *
 * Plafond : 10 paragraphes × 2000 caractères, titre ≤ 200.
 */
import type { FreeTextJson } from '~/features/seo/api/public-provider-profile.contract'

import { computed } from 'vue'

import FormControl from '~/components/molecules/FormControl.vue'

const FREE_TEXT_TITLE_MAX_LENGTH = 200
const FREE_TEXT_PARAGRAPH_MAX = 10
const FREE_TEXT_PARAGRAPH_MAX_LENGTH = 2000

const props = withDefaults(
  defineProps<{
    freeTextForm?: FreeTextJson | null
  }>(),
  {
    freeTextForm: null
  }
)

const title = computed(() => props.freeTextForm?.title ?? '')
const paragraphs = computed(() => props.freeTextForm?.paragraphs ?? [])

const emit = defineEmits<{
  'update:title': [value: string]
  'update:paragraph': [patch: { index: number, value: string }]
  'add-paragraph': []
  'remove-paragraph': [index: number]
}>()
</script>

<template>
  <div class="space-y-4 px-6 py-5">
    <p class="text-sm text-[color:var(--color-brand-secondary)]">
      Un texte libre qui s'affiche entre vos bénéfices et la section
      « Qui suis-je ». Le titre est facultatif ; les paragraphes
      s'affichent tels que vous les saisissez.
    </p>

    <FormControl
      id="freeTextTitle"
      label="Titre du bloc (facultatif)"
      :hint="`Facultatif — ${FREE_TEXT_TITLE_MAX_LENGTH} caractères maximum`"
    >
      <template #default="{ inputAttrs }">
        <UInput
          :model-value="title"
          v-bind="inputAttrs"
          placeholder="Comment je travaille avec vous"
          :maxlength="FREE_TEXT_TITLE_MAX_LENGTH"
          @update:model-value="emit('update:title', $event as string)"
        />
      </template>
    </FormControl>

    <FormControl
      id="freeTextParagraph"
      label="Paragraphes"
      :hint="`Jusqu'à ${FREE_TEXT_PARAGRAPH_MAX} paragraphes de ${FREE_TEXT_PARAGRAPH_MAX_LENGTH} caractères`"
    >
      <template #default="{ inputAttrs }">
        <div class="space-y-3">
          <div
            v-for="(_, idx) in paragraphs"
            :key="idx"
            class="relative"
          >
            <button
              type="button"
              class="absolute -right-1 -top-1 z-10 text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-error)]"
              :aria-label="`Supprimer le paragraphe ${idx + 1}`"
              @click="emit('remove-paragraph', idx)"
            >
              <UIcon
                name="i-lucide-x"
                class="size-4"
              />
            </button>
            <!-- YB.1.1 — CR round 2 : le premier textarea porte l'id et
                 l'aria-describedby du FormControl ; sans cela le label
                 « Paragraphes » et le hint pointent dans le vide. CPD.5 :
                 l'attribut reste en DERNIÈRE position, sinon il écrase les
                 attributs explicites ci-dessus. -->
            <UTextarea
              :model-value="paragraphs[idx]"
              class="w-full"
              :placeholder="`Paragraphe ${idx + 1} (max ${FREE_TEXT_PARAGRAPH_MAX_LENGTH} caractères)`"
              :maxlength="FREE_TEXT_PARAGRAPH_MAX_LENGTH"
              :rows="4"
              size="sm"
              v-bind="idx === 0 ? inputAttrs : {}"
              @update:model-value="emit('update:paragraph', { index: idx, value: $event as string })"
            />
          </div>
        </div>
      </template>
    </FormControl>

    <UButton
      color="neutral"
      variant="outline"
      size="sm"
      icon="i-lucide-plus"
      :disabled="paragraphs.length >= FREE_TEXT_PARAGRAPH_MAX"
      @click="emit('add-paragraph')"
    >
      Ajouter un paragraphe
    </UButton>

    <p
      v-if="paragraphs.length >= FREE_TEXT_PARAGRAPH_MAX"
      data-testid="free-text-paragraph-limit-reason"
      class="text-sm text-[color:var(--color-brand-secondary)]"
      role="note"
    >
      Vous avez atteint le maximum de {{ FREE_TEXT_PARAGRAPH_MAX }} paragraphes.
    </p>
  </div>
</template>
