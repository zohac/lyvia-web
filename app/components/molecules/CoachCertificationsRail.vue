<script setup lang="ts">
/**
 * CoachCertificationsRail — orchestration LAB.5 des groupes de qualifications.
 *
 * La plaque de tête (hero) ne change pas : elle reste gérée par LAB.3 via
 * `findFeaturedCredential` / `selectHeroCredential`. Ici on ne fait que répartir
 * les entrées entre deux groupes nommés sur la section sous « Qui suis-je » :
 *
 *   1. « Certifications & formations »  → `kind === 'certification'`
 *   2. « Diplômes & autres formations » → tout le reste (diplôme explicite OU
 *      entrée non qualifiée — cf. décision « pas de valeur par défaut inventée »)
 *
 * Règles de rendu (LAB.5) :
 *   - deux groupes non vides → deux titres de groupe ;
 *   - un seul groupe non vide → pas de titre (évite un en-tête orphelin) ;
 *   - la mise en avant reste première et indépendante du classement (LAB.3),
 *     dans chaque groupe ;
 *   - le groupe qui contient la mise en avant passe en premier, y compris si
 *     c'est le groupe diplômes : `DESIGN.md:183` exige que l'élément mis en
 *     avant soit la première entrée de la section (décision de revue du
 *     2026-10-25). Sans cela, une mise en avant « diplôme » arrivait après
 *     tout le groupe certifications.
 *
 * Chaque groupe est un rail indépendant (ou une grille statique si ≤ 3 cartes),
 * géré par `CoachCertificationsGroup`. Toutes les cartes restent dans le DOM.
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'
import { orderCredentialsForDisplay } from '~/features/coach/domain/featured-credential'
import CoachCertificationsGroup from '~/components/molecules/CoachCertificationsGroup.vue'

const props = defineProps<{
  credentials: CredentialItem[]
}>()

interface Group {
  key: string
  title: string | null
  credentialKind: 'certification' | 'diploma'
  items: CredentialItem[]
}

const groups = computed<Group[]>(() => {
  const all = props.credentials ?? []
  const certifications = all.filter(c => c.kind === 'certification')
  const diplomas = all.filter(c => c.kind !== 'certification')

  const bothNonEmpty = certifications.length > 0 && diplomas.length > 0

  const certificationGroup: Group = {
    key: 'certifications',
    title: bothNonEmpty ? 'Certifications & formations' : null,
    credentialKind: 'certification',
    items: orderCredentialsForDisplay(certifications)
  }
  const diplomaGroup: Group = {
    key: 'diplomas',
    title: bothNonEmpty ? 'Diplômes & autres formations' : null,
    credentialKind: 'diploma',
    items: orderCredentialsForDisplay(diplomas)
  }

  // La mise en avant est la première entrée de la section, donc son groupe
  // passe devant — sinon un diplôme mis en avant arrive après tout le groupe
  // certifications (AC5 / DESIGN.md:183).
  const featuredIsDiploma = diplomas.some(c => c.featured)
  const orderedGroups = featuredIsDiploma
    ? [diplomaGroup, certificationGroup]
    : [certificationGroup, diplomaGroup]

  return orderedGroups.filter(group => group.items.length > 0)
})
</script>

<template>
  <div class="mt-8 space-y-8">
    <section
      v-for="group in groups"
      :key="group.key"
      class="space-y-3"
    >
      <h3
        v-if="group.title"
        class="text-sm font-semibold uppercase tracking-wide text-[color:var(--color-crepuscule-500)]"
      >
        {{ group.title }}
      </h3>
      <CoachCertificationsGroup
        :credentials="group.items"
        :credential-kind="group.credentialKind"
      />
    </section>
  </div>
</template>
