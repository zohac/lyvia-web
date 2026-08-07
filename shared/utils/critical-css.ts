/**
 * Helpers purs du CSS critique (story 0-14 AC-2).
 *
 * Le travail lourd est fait par `beasties` dans le plugin Nitro
 * `server/plugins/critical-css.ts`. Ces deux fonctions portent les seules
 * decisions du mecanisme, isolees ici pour etre testables sans build ni SSR.
 *
 * Contexte de la mesure (2026-08-07, build de prod local, landing keova.app) :
 * le `<head>` contenait 6 blocs `<style>` inlines par Nuxt (~26 Ko) ET 3
 * feuilles externes bloquantes totalisant 48,8 KiB gz, dont `entry.css` a lui
 * seul 46,3 KiB. Le first paint attendait donc un aller-retour reseau complet.
 */

/**
 * Compte les feuilles de style qui **bloquent reellement** le rendu.
 *
 * Trois exclusions, chacune pour une raison distincte :
 *
 * - **`<noscript>`** : c'est precisement la forme que produit `beasties` en
 *   repli. Les compter reviendrait a considerer une page deja traitee comme
 *   restant a traiter — le compteur ne retomberait jamais a zero et le plugin
 *   repayerait le cout a chaque rendu.
 * - **`media="print"`** : le navigateur ne bloque pas le rendu ecran dessus.
 * - **`rel="preload"`** : c'est deja la forme asynchrone visee.
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

export function countRenderBlockingStylesheets(html: string): number {
  const withoutNoscript = html.replace(/<noscript>[\s\S]*?<\/noscript>/gi, '')
  const links = withoutNoscript.match(/<link\b[^>]*>/gi) ?? []

  return links.filter((link) => {
    // `rel` peut porter plusieurs valeurs — seul `stylesheet` bloque.
    const rel = readAttribute(link, 'rel')
    if (!rel || !rel.split(/\s+/).includes('stylesheet')) return false
    if (readAttribute(link, 'media') === 'print') return false
    return true
  }).length
}

/**
 * Decide si une reponse merite de passer par `beasties`.
 *
 * L'extraction coute ~57 ms de CPU serveur en regime etabli (mesure sur la
 * landing : 380 Ko de CSS a parser). Ce garde evite de la payer pour rien —
 * notamment sur `sitemap.xml`, `robots.txt` et les reponses JSON, qui
 * traversent le meme hook Nitro que le HTML.
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
