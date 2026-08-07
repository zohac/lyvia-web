import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

import { shouldInlineCriticalCss } from '#shared/utils/critical-css'

/**
 * Story 0-14 AC-2 — CSS critique inline, feuilles externes chargees en async.
 *
 * ## Pourquoi un plugin runtime et pas `@nuxtjs/critters`
 *
 * Le module est declare dans `nuxt.config.ts` mais ne traite **rien** ici, et
 * ce n'est pas un defaut de configuration : (1) il ne reecrit que les routes
 * prerendues, (2) son seul hook runtime est garde par `isNuxtMajorVersion(3)`
 * alors que ce projet est en Nuxt 4, et (3) la landing est `prerender: false`
 * parce qu'elle depend de l'hote (plateforme / marque blanche). Le module reste
 * declare — le retirer sort du perimetre de l'AC — mais c'est ce plugin qui
 * fait le travail, et `beasties` est une dependance directe (CR 0-14).
 *
 * ## Ce que ca change, mesure
 *
 * Avant : 3 feuilles bloquantes (48,8 KiB gz, dont `entry.css` a 46,3) que le
 * navigateur devait telecharger avant de peindre. Apres : 0 bloquante, le CSS
 * critique est inline et le reste passe en `preload` + bascule `onload`.
 *
 * Le document grossit de +8,9 KiB gz, mais le chemin critique perd 48,8 KiB gz
 * **et un aller-retour reseau** — soit -39,7 KiB nets, sans compter la latence
 * de decouverte economisee.
 *
 * ## Cout et garde-fous
 *
 * L'extraction coute ~57 ms de CPU serveur en regime etabli (380 Ko de CSS a
 * parser). Protections :
 *
 * - Ce hook n'est emis que par le renderer catch-all de Nuxt : pages publiques
 *   SSR, pages d'erreur (`/__nuxt_error`) et shells SPA des espaces
 *   `ssr: false`. Ces shells (`/client/**`, `/provider/**`, `/admin/**`) sont
 *   exclus explicitement par prefixe — hors perimetre AC-2, les traiter
 *   basculerait le CSS de l'app authentifiee en async pour rien. (`sitemap.xml`
 *   et `robots.txt` ont leurs propres handlers et n'atteignent jamais ce hook.)
 * - `shouldInlineCriticalCss` ecarte le reste : reponses non-HTML du renderer
 *   (payloads JSON, islands) et pages deja traitees ne paient rien.
 * - `beasties` est importe **dynamiquement**, donc jamais charge sur ces
 *   reponses-la.
 * - Toute erreur laisse le HTML d'origine intact — l'etat d'avant cette story.
 *   Une exception non rattrapee casserait le site entier, jamais une seule
 *   page : `callHook('render:response')` n'est pas protege par Nitro, d'ou le
 *   `try` qui englobe TOUT le handler, gardes compris.
 *
 * ## Couplage CSP (AC-6)
 *
 * La bascule `onload` que beasties pose sur chaque feuille asynchronisee est un
 * event handler inline — gouverne par `script-src`, jamais couvert par un
 * nonce. Le CSS critique inline depend lui de `style-src 'unsafe-inline'`.
 * Avant tout durcissement de la CSP, lire le contrat documente dans
 * `shared/utils/csp-report-endpoint.ts`.
 */

/**
 * Espaces `ssr: false` (cf. routeRules de `nuxt.config.ts`) : le renderer leur
 * sert un shell SPA en `text/html` porteur de feuilles bloquantes. Sans cette
 * exclusion, chaque entree dans l'app authentifiee paierait l'extraction et son
 * CSS deviendrait asynchrone (course CSS/JS au montage).
 */
const SPA_SHELL_PREFIXES = ['/client', '/provider', '/admin'] as const

function isSpaShellPath(path: string): boolean {
  return SPA_SHELL_PREFIXES.some(prefix => path === prefix || path.startsWith(`${prefix}/`))
}

/** Instance reutilisee entre les rendus : c'est elle qui fait tomber le cout de 133 ms a ~57 ms. */
let beastiesInstance: { process: (html: string) => Promise<string> } | null = null

/**
 * File de serialisation des appels `process()`.
 *
 * beasties 0.3.5 porte un etat au niveau du MODULE (`classCache` / `idCache`,
 * `dist/index.mjs:179`), reassigne par chaque `process()` puis relu apres des
 * `await` de lecture de fichiers : deux appels concurrents s'entrelacent et une
 * page recoit le CSS critique de l'autre (prouve par execution, CR 0-14).
 * Multiplier les instances ne protege pas — l'etat fautif est module-level.
 * On serialise donc les appels ; le surcout est nul, le travail etant du CPU
 * mono-thread de toute facon.
 */
let processQueue: Promise<unknown> = Promise.resolve()

/**
 * Resolution unique du dossier public du build, via `fileURLToPath` — jamais
 * `.pathname`, qui conserve les percent-encodings (`%20`, accents) et
 * produirait un ENOENT silencieux sur un chemin non-ASCII.
 *
 * En dev, la base d'import est `.nuxt/dev/` : le dossier n'existe pas et le
 * plugin est inerte — signale UNE fois, parce que les warns de beasties sont
 * etouffes par `logLevel: 'error'` et qu'aucun autre signal n'existerait.
 */
let resolvedPublicDir: string | null | undefined

function resolvePublicDir(): string | null {
  if (resolvedPublicDir !== undefined) return resolvedPublicDir

  const dir = fileURLToPath(new URL('../public', import.meta.url))
  if (existsSync(dir)) {
    resolvedPublicDir = dir
  } else {
    resolvedPublicDir = null
    console.warn(`[critical-css] dossier public introuvable (${dir}) — plugin inactif sur ce serveur`)
  }
  return resolvedPublicDir
}

/** Une panne persistante loguerait a la cadence du trafic : au plus un log par minute. */
let lastErrorLogAt = 0
const ERROR_LOG_INTERVAL_MS = 60_000

async function getBeasties(publicDir: string) {
  if (!beastiesInstance) {
    const { default: Beasties } = await import('beasties')
    beastiesInstance = new Beasties({
      path: publicDir,
      publicPath: '/',
      // Ne pas retirer les regles inlinees des fichiers sources : ils restent
      // servis tels quels au `onload`, et sont partages entre les pages.
      pruneSource: false,
      // Transforme les feuilles restantes en `preload` + bascule `onload`,
      // avec repli `<noscript>`.
      preload: 'swap',
      // Decision CR 0-14 (PO, 2026-08-07) : l'elagage des blocs `<style>` deja
      // inlines par Nuxt (~26 Ko) est CONSERVE — c'est le defaut de beasties,
      // rendu explicite ici. Les regles ecartees (selecteurs absents du DOM
      // SSR : etats interactifs, modals, toasts) restent servies par les
      // feuilles externes au `onload` ; la fenetre de risque est bornee.
      // Repasser a `false` si un etat interactif apparait non style avant le
      // chargement des feuilles completes.
      reduceInlineStyles: true,
      logLevel: 'error'
    }) as unknown as { process: (html: string) => Promise<string> }
  }
  return beastiesInstance
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response, ctx) => {
    try {
      const requestPath = (ctx?.event?.path ?? '').split('?')[0] ?? ''
      if (isSpaShellPath(requestPath)) return

      // Pas de cast aveugle : un `content-type` non-string pose par un futur
      // plugin doit etre ecarte, pas exploser dans un hook non protege.
      const rawContentType = response.headers?.['content-type']
      const contentType = typeof rawContentType === 'string' ? rawContentType : null
      const body = typeof response.body === 'string' ? response.body : null

      if (!body || !shouldInlineCriticalCss(contentType, body)) return

      const publicDir = resolvePublicDir()
      if (!publicDir) return

      const beasties = await getBeasties(publicDir)
      // Serialisation des process() concurrents — voir `processQueue`.
      const processed = processQueue.then(() => beasties.process(body))
      processQueue = processed.then(() => undefined, () => undefined)
      response.body = await processed
    } catch (error) {
      // Degradation silencieuse : la page part avec son CSS bloquant d'origine,
      // ce qui est exactement l'etat d'avant cette story.
      const now = Date.now()
      if (now - lastErrorLogAt >= ERROR_LOG_INTERVAL_MS) {
        lastErrorLogAt = now
        console.error('[critical-css] extraction ignoree, HTML servi tel quel :', error)
      }
    }
  })
})
