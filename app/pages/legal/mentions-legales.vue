<script setup lang="ts">
import LegalPageContent from '../../components/templates/LegalPageContent.vue'

definePageMeta({
  layout: 'legal'
})

useSeoMeta({
  title: 'Mentions légales - Kaora',
  description: 'Mentions légales de la plateforme Kaora.'
})

useHead({
  link: [{ rel: 'canonical', href: `${useRequestURL().origin}/legal/mentions-legales` }]
})
</script>

<template>
  <LegalPageContent
    title="Mentions légales"
    last-updated="17 janvier 2025"
    version="1.0"
  >
    <h2>1. Éditeur du site</h2>
    <p>
      Le site <strong>Kaora</strong> est édité par :
    </p>
    <ul>
      <li><strong>Raison sociale :</strong> Kaora SAS</li>
      <li><strong>Forme juridique :</strong> Société par Actions Simplifiée</li>
      <li><strong>Capital social :</strong> [À compléter]</li>
      <li><strong>Siège social :</strong> [Adresse à compléter]</li>
      <li><strong>RCS :</strong> [Numéro à compléter]</li>
      <li><strong>SIRET :</strong> [Numéro à compléter]</li>
      <li><strong>Numéro de TVA intracommunautaire :</strong> [Numéro à compléter]</li>
    </ul>

    <h2>2. Directeur de la publication</h2>
    <p>
      Le directeur de la publication est [Nom à compléter], en qualité de [Fonction à compléter].
    </p>

    <h2>3. Hébergement</h2>
    <p>
      Le site est hébergé par :
    </p>
    <ul>
      <li><strong>Nom :</strong> [Hébergeur à compléter]</li>
      <li><strong>Adresse :</strong> [Adresse à compléter]</li>
      <li><strong>Téléphone :</strong> [Téléphone à compléter]</li>
    </ul>

    <h2>4. Propriété intellectuelle</h2>
    <p>
      L'ensemble du contenu du site Kaora (textes, images, graphismes, logo, icônes, etc.)
      est la propriété exclusive de Kaora SAS ou de ses partenaires. Toute reproduction,
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
      <li><strong>Email :</strong> contact@kaora.fr</li>
      <li><strong>Adresse :</strong> [Adresse à compléter]</li>
    </ul>
  </LegalPageContent>
</template>
