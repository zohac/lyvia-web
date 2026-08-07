/**
 * Helpers purs du CSS critique (story 0-14 AC-2).
 *
 * Le travail lourd est fait par `beasties` dans le plugin Nitro
 * `server/plugins/critical-css.ts`. Ces fonctions portent les seules decisions
 * du mecanisme, isolees ici pour etre testables sans build ni SSR.
 *
 * Contexte de la mesure (2026-08-07, build de prod local, landing keova.app) :
 * le `<head>` contenait 6 blocs `<style>` inlines par Nuxt (~26 Ko) ET 3
 * feuilles externes bloquantes totalisant 48,8 KiB gz, dont `entry.css` a lui
 * seul 46,3 KiB. Le first paint attendait donc un aller-retour reseau complet.
 */

/**
 * Lit la valeur d'un attribut sur une balise ouvrante.
 *
 * ⚠️ Le `\s` initial n'est pas cosmetique. Une recherche naive de
 * `rel=["']?stylesheet` matche l'INTERIEUR de l'attribut que beasties produit :
 * `onload="this.rel='stylesheet'"`. Une page deja traitee etait alors comptee
 * comme bloquante, l'idempotence tombait, et le plugin repayait l'extraction a
 * chaque rendu. Exiger une espace avant le nom d'attribut ecarte `this.rel`,
 * dont le caractere precedent est un point.
 */
function readAttribute(tag: string, name: string): string | null {
  const match = tag.match(
    new RegExp(`\\s${name}\\s*=\\s*(?:"([^"]*)"|'([^']*)'|([^\\s>]+))`, 'i')
  )
  if (!match) return null
  return (match[1] ?? match[2] ?? match[3] ?? '').trim().toLowerCase()
}

/**
 * Un lien n'est compte que si beasties saura effectivement l'inliner : href
 * local, fichier `.css` nu. Verifie dans la source de beasties 0.3.5 :
 * `getCssAsset` ignore toute URL absolue (`https://…`, `//…`) et
 * `embedLinkedStylesheet` exige un href finissant par `.css` — donc pas de
 * query-string. Compter une feuille que beasties refusera ferait payer
 * l'extraction a chaque rendu pour un gain strictement nul, silencieusement
 * (le warn de beasties est etouffe par `logLevel: 'error'`).
 */
function isInlinableHref(href: string): boolean {
  if (/^(?:[a-z][a-z0-9+.-]*:)?\/\//i.test(href)) return false
  return href.endsWith('.css')
}

/**
 * Compte les feuilles de style qui bloquent le rendu ET que beasties peut
 * traiter. Exclusions, chacune pour une raison distincte :
 *
 * - **`<noscript>`** (avec ou sans attributs) : c'est la forme de repli que
 *   produit beasties. Les compter reviendrait a considerer une page deja
 *   traitee comme restant a traiter — le compteur ne retomberait jamais a zero
 *   et le plugin repayerait le cout a chaque rendu.
 * - **`rel` ≠ exactement `stylesheet`** : `preload` est deja la forme visee, et
 *   un `rel` multi-valeurs (`"preload stylesheet"`) est ignore par le selecteur
 *   exact `link[rel="stylesheet"]` de beasties.
 * - **`media="print"`** : le navigateur ne bloque pas le rendu ecran dessus.
 * - **href externe ou non-`.css`** : refuse par beasties (cf. `isInlinableHref`).
 */
export function countRenderBlockingStylesheets(html: string): number {
  const withoutNoscript = html.replace(/<noscript\b[^>]*>[\s\S]*?<\/noscript>/gi, '')
  const links = withoutNoscript.match(/<link\b[^>]*>/gi) ?? []

  return links.filter((link) => {
    const rel = readAttribute(link, 'rel')
    if (rel !== 'stylesheet') return false
    if (readAttribute(link, 'media') === 'print') return false
    const href = readAttribute(link, 'href')
    if (!href || !isInlinableHref(href)) return false
    return true
  }).length
}

/**
 * Decide si une reponse merite de passer par `beasties`.
 *
 * L'extraction coute ~57 ms de CPU serveur en regime etabli (mesure sur la
 * landing : 380 Ko de CSS a parser). Ce garde evite de la payer pour rien —
 * notamment sur les reponses non-HTML du renderer (payloads JSON, islands).
 * (`sitemap.xml` et `robots.txt` ont leurs propres handlers Nitro et
 * n'atteignent jamais le hook `render:response` : le filtre content-type est
 * purement defensif pour eux.)
 *
 * Le second critere n'est pas redondant avec le premier : une page HTML dont
 * toutes les feuilles sont deja asynchrones (ou qui n'en a aucune) n'a rien a
 * gagner. C'est aussi ce qui rend le traitement idempotent.
 */
export function shouldInlineCriticalCss(
  contentType: string | null | undefined,
  html: string
): boolean {
  if (!contentType || !contentType.toLowerCase().includes('text/html')) return false
  if (!html) return false
  return countRenderBlockingStylesheets(html) > 0
}
