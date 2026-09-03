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
        <li><strong>Raison sociale :</strong> {{ isCustomDomain ? (tenant?.legalInfo?.companyName || tenant?.brand?.displayName || 'Le Praticien') : 'Keova SAS' }}</li>
        <li v-if="!isCustomDomain">
          <strong>Forme juridique :</strong> Société par Actions Simplifiée
        </li>
        <li v-if="isCustomDomain">
          <strong>Forme juridique :</strong> Profession libérale / Praticienne indépendante
        </li>
        <li v-if="!isCustomDomain">
          <strong>Capital social :</strong> 10 000 €
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.address">
          <strong>Siège social :</strong> {{ tenant?.legalInfo?.address }}
        </li>
        <li v-if="!isCustomDomain">
          <strong>Siège social :</strong> 156 rue de Charonne, 75011 Paris
        </li>
        <li v-if="!isCustomDomain">
          <strong>RCS :</strong> 987 654 321 00012
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.siret">
          <strong>SIRET :</strong> {{ tenant?.legalInfo?.siret }}
        </li>
        <li v-if="!isCustomDomain">
          <strong>SIRET :</strong> 987 654 321 00012
        </li>
        <li v-if="!isCustomDomain">
          <strong>Numéro de TVA intracommunautaire :</strong> FR24987654321
        </li>
        <li v-if="isCustomDomain && tenant?.legalInfo?.rcpInsurance">
          <strong>Assurance RCP :</strong> {{ tenant?.legalInfo?.rcpInsurance }}
        </li>
      </ul>

      <h2>2. Directeur de la publication</h2>
      <p>
        Le directeur de la publication est {{ isCustomDomain ? (tenant?.legalInfo?.director || tenant?.brand?.displayName || 'L\'éditrice du site') : 'Le Président de Keova SAS' }}, en qualité de {{ isCustomDomain ? 'Directrice de la publication' : 'Président de Keova SAS' }}.
      </p>

      <h2>3. Hébergement</h2>
      <p>
        Le site est hébergé par :
      </p>
      <ul>
        <li><strong>Nom :</strong> {{ isCustomDomain ? 'Keova SAS' : 'OVH SAS' }}</li>
        <li><strong>Adresse :</strong> {{ isCustomDomain ? '156 rue de Charonne, 75011 Paris' : '2 rue Kellermann, 59100 Roubaix, France' }}</li>
        <li v-if="!isCustomDomain">
          <strong>Téléphone :</strong> 09 72 00 00 00
        </li>
      </ul>

      <h2>4. Propriété intellectuelle</h2>
      <p>
        L'ensemble du contenu du site Keova (textes, images, graphismes, logo, icônes, etc.)
        est la propriété exclusive de Keova SAS ou de ses partenaires. Toute reproduction,
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
          <strong>Adresse :</strong> 156 rue de Charonne, 75011 Paris
        </li>
      </ul>
    </LegalPageContent>
  </div>
</template>
