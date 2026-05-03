/**
 * Story 0-26 round Codex CR R1-F1 — Helpers purs pour le rollback du toggle
 * de visibilité de section sur `/provider/coach-page`.
 *
 * Extrait pour permettre des tests comportementaux runtime (pas seulement
 * structurels A32) : la regression "rollback retourne à `{}` au lieu du
 * dernier état serveur" est désormais protégée par des tests unitaires sur
 * ces helpers.
 *
 * Usage côté page :
 *   - `snapshotSectionsConfig(account.value?.sectionsConfig)` capture la
 *     dernière valeur serveur (cloné, pas d'alias)
 *   - `applySectionsConfigSnapshot(reactiveSectionsConfig, snapshot)` restaure
 *     ce snapshot en cas d'échec de `updateAccount({ sectionsConfig })`
 */

/**
 * Clone superficiel d'un objet `sectionsConfig`. Retourne un objet vide si
 * la source est `null`/`undefined`. Le clone est nécessaire : sans copie,
 * une mutation ultérieure du store réactif modifierait également le snapshot.
 */
export function snapshotSectionsConfig(
  source: Record<string, boolean> | null | undefined
): Record<string, boolean> {
  return { ...(source ?? {}) }
}

/**
 * Restaure `target` à l'état exact de `snapshot` :
 *  1. supprime toutes les clés actuelles de `target` (clés ajoutées en
 *     optimistic update qui ne sont pas dans le snapshot)
 *  2. réinjecte les clés du snapshot
 *
 * Mute `target` en place pour préserver la réactivité Vue (le `reactive()`
 * suit les mutations directes mais pas les remplacements de référence).
 */
export function applySectionsConfigSnapshot(
  target: Record<string, boolean>,
  snapshot: Record<string, boolean>
): void {
  for (const key of Object.keys(target)) {
    // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
    delete target[key]
  }
  Object.assign(target, snapshot)
}
