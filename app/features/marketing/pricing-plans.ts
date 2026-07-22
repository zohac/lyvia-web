/**
 * Story 0-35 — Données figées de la section pricing de la landing B2B (keova.app).
 *
 * Source de vérité du copy : spec compagnon `0-35-content-seo-spec.md` §2.2
 * (appliqué verbatim). ⚠️ `offer-v1.md` est périmé pour les montants.
 *
 * Cadrage : la beta est PAYANTE — ces prix sont réels, facturés dès l'accès.
 * L'accès passe par la waitlist (pas de checkout en ligne). Aucun prix n'est
 * exposé en Schema.org tant qu'il n'y a pas de souscription self-serve.
 *
 * On N'AFFICHE JAMAIS : le plan Fondatrice (interne, Sophie only) ni un plan
 * Découverte / à commission (grille périmée).
 *
 * Extrait en module pur (convention C5) pour tester les invariants (2 plans,
 * montants, Premium mis en avant) sans monter le composant.
 */

export interface PricingPlan {
  /** Identifiant technique du plan. */
  id: 'essentiel' | 'premium'
  /** Nom affiché du plan (rendu en `<h3>` pour le SEO). */
  name: string
  /** Sous-titre « pour qui » (positionnement service, pas une liste de features). */
  audience: string
  /** Prix principal, texte HTML réel (jamais image/SVG). */
  priceLabel: string
  /** Suffixe de prix optionnel (ancrage « puis 99 € / mois » pour le Premium). */
  priceSuffix?: string
  /** Ligne clé mise en avant sous le prix. */
  keyLine: string
  /** 2-3 puces factuelles (pas d'adjectif). */
  bullets: string[]
  /** Libellé du CTA (ouvre la waitlist, pas de checkout). */
  ctaLabel: string
  /** Carte mise en avant visuellement. */
  featured: boolean
  /** Badge optionnel (« Tarif fondateur »). */
  badge?: string
}

export const PRICING_HEADING = 'Nos tarifs, sans surprise'

/**
 * Chapô — révisé en code review du 2026-07-22.
 * La version d'origine promettait « le tarif fondateur » au-dessus des DEUX cartes
 * alors que seul le Premium porte un delta 49 → 99 €. Lecture la plus probable côté
 * prospect : « 29 € est aussi un tarif fondateur, donc il augmentera — mais vers quoi ? ».
 * Un futur prix non borné inquiète davantage qu'un futur prix élevé. Décision Simon :
 * 29 € est stable → on le dit, et le tarif fondateur est explicitement scopé Premium.
 */
export const PRICING_CHAPO
  = 'Un abonnement, 0 % de commission, sans engagement. Essentiel est à 29 € / mois, sans palier. Le tarif fondateur — Premium à 49 € au lieu de 99 € — est réservé aux inscrites d\'aujourd\'hui, sur toute leur première année.'

/** Bandeau de réassurance sous les 2 cartes (triple réassurance concurrentielle). */
export const PRICING_REASSURANCE = '0 % de commission · Sans engagement · Sans frais d\'installation'

/**
 * Micro-copy sous les cartes — révisée en code review du 2026-07-22.
 * La version d'origine (« Sans carte bancaire · Inscription en 30 secondes · Données
 * hébergées en France ») était validée pour le HERO, où aucun prix n'est affiché. Rendue
 * 6 lignes sous « 29 € TTC / mois », « sans carte bancaire » — marqueur conventionnel de
 * l'essai gratuit en SaaS FR, et argument littéral du concurrent direct au même prix —
 * se lit « je peux essayer sans payer ». La beta étant facturée dès l'accès, l'erreur se
 * paie à la première facture, pas au bounce. La reformulation dit la vérité sur le moment
 * de facturation et couvre au passage la perte du choix de formule au CTA.
 */
export const PRICING_MICROCOPY = 'Rien à payer ici : vous rejoignez la liste en 30 secondes, et vous choisissez votre formule avec nous avant l\'ouverture de votre compte.'

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'essentiel',
    name: 'Essentiel',
    audience: 'Pour lancer votre pratique.',
    priceLabel: '29 € TTC / mois',
    // Explique « 0 % de commission » UNE fois, en nommant l'alternative plutôt que le taux :
    // la lectrice n'a jamais payé de commission (aucun de ses outils actuels n'en prélève),
    // donc le chiffre nu répond à une objection qu'elle n'a pas. Volontairement sans taux
    // chiffré (aucun doc du repo ne substancie « 10 à 20 % ») et sans « vous gardez 100 % »
    // (les frais Stripe existent, la phrase serait attaquable).
    keyLine: 'Keova ne prélève aucun pourcentage sur vos séances — contrairement aux annuaires, qui se rémunèrent sur chaque rendez-vous.',
    bullets: [
      'Site, agenda et paiements réunis',
      'Réservation en ligne',
      'Aucun frais d\'installation'
    ],
    ctaLabel: 'Je réserve ma place',
    featured: false
  },
  {
    id: 'premium',
    name: 'Premium',
    audience: 'Pour développer votre clientèle.',
    priceLabel: '49 € TTC / mois la 1ʳᵉ année',
    // Spec §2.2 exigeait un cadrage « verrouillé pour les inscrites beta », PAS « ça va
    // augmenter ». Le « puis 99 € / mois » nu, rendu en légende grise, ne disait qu'une
    // chose : le prix va doubler. Mêmes faits, sentiment inverse.
    priceSuffix: 'Ensuite 99 € / mois. Votre première année reste à 49 €.',
    keyLine: 'Votre nom de domaine, votre marque — sans logo Keova. 0 % de commission.',
    bullets: [
      'Tout Essentiel, plus votre domaine propre',
      'Profil mis en avant sur keova.fr, l\'annuaire des spécialistes ménopause',
      'Mise en ligne accompagnée — on configure tout avec vous'
    ],
    ctaLabel: 'Je réserve ma place',
    featured: true,
    badge: 'Tarif fondateur'
  }
]
