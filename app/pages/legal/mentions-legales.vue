<script setup lang="ts">
import LegalPageContent from '../../components/templates/LegalPageContent.vue'
import { buildLegalBreadcrumbs } from '~/features/seo/breadcrumb-helpers'
import { useLegalPageSeo } from '~/features/seo/useLegalPageSeo'
import { usePublicTenantHome } from '~/composables/usePublicTenantHome'

definePageMeta({
  layout: 'legal'
})

const { data: tenant } = usePublicTenantHome()
const breadcrumbs = buildLegalBreadcrumbs('Mentions légales')
const isCustomDomain = computed(() => tenant.value?.brand?.mode === 'custom_domain')
const siteDisplayName = computed(() => isCustomDomain.value ? (tenant.value?.brand?.displayName || 'votre praticienne') : 'Keova')
const seoDescription = computed(() => isCustomDomain.value
  ? `Mentions légales du site de ${tenant.value?.brand?.displayName || 'votre praticienne'}.`
  : 'Mentions légales de la plateforme Keova.'
)

useLegalPageSeo({
  pageTitle: 'Mentions légales',
  description: seoDescription.value,
  path: '/legal/mentions-legales'
})
</script>

<template>
  <div>
    <AtomsBreadcrumbNav :items="breadcrumbs" />
    <LegalPageContent
      title="Mentions légales"
      last-updated="17 janvier 2025"
      version="1.0"
    >
      <h2>1. Éditeur du site</h2>
      <p>
        Le site <strong>{{ siteDisplayName }}</strong> est édité par :
      </p>
      <ul>
        <li><strong>Raison sociale / Exploitant :</strong> {{ isCustomDomain ? (tenant?.legalInfo?.companyName || tenant?.brand?.displayName || 'Le Praticien') : 'Simon JOUAN EI (nom commercial : Keova)' }}</li>
        <li v-if="!isCustomDomain">
          <strong>Forme juridique :</strong> Entrepreneur Individuel (EI)
        </li>
        <li v-if="isCustomDomain">
          <strong>Forme juridique :</strong> Profession libérale / Praticienne indépendante
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.address">
          <strong>Siège social :</strong> {{ tenant?.legalInfo?.address }}
        </li>
        <li v-if="!isCustomDomain">
          <strong>Adresse professionnelle :</strong> 3 rue Calas, 50700 Valognes
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.siret">
          <strong>SIRET :</strong> {{ tenant?.legalInfo?.siret }}
        </li>
        <li v-if="!isCustomDomain">
          <strong>SIREN :</strong> 847 779 287
        </li>
        <li v-if="!isCustomDomain">
          <strong>Régime TVA :</strong> TVA non applicable, art. 293 B du CGI (franchise en base)
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.rcpInsurance">
          <strong>Assurance RCP :</strong> {{ tenant?.legalInfo?.rcpInsurance }}
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est {{ isCustomDomain ? (tenant?.legalInfo?.director || tenant?.brand?.displayName || 'L\'éditrice du site') : 'Simon JOUAN' }}, en qualité de {{ isCustomDomain ? 'Directrice de la publication' : 'Exploitant individuel' }}.
      </p>

      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par :
      </p>
      <ul>
        <li><strong>Nom :</strong> {{ isCustomDomain ? 'Simon JOUAN EI (Keova)' : 'Scaleway SAS' }}</li>
        <li><strong>Adresse :</strong> {{ isCustomDomain ? '3 rue Calas, 50700 Valognes' : '8 rue de la Ville l\'Évêque, 75008 Paris, France' }}</li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu du site Keova (textes, images, graphismes, logo, icônes, etc.)
        est la propriété exclusive de Simon JOUAN EI ou de ses partenaires. Toute reproduction,
        représentation, modification, publication ou adaptation de tout ou partie des éléments
        du site est interdite sans autorisation écrite préalable.
      </p>

      <h2>5. Données personnelles</h2>
      <p>
        Conformément au Règlement Général sur la Protection des Données (RGPD) et à la loi
        Informatique et Libertés, vous disposez de droits sur vos données personnelles.
        Pour plus d'informations, consultez notre
        <NuxtLink to="/legal/confidentialite">
          Politique de confidentialité
        </NuxtLink>.
      </p>

      <h2>6. Contact</h2>
      <p>
        Pour toute question concernant ces mentions légales, vous pouvez nous contacter :
      </p>
      <ul>
        <li><strong>Email :</strong> {{ tenant?.legalInfo?.email || 'contact@keova.fr' }}</li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.address">
          <strong>Adresse :</strong> {{ tenant?.legalInfo?.address }}
        </li>
        <li v-if="!isCustomDomain">
          <strong>Adresse :</strong> 3 rue Calas, 50700 Valognes
        </li>
      </ul>
    </LegalPageContent>
  </div>
</template>
