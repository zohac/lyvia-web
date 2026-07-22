<script setup lang="ts">
import LegalPageContent from '../../components/templates/LegalPageContent.vue'
import { buildLegalBreadcrumbs } from '~/features/seo/breadcrumb-helpers'
import { useLegalPageSeo } from '~/features/seo/useLegalPageSeo'

definePageMeta({
  layout: 'legal'
})

const breadcrumbs = buildLegalBreadcrumbs('Politique de confidentialité')

useLegalPageSeo({
  pageTitle: 'Politique de confidentialité',
  description: 'Politique de confidentialité et protection des données personnelles de la plateforme Keova.',
  path: '/legal/confidentialite'
})
</script>

<template>
  <div>
    <AtomsBreadcrumbNav :items="breadcrumbs" />
    <LegalPageContent
      title="Politique de confidentialité"
      last-updated="17 janvier 2025"
      version="1.0"
    >
      <h2>1. Introduction</h2>
      <p>
        La protection de vos données personnelles est une priorité pour <strong>Keova</strong>.
        Cette politique de confidentialité vous informe sur la manière dont nous collectons,
        utilisons et protégeons vos données personnelles conformément au Règlement Général
        sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
      </p>

      <h2>2. Responsable du traitement</h2>
      <p>
        Le responsable du traitement des données personnelles est :
      </p>
      <ul>
        <li><strong>Keova SAS</strong></li>
        <li>Adresse : [À compléter]</li>
        <li>Email : dpo@keova.fr</li>
      </ul>

      <h2>3. Données collectées</h2>
      <p>
        Nous collectons les données suivantes :
      </p>
      <h3>3.1 Données d'identification</h3>
      <ul>
        <li>Nom et prénom</li>
        <li>Adresse email</li>
        <li>Numéro de téléphone</li>
      </ul>
      <h3>3.2 Données de connexion</h3>
      <ul>
        <li>Adresse IP</li>
        <li>Données de navigation (cookies)</li>
        <li>Historique de connexion</li>
      </ul>
      <h3>3.3 Données transactionnelles</h3>
      <ul>
        <li>Historique des rendez-vous</li>
        <li>Historique des paiements</li>
        <li>Données bancaires (traitées par notre prestataire de paiement sécurisé)</li>
      </ul>

      <h2>4. Finalités du traitement</h2>
      <p>
        Vos données sont traitées pour les finalités suivantes :
      </p>
      <ul>
        <li>Création et gestion de votre compte utilisateur</li>
        <li>Fourniture de nos services (prise de rendez-vous, paiements)</li>
        <li>Communication relative à votre compte et vos rendez-vous</li>
        <li>Amélioration de nos services</li>
        <li>Respect de nos obligations légales</li>
        <li>Envoi de communications commerciales (avec votre consentement)</li>
      </ul>

      <h2>5. Base légale du traitement</h2>
      <p>
        Le traitement de vos données repose sur :
      </p>
      <ul>
        <li><strong>L'exécution du contrat :</strong> pour la fourniture de nos services</li>
        <li><strong>Le consentement :</strong> pour les communications marketing</li>
        <li><strong>L'intérêt légitime :</strong> pour l'amélioration de nos services</li>
        <li><strong>Les obligations légales :</strong> pour la conservation de certaines données</li>
      </ul>

      <h2>6. Durée de conservation</h2>
      <p>
        Vos données sont conservées pendant la durée nécessaire aux finalités pour lesquelles
        elles ont été collectées :
      </p>
      <ul>
        <li><strong>Données de compte :</strong> durée de la relation contractuelle + 3 ans</li>
        <li><strong>Données de transaction :</strong> 10 ans (obligations comptables)</li>
        <li><strong>Données de prospection :</strong> 3 ans à compter du dernier contact</li>
        <li><strong>Cookies :</strong> 13 mois maximum</li>
      </ul>

      <h2>7. Destinataires des données</h2>
      <p>
        Vos données peuvent être transmises à :
      </p>
      <ul>
        <li>Nos sous-traitants techniques (hébergement, paiement)</li>
        <li>
          <strong>Google Ireland Ltd (YouTube)</strong> : uniquement si vous lancez
          volontairement la lecture de notre vidéo de démonstration. Tant que vous ne
          cliquez pas, aucune donnée n'est transmise à YouTube.
        </li>
        <li>Les Coachs avec lesquels vous interagissez</li>
        <li>Les autorités compétentes en cas d'obligation légale</li>
      </ul>
      <p>
        Nous ne vendons jamais vos données personnelles à des tiers.
      </p>

      <h2>8. Transferts hors UE</h2>
      <p>
        Certaines données peuvent être transférées vers des pays situés hors de l'Union
        européenne. Dans ce cas, nous nous assurons que des garanties appropriées sont
        mises en place (clauses contractuelles types, certifications).
      </p>

      <h2>9. Vos droits</h2>
      <p>
        Conformément au RGPD, vous disposez des droits suivants :
      </p>
      <ul>
        <li><strong>Droit d'accès :</strong> obtenir une copie de vos données</li>
        <li><strong>Droit de rectification :</strong> corriger vos données inexactes</li>
        <li><strong>Droit à l'effacement :</strong> demander la suppression de vos données</li>
        <li><strong>Droit à la limitation :</strong> limiter le traitement de vos données</li>
        <li><strong>Droit à la portabilité :</strong> recevoir vos données dans un format structuré</li>
        <li><strong>Droit d'opposition :</strong> vous opposer au traitement de vos données</li>
        <li><strong>Droit de retirer votre consentement :</strong> à tout moment pour les traitements basés sur le consentement</li>
      </ul>
      <p>
        Pour exercer ces droits, contactez-nous à : <strong>dpo@keova.fr</strong>
      </p>

      <h2>10. Cookies</h2>
      <p>
        Notre site utilise des cookies pour améliorer votre expérience. Vous pouvez
        gérer vos préférences via la bannière de consentement affichée lors de votre
        première visite.
      </p>
      <p>
        Types de cookies utilisés :
      </p>
      <ul>
        <li><strong>Cookies essentiels :</strong> nécessaires au fonctionnement du site</li>
        <li><strong>Cookies analytiques :</strong> pour comprendre l'utilisation du site (avec consentement)</li>
        <li>
          <strong>Cookies tiers YouTube :</strong> notre vidéo de démonstration est
          affichée sous forme d'image fixe et n'est chargée qu'à votre clic. Aucun cookie
          YouTube n'est déposé avant cette action. Si vous lancez la lecture, Google
          Ireland Ltd dépose ses propres cookies, régis par sa politique de
          confidentialité. Nous utilisons le domaine
          <em>youtube-nocookie.com</em> pour limiter ce dépôt.
        </li>
      </ul>

      <h2>11. Sécurité</h2>
      <p>
        Nous mettons en œuvre des mesures techniques et organisationnelles appropriées
        pour protéger vos données contre tout accès non autorisé, modification, divulgation
        ou destruction.
      </p>

      <h2>12. Réclamation</h2>
      <p>
        Si vous estimez que le traitement de vos données ne respecte pas la réglementation,
        vous pouvez introduire une réclamation auprès de la CNIL (Commission Nationale
        de l'Informatique et des Libertés) :
      </p>
      <ul>
        <li><strong>Site web :</strong> www.cnil.fr</li>
        <li><strong>Adresse :</strong> 3 Place de Fontenoy, TSA 80715, 75334 Paris Cedex 07</li>
      </ul>

      <h2>13. Modification de la politique</h2>
      <p>
        Cette politique de confidentialité peut être mise à jour. Toute modification
        substantielle vous sera notifiée. La date de dernière mise à jour est indiquée
        en haut de ce document.
      </p>

      <h2>14. Contact</h2>
      <p>
        Pour toute question relative à cette politique ou à vos données personnelles :
      </p>
      <ul>
        <li><strong>Email :</strong> dpo@keova.fr</li>
        <li><strong>Courrier :</strong> Keova SAS - Protection des données - [Adresse]</li>
      </ul>
    </LegalPageContent>
  </div>
</template>
