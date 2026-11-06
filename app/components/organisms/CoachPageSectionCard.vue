<script setup lang="ts">
/**
 * CPD.1 — enveloppe d'une section éditable de `coach-page.vue` : titre,
 * interrupteur « Visible sur ma page », raison de verrouillage, corps (slot) et
 * pied « Enregistrer ».
 *
 * Déplacée depuis la boucle `v-for="section in orderedEditableSections"` de la
 * page, où cette enveloppe était recopiée à l'identique et où le pied était
 * écrit dix fois. La carte ne décide de rien : elle rend ce que la page lui
 * passe, et reste montable seule (cf. `tests/coach/cpd-1-section-card.test.ts`).
 *
 * Deux règles non évidentes, héritées du markup d'origine — ne pas les
 * « simplifier » :
 * - `border-b` n'est posé sur l'en-tête QUE si le corps est ouvert : sinon le
 *   trait reste orphelin sous une carte collapsée. La condition porte sur
 *   `bodyOpen` et non sur `isOn` : le bloc de texte libre garde son corps
 *   déplié même éteint, sans quoi il serait impossible à remplir (YB.1.1).
 * - la raison de verrouillage est rendue dans le DOM (`role="note"`) et pas
 *   seulement dans un `title` : `disabled` retire l'interrupteur de l'ordre de
 *   tabulation, donc la raison est la seule chose qu'un lecteur d'écran
 *   atteindra. L'interrupteur n'est désactivé que si `locked`.
 *
 * `certifications` porte son propre pied (`CoachPageCertificationsCard`, tf-3) :
 * la page passe `show-footer=false`, deux pieds produiraient deux boutons.
 * C'est la seule exception : CPD.2 (bio, énoncé) et CPD.3 (bénéfices, piliers,
 * déroulé) ont été ramenés à cette règle — une carte de corps n'ajoute ni pied
 * ni `save`.
 */
withDefaults(
  defineProps<{
    section: string
    label: string
    isOn: boolean
    locked?: boolean
    lockReason?: string | null
    bodyOpen?: boolean
    saving?: boolean
    showFooter?: boolean
  }>(),
  {
    locked: false,
    lockReason: null,
    bodyOpen: true,
    saving: false,
    showFooter: true
  }
)

const emit = defineEmits<{
  toggle: [section: string, value: boolean]
  save: []
}>()
</script>

<template>
  <section
    :id="section === 'pillars' ? 'section-pillars' : 'section-' + section"
    class="mb-10 rounded-xl border border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-card)]"
  >
    <div
      class="flex items-center justify-between px-6 py-4"
      :class="bodyOpen ? 'border-b border-[color:var(--color-border-subtle)]' : ''"
    >
      <h2 class="text-lg font-semibold text-[color:var(--color-text-primary)]">
        {{ label }}
      </h2>
      <label class="flex items-center gap-3">
        <span class="text-sm text-[color:var(--color-brand-secondary)]">Visible sur ma page</span>
        <USwitch
          :model-value="isOn"
          :disabled="locked"
          :aria-label="label + ' — visible sur ma page'"
          @update:model-value="(v: boolean) => emit('toggle', section, v)"
        />
      </label>
    </div>

    <p
      v-if="lockReason"
      data-testid="free-text-lock-reason"
      class="border-b border-[color:var(--color-border-subtle)] bg-[color:var(--color-surface-page)] px-6 py-3 text-sm text-[color:var(--color-brand-secondary)]"
      role="note"
    >
      {{ lockReason }}
    </p>

    <!-- Contenu (collapsed si off) + pied. `template` et non `div` : le corps et
         le pied restent les enfants directs de `<section>`, exactement la
         structure que la page émettait avant l'extraction. -->
    <template v-if="bodyOpen">
      <slot />
      <div
        v-if="showFooter"
        class="flex justify-end border-t border-[color:var(--color-border-subtle)] px-6 py-4"
      >
        <UButton
          color="primary"
          variant="solid"
          size="sm"
          :loading="saving"
          @click="emit('save')"
        >
          Enregistrer
        </UButton>
      </div>
    </template>
  </section>
</template>
