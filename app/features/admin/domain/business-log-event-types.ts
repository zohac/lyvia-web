// Familles de business logs proposées par le panneau admin.
//
// Source de vérité UNIQUE des préfixes envoyés à l'API : chaque famille liste
// les préfixes réels émis par le code (relevé par `grep -rn "event_type" src`
// dans `repositories/lyvia-api`). Une famille peut couvrir plusieurs préfixes,
// dont les pluriels (`PAYMENTS_*`, `APPOINTMENTS_*`) que le singulier ne couvre
// pas : `PAYMENT_` ne matche pas `PAYMENTS_*`, le « S » n'est pas dans le
// préfixe. C'est le bug que la story em-2 corrige.
//
// L'API n'impose AUCUNE liste fermée : elle accepte n'importe quel préfixe
// (`LIKE prefix%`, métacaractères `%`/`_`/`\` échappés). Une divergence entre
// ce module et l'API ne peut donc pas casser le filtre ; ce qui est prouvé
// côté API, c'est que les préfixes listés ici renvoient bien des événements
// réels (`typeorm-admin-business-log-query.db.spec.ts`, « les 6 familles »).
//
// Les familles sont des RACCOURCIS, pas une taxonomie exhaustive : une famille
// absente d'ici n'est pas filtrée par un chip, elle reste visible sans filtre.
// Voir la story em-2 pour la couverture mesurée des domaines non exposés
// (PROGRAM_, REMINDER_, WAITLIST_, …).
export type BusinessLogEventFamilyDefinition = {
  key: string
  label: string
  prefixes: readonly string[]
}

export const BUSINESS_LOG_EVENT_FAMILIES = [
  // Paiements : `PAYMENT_` (succès, échec de backfill) et `PAYMENTS_`
  // (consultation : confirmation, rappels J-1/H-2).
  { key: 'payment', label: 'Paiements', prefixes: ['PAYMENT_', 'PAYMENTS_'] },
  // RDV : les rendez-vous (`APPOINTMENT(S)_*`) et les événements de leur
  // cycle de vie, qui ne portent pas le mot dans leur préfixe : séances de
  // suivi offertes, demandes de RDV, consultations, lien de visio.
  {
    key: 'appointment',
    label: 'RDV',
    prefixes: [
      'APPOINTMENT_',
      'APPOINTMENTS_',
      'FREE_FOLLOWUP_',
      'REQUEST_',
      'CONSULTATION_',
      'MEETING_LINK_'
    ]
  },
  // Clients : cycle de vie du profil, activation du compte, consentements.
  {
    key: 'client',
    label: 'Clients',
    prefixes: ['CLIENT_', 'ACCOUNT_ACTIVATION_', 'CONSENT_TOKEN_']
  },
  { key: 'provider', label: 'Providers', prefixes: ['PROVIDER_'] },
  { key: 'stripe', label: 'Stripe', prefixes: ['STRIPE_'] },
  // Auth : les échecs d'envoi `AUTH_*` et les événements d'authentification
  // qui ne commencent pas par `AUTH_` (mot de passe, changement d'email).
  { key: 'auth', label: 'Auth', prefixes: ['AUTH_', 'PASSWORD_', 'EMAIL_'] }
] as const satisfies readonly BusinessLogEventFamilyDefinition[]

/** Clés valides d'une famille — un `Record` typé dessus ne peut pas en oublier une. */
export type BusinessLogEventFamilyKey
  = (typeof BUSINESS_LOG_EVENT_FAMILIES)[number]['key']

/**
 * Aplatit les familles sélectionnées en préfixes réellement envoyés à l'API.
 *
 * Fonction pure et unique : le panneau n'a plus sa propre copie de la
 * correspondance, donc une famille ajoutée ou renommée ne peut pas laisser
 * l'écran envoyer autre chose que ce que le module déclare.
 */
export function prefixesForFamilies(
  selected: readonly BusinessLogEventFamilyKey[]
): string[] {
  return BUSINESS_LOG_EVENT_FAMILIES
    .filter(family => selected.includes(family.key))
    .flatMap(family => [...family.prefixes])
}
