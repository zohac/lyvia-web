/**
 * Hotfix 25 — le hero du template `signature` ne publie plus la ville.
 *
 * Demande terrain (Sophie, 2026-11-03) : sa hero mettait en avant sa
 * localisation alors que sa page porte déjà « 100 % en visio · Toute la France ».
 * Deux rendus sortaient la ville (`provider_profiles.city`) :
 *
 * - le H1 de repli, quand `heroHeadline` est vide : `… ménopause à Valognes` ;
 * - la ligne de sous-titre : `{certification} · Valognes`.
 *
 * La ville reste une donnée du profil (badge bio, footer, éditeur « Qui
 * suis-je ») : elle est donc **ignorée** ici, pas supprimée. Les dérivations
 * sont sorties du composant pour être testables par leurs entrées/sorties — une
 * assertion de source ne prouverait aucun rendu (leçon hotfix-24).
 */
import type { CredentialItem } from '~/features/seo/api/public-provider-profile.contract'

import { findFeaturedCredential, selectHeroCredential } from './featured-credential'

/**
 * H1 de repli, sans ville. Le H1 ne doit jamais dépendre de la localisation :
 * il porte le positionnement, pas l'adresse.
 */
export const SIGNATURE_HERO_FALLBACK_HEADLINE = 'Spécialiste accompagnement ménopause'

/**
 * H1 : l'accroche configurée, sinon le repli générique. Une accroche faite
 * uniquement d'espaces compte comme vide (sinon le H1 rendrait du vide).
 */
export function buildSignatureHeroHeadline(
  heroHeadline: string | null | undefined
): string {
  if (heroHeadline && heroHeadline.trim().length > 0) return heroHeadline
  return SIGNATURE_HERO_FALLBACK_HEADLINE
}

/**
 * Ligne de sous-titre : le titre de la certification seulement. Quand une
 * certification est mise en avant, la plaque porte déjà l'intitulé et la ligne
 * reste absente (comportement inchangé du hero Signature).
 */
export function buildSignatureHeroSubtitleLine(
  credentials: readonly CredentialItem[] | null | undefined
): string | null {
  if (findFeaturedCredential(credentials)) return null
  return selectHeroCredential(credentials)?.title ?? null
}
