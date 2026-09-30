import { randomUUID } from 'node:crypto'

/**
 * Restitution des valeurs saisies après un échec du fallback sans JavaScript.
 *
 * Sans JS, un 303 fait perdre la saisie. La remettre via l'URL exposerait des
 * données personnelles dans l'historique, les logs et le cache partagé ;
 * la remettre via un cookie heurterait la décision 24 (« aucune persistance
 * navigateur ») et le `s-maxage=60` de la page `/`. Les valeurs restent donc
 * côté serveur, derrière un jeton opaque à usage unique et à durée courte.
 *
 * Limite connue : ce store vit dans le processus Nitro. Derrière plusieurs
 * instances, une requête peut retomber sur une instance qui ne connaît pas le
 * jeton — la page s'affiche alors sans les valeurs, ce qui reste dégradé mais
 * correct.
 */

export const WAITLIST_REPLAY_TTL_MS = 120_000
export const WAITLIST_REPLAY_MAX_ENTRIES = 200

export interface WaitlistReplayStore {
  /** Stocke les valeurs et retourne le jeton opaque qui les référence. */
  save(values: Record<string, string>): string
  /** Consomme le jeton : les valeurs ne sont lisibles qu'une seule fois. */
  consume(token: string): Record<string, string> | null
  /** Nombre d'entrées vivantes (diagnostic et tests). */
  size(): number
}

export interface WaitlistReplayOptions {
  now?: () => number
  ttlMs?: number
  maxEntries?: number
}

export function createWaitlistReplayStore(
  options: WaitlistReplayOptions = {}
): WaitlistReplayStore {
  const now = options.now ?? (() => Date.now())
  const ttlMs = options.ttlMs ?? WAITLIST_REPLAY_TTL_MS
  const maxEntries = options.maxEntries ?? WAITLIST_REPLAY_MAX_ENTRIES

  const entries = new Map<string, { values: Record<string, string>, expiresAt: number }>()

  function evictExpired(current: number): void {
    for (const [token, entry] of entries) {
      if (entry.expiresAt <= current) entries.delete(token)
    }
  }

  function evictOldest(): void {
    // `Map` conserve l'ordre d'insertion : la première clé est la plus ancienne.
    const oldest = entries.keys().next()
    if (!oldest.done) entries.delete(oldest.value)
  }

  return {
    save(values) {
      const current = now()
      evictExpired(current)

      const token = randomUUID()
      entries.set(token, { values, expiresAt: current + ttlMs })

      while (entries.size > maxEntries) evictOldest()

      return token
    },

    consume(token) {
      const entry = entries.get(token)
      if (!entry) return null

      entries.delete(token)
      if (entry.expiresAt <= now()) return null

      return entry.values
    },

    size() {
      evictExpired(now())
      return entries.size
    }
  }
}

/** Instance partagée par la route de soumission et le middleware de lecture. */
export const waitlistReplayStore = createWaitlistReplayStore()
