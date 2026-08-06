import { registerFeatureGateToastContext } from '~/features/plans/feature-gate-toast'

/**
 * Story 18.2 — Fournit au toast 403 `FEATURE_NOT_AVAILABLE` une instance Nuxt
 * utilisable depuis n'importe quel contexte.
 *
 * 🚨 Pourquoi ce plugin existe (constat de vérification browser A35) :
 * `useNuxtApp()` lève « instance unavailable » dès qu'il est appelé hors d'un
 * `setup()` ou d'un plugin. Or les appels API gatés partent presque tous d'un
 * gestionnaire d'événement (clic « Enregistrer », upload) : la capture faite
 * par `apiFetch` avant son `try` y renvoie `null`, et le toast ne s'affichait
 * jamais. Vérifié empiriquement : PATCH → 403 en réseau, zéro toast rendu.
 *
 * Un plugin s'exécute, lui, dans un contexte valide : on y mémorise l'instance
 * une fois pour toutes. `.client` uniquement — il n'y a pas de toast en SSR.
 */
export default defineNuxtPlugin((nuxtApp) => {
  registerFeatureGateToastContext(nuxtApp)
})
