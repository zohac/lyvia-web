/**
 * Story 18.2 (CR) — Garde anti-empilement des toasts, extrait en module pur.
 *
 * Il vivait inline dans `feature-gate-toast.ts`, qui dépend de l'auto-import
 * `useToast()` et n'est donc pas compilable par le runner Node : le garde
 * n'avait aucun test exécutant. Prouvé par mutation en revue de code —
 * supprimer la mémorisation de la dernière notification (ce qui désactive
 * entièrement le garde) laissait la suite entièrement verte.
 */

/**
 * Fenêtre anti-empilement : une page qui déclenche 5 appels gatés d'affilée
 * (dashboard, éditeur multi-sections) ne doit pas empiler 5 toasts identiques.
 */
export const FEATURE_GATE_TOAST_COOLDOWN_MS = 3_000

export interface NotificationThrottle {
  /**
   * `true` si la notification doit passer — et la fenêtre est alors consommée.
   * `now` est injecté (jamais `Date.now()` en interne) pour rester testable.
   */
  shouldNotify: (now: number) => boolean
  /** Réarme le garde (tests, changement de session). */
  reset: () => void
}

export function createNotificationThrottle(
  cooldownMs: number = FEATURE_GATE_TOAST_COOLDOWN_MS
): NotificationThrottle {
  let lastNotifiedAt: number | null = null

  return {
    shouldNotify(now: number): boolean {
      if (lastNotifiedAt !== null && now - lastNotifiedAt < cooldownMs) {
        return false
      }
      lastNotifiedAt = now
      return true
    },
    reset(): void {
      lastNotifiedAt = null
    }
  }
}
