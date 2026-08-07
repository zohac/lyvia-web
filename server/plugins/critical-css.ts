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
 * fait le travail.
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
 * parser). Trois protections :
 *
 * - `shouldInlineCriticalCss` ecarte tout ce qui n'est pas du HTML porteur
 *   d'une feuille bloquante — `sitemap.xml`, `robots.txt`, JSON, et les pages
 *   deja traitees ne paient rien.
 * - `beasties` est importe **dynamiquement**, donc jamais charge sur ces
 *   reponses-la.
 * - Toute erreur laisse le HTML d'origine intact. Ce hook sert **toutes** les
 *   pages publiques (landing B2B/B2C, pages coach, onboarding, legal, articles) ;
 *   les espaces client/provider/admin sont en `ssr: false` et ne passent pas
 *   ici. Une exception non rattrapee casserait le site entier, jamais une seule
 *   page.
 */

/** Instance reutilisee entre les rendus : c'est elle qui fait tomber le cout de 133 ms a ~57 ms. */
let beastiesInstance: { process: (html: string) => Promise<string> } | null = null

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
      logLevel: 'error'
    }) as unknown as { process: (html: string) => Promise<string> }
  }
  return beastiesInstance
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', async (response) => {
    const body = typeof response.body === 'string' ? response.body : null
    const contentType = response.headers?.['content-type'] as string | undefined

    if (!body || !shouldInlineCriticalCss(contentType, body)) return

    try {
      const publicDir = new URL('../public', import.meta.url).pathname
      const beasties = await getBeasties(publicDir)
      response.body = await beasties.process(body)
    } catch (error) {
      // Degradation silencieuse : la page part avec son CSS bloquant d'origine,
      // ce qui est exactement l'etat d'avant cette story. Loguer suffit.
      console.error('[critical-css] extraction ignoree, HTML servi tel quel :', error)
    }
  })
})
