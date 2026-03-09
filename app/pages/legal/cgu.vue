<script setup lang="ts">
import LegalPageContent from '../../components/templates/LegalPageContent.vue'

definePageMeta({
  layout: 'legal'
})

useSeoMeta({
  title: 'Conditions Générales d\'Utilisation - Kaora',
  description: 'Conditions générales d\'utilisation de la plateforme Kaora.'
})

useHead({
  link: [{ rel: 'canonical', href: `${useRequestURL().origin}/legal/cgu` }]
})
</script>

<template>
  <LegalPageContent
    title="Conditions Générales d'Utilisation"
    last-updated="17 janvier 2025"
    version="1.0"
  >
    <h2>1. Objet</h2>
    <p>
      Les présentes Conditions Générales d'Utilisation (CGU) ont pour objet de définir
      les modalités d'accès et d'utilisation de la plateforme <strong>Kaora</strong>,
      accessible à l'adresse kaora.fr et ses sous-domaines.
    </p>
    <p>
      Kaora est une plateforme de mise en relation entre des professionnels du coaching
      (ci-après « les Coachs ») et des particuliers souhaitant bénéficier de leurs services
      (ci-après « les Clients »).
    </p>

    <h2>2. Acceptation des CGU</h2>
    <p>
      L'accès et l'utilisation de la plateforme impliquent l'acceptation sans réserve
      des présentes CGU. En créant un compte ou en utilisant nos services, vous reconnaissez
      avoir pris connaissance des présentes conditions et les accepter intégralement.
    </p>

    <h2>3. Inscription et compte utilisateur</h2>
    <h3>3.1 Création de compte</h3>
    <p>
      L'utilisation de certains services nécessite la création d'un compte utilisateur.
      Vous vous engagez à fournir des informations exactes et à les maintenir à jour.
    </p>
    <h3>3.2 Sécurité du compte</h3>
    <p>
      Vous êtes responsable de la confidentialité de vos identifiants de connexion et
      de toutes les activités effectuées depuis votre compte.
    </p>

    <h2>4. Services proposés</h2>
    <h3>4.1 Pour les Clients</h3>
    <ul>
      <li>Prise de rendez-vous avec un Coach</li>
      <li>Réservation et paiement de consultations</li>
      <li>Accès à des ressources de coaching</li>
      <li>Suivi de son parcours d'accompagnement</li>
    </ul>
    <h3>4.2 Pour les Coachs</h3>
    <ul>
      <li>Gestion de leur agenda et disponibilités</li>
      <li>Gestion de leur clientèle</li>
      <li>Encaissement des paiements</li>
      <li>Outils de suivi client</li>
    </ul>

    <h2>5. Paiements</h2>
    <p>
      Les paiements sont effectués de manière sécurisée via notre prestataire de paiement
      agréé. Les prix des prestations sont fixés par les Coachs et affichés TTC.
    </p>
    <p>
      En cas de paiement pour une consultation, le montant est débité au moment de la
      réservation. Les conditions d'annulation et de remboursement sont définies par
      chaque Coach.
    </p>

    <h2>6. Responsabilités</h2>
    <h3>6.1 Responsabilité de Kaora</h3>
    <p>
      Kaora agit en qualité d'intermédiaire technique et n'est pas partie aux contrats
      conclus entre les Coachs et les Clients. Kaora ne peut être tenue responsable
      du contenu des prestations fournies par les Coachs.
    </p>
    <h3>6.2 Responsabilité des utilisateurs</h3>
    <p>
      Chaque utilisateur est responsable de l'utilisation qu'il fait de la plateforme
      et s'engage à respecter les présentes CGU ainsi que la législation en vigueur.
    </p>

    <h2>7. Propriété intellectuelle</h2>
    <p>
      Tous les éléments de la plateforme (textes, images, logos, etc.) sont protégés
      par le droit de la propriété intellectuelle. Toute reproduction non autorisée
      est interdite.
    </p>

    <h2>8. Protection des données</h2>
    <p>
      Le traitement de vos données personnelles est régi par notre
      <NuxtLink to="/legal/confidentialite">
        Politique de confidentialité
      </NuxtLink>,
      qui fait partie intégrante des présentes CGU.
    </p>

    <h2>9. Modification des CGU</h2>
    <p>
      Kaora se réserve le droit de modifier les présentes CGU à tout moment.
      Les utilisateurs seront informés de toute modification substantielle.
      La poursuite de l'utilisation de la plateforme après modification
      vaut acceptation des nouvelles CGU.
    </p>

    <h2>10. Droit applicable et juridiction</h2>
    <p>
      Les présentes CGU sont régies par le droit français. En cas de litige,
      une solution amiable sera recherchée. À défaut, les tribunaux compétents
      seront ceux du ressort du siège social de Kaora.
    </p>

    <h2>11. Contact</h2>
    <p>
      Pour toute question relative aux présentes CGU, vous pouvez nous contacter :
    </p>
    <ul>
      <li><strong>Email :</strong> contact@kaora.fr</li>
    </ul>
  </LegalPageContent>
</template>
