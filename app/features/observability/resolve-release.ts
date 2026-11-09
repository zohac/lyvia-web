/**
 * Résolveur pur de la `release` Sentry côté web.
 *
 * Miroir de `repositories/lyvia-api/src/core/observability/resolve-release.ts`
 * (obs-3, AC-1/AC-5) : même ordre, même garde de forme. La seule différence de
 * *résolution* est le troisième niveau de la chaîne : le web n'a **pas** de champ
 * `version` dans son `package.json` (mesuré : absent), le repli y est donc la
 * valeur explicite `unknown`, jamais une version inventée, jamais une chaîne
 * vide. Le fichier ajoute aussi `warnOnUnresolvedRelease` (l'API la garde dans
 * `sentry-init.ts`) pour que l'adaptateur web n'ait qu'un module à importer.
 *
 * Le résolveur `resolveRelease` est **pur** :
 *  - il ne lit jamais `process.env` lui-même (l'environnement est un paramètre) ;
 *  - il n'écrit rien sur la console ;
 *  - il ne fait aucune I/O.
 *
 * L'émetteur de log (`warnOnUnresolvedRelease`), exporté par commodité, est la
 * seule fonction de ce fichier qui touche la console ; il est appelé par
 * l'adaptateur (plugin Nitro, une fois par démarrage de process) à partir de
 * `reason` / `rejected`. C'est ce qui permet de satisfaire AC-1 qui exige à la
 * fois une fonction pure et un log explicite de repli.
 *
 * Ordre EXACT (spec obs-3, AC-1) et ne doit pas être modifié :
 *   1. `CONTAINER_VERSION` (runtime, Scalingo)
 *   2. `SOURCE_VERSION`    (build, Scalingo)
 *   3. repli               (`unknown`)
 */
export type ReleaseResolutionReason
  = | 'container-version'
    | 'source-version'
    | 'fallback'

export type ReleaseSourceVariable = 'CONTAINER_VERSION' | 'SOURCE_VERSION'

export interface RejectedReleaseValue {
  variable: ReleaseSourceVariable
  value: string
  shape: 'semver' | 'date'
}

export interface ResolvedRelease {
  release: string
  reason: ReleaseResolutionReason
  rejected: RejectedReleaseValue[]
}

// Un SHA git est hexadécimal : il ne contient ni `.` ni `-`.
// Une version sémantique (`1.2.3`, `v1.2.3-rc.1`) contient des points ;
// une date ISO (`2026-11-09`, avec ou sans heure) contient des tirets.
// Rejeter ces deux formes ne peut pas perdre une release légitime (AC-5).
const SEMVER_SHAPE = /^v?\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]+)?$/
const DATE_SHAPE = /^\d{4}-\d{2}-\d{2}(?:[T ].*)?$/

/** The explicit web fallback: never an invented version, never an empty string. */
export const UNKNOWN_RELEASE = 'unknown'

function rejectedShape(value: string): RejectedReleaseValue['shape'] | null {
  if (SEMVER_SHAPE.test(value)) return 'semver'
  if (DATE_SHAPE.test(value)) return 'date'
  return null
}

/**
 * `true` when `value` can be a deployment SHA: any shape except the two that a
 * git SHA can never take. Exported so the browser boundary
 * (`release-transport.ts`) applies the same guard to the serialized value it
 * receives — AC-5 must hold where the tag is actually set, not only where it is
 * resolved.
 */
export function isDeploymentShaShaped(value: string): boolean {
  return rejectedShape(value) === null
}

export function resolveRelease(
  env: Record<string, string | undefined> | undefined
): ResolvedRelease {
  const rejected: RejectedReleaseValue[] = []

  const container = readCandidate(env, 'CONTAINER_VERSION', rejected)
  if (container !== null) {
    return { release: container, reason: 'container-version', rejected }
  }

  const source = readCandidate(env, 'SOURCE_VERSION', rejected)
  if (source !== null) {
    return { release: source, reason: 'source-version', rejected }
  }

  return { release: UNKNOWN_RELEASE, reason: 'fallback', rejected }
}

function readCandidate(
  env: Record<string, string | undefined> | undefined,
  variable: ReleaseSourceVariable,
  rejected: RejectedReleaseValue[]
): string | null {
  const value = (env?.[variable] ?? '').trim()
  if (value.length === 0) return null

  const shape = rejectedShape(value)
  if (shape !== null) {
    rejected.push({ variable, value, shape })
    return null
  }

  return value
}

/**
 * Texte du `warn` de repli, émis par l'appelant (plugin serveur Nitro côté
 * web, ou tout autre adaptateur) — le résolveur reste pur. Renvoie `null`
 * quand aucune valeur n'a été écartée et que la release ne vient pas du
 * repli (rien à logger). Le texte est le contrat asserté par le test.
 */
export function formatReleaseFallbackWarning(resolved: ResolvedRelease): string | null {
  const lines: string[] = []
  for (const rejected of resolved.rejected) {
    lines.push(
      `[observability] Sentry release: ignoring ${rejected.variable}="${rejected.value}" (${rejected.shape}, not a deployment SHA)`
    )
  }
  if (resolved.reason === 'fallback') {
    lines.push(
      `[observability] Sentry release fallback: CONTAINER_VERSION and SOURCE_VERSION are both absent or unusable; using ${resolved.release}`
    )
  }
  if (lines.length === 0) return null
  return lines.join('\n')
}

/**
 * Émet les avertissements de repli que le résolveur pur ne peut pas émettre
 * lui-même (obs-3, AC-1). Miroir de `warnOnUnresolvedRelease` côté API.
 */
export function warnOnUnresolvedRelease(resolved: ResolvedRelease): void {
  const warning = formatReleaseFallbackWarning(resolved)
  if (warning !== null) {
    for (const line of warning.split('\n')) {
      console.warn(line)
    }
  }
}
