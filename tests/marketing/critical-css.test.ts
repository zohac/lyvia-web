import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  countRenderBlockingStylesheets,
  shouldInlineCriticalCss
} from '../../shared/utils/critical-css'

/**
 * Story 0-14 AC-2 — CSS critique inline, feuilles externes en async.
 *
 * Les helpers purs sont testes comportementalement ; le plugin Nitro qui les
 * consomme est teste structurellement (pas de harnais SSR dans ce projet).
 */

describe('0-14 AC-2 — countRenderBlockingStylesheets', () => {
  test('compte une feuille bloquante classique', () => {
    assert.equal(
      countRenderBlockingStylesheets('<head><link rel="stylesheet" href="/a.css"></head>'),
      1
    )
  })

  test('compte les 3 feuilles du <head> de la landing', () => {
    const head = `<head>
      <style>a{}</style>
      <link rel="stylesheet" href="/_nuxt/entry.css">
      <link rel="stylesheet" href="/_nuxt/PublicHeader.css">
      <link rel="stylesheet" href="/_nuxt/index.css">
    </head>`
    assert.equal(countRenderBlockingStylesheets(head), 3)
  })

  // Sans cette exclusion, une page DEJA traitee par beasties serait vue comme
  // restant a traiter : le compteur ne retomberait jamais a zero et le plugin
  // repayerait les ~57 ms a chaque rendu.
  test('ignore les feuilles de repli dans <noscript> (sortie de beasties)', () => {
    const processed = `<head>
      <style>critique</style>
      <link rel="preload" href="/a.css" as="style" onload="this.rel='stylesheet'">
      <noscript><link rel="stylesheet" href="/a.css"></noscript>
    </head>`
    assert.equal(countRenderBlockingStylesheets(processed), 0)
  })

  test('ignore media="print" (ne bloque pas le rendu ecran)', () => {
    assert.equal(
      countRenderBlockingStylesheets('<link rel="stylesheet" media="print" href="/p.css">'),
      0
    )
  })

  test('ignore rel="preload" (deja la forme asynchrone visee)', () => {
    assert.equal(
      countRenderBlockingStylesheets('<link rel="preload" as="style" href="/a.css">'),
      0
    )
  })

  test('tolere les guillemets simples et les attributs en desordre', () => {
    assert.equal(
      countRenderBlockingStylesheets('<link href=\'/a.css\' rel=\'stylesheet\' crossorigin>'),
      1
    )
  })

  test('renvoie 0 sur un HTML sans aucune feuille', () => {
    assert.equal(countRenderBlockingStylesheets('<head><style>a{}</style></head>'), 0)
  })

  // --- Alignement garde ↔ beasties (CR 0-14) ---------------------------------
  // beasties REFUSE silencieusement ce qu'il ne peut pas inliner (`getCssAsset`
  // ignore les URL absolues, `embedLinkedStylesheet` exige `.css` final, son
  // selecteur `link[rel="stylesheet"]` est exact). Compter ces feuilles ferait
  // payer l'extraction a chaque rendu pour un gain nul, sans aucun log.

  test('ignore les feuilles externes que beasties ne peut pas inliner', () => {
    assert.equal(
      countRenderBlockingStylesheets(
        '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=X">'
      ),
      0
    )
    assert.equal(
      countRenderBlockingStylesheets('<link rel="stylesheet" href="//cdn.example.com/a.css">'),
      0
    )
  })

  test('ignore les href a query-string ou sans extension .css (refuses par beasties)', () => {
    assert.equal(countRenderBlockingStylesheets('<link rel="stylesheet" href="/entry.css?v=abc">'), 0)
    assert.equal(countRenderBlockingStylesheets('<link rel="stylesheet" href="/style">'), 0)
  })

  test('ignore rel multi-valeurs "preload stylesheet" (selecteur beasties exact)', () => {
    assert.equal(
      countRenderBlockingStylesheets('<link rel="preload stylesheet" href="/a.css">'),
      0
    )
  })

  test('n\'exige pas la forme nue de <noscript> pour le strip (attributs toleres)', () => {
    assert.equal(
      countRenderBlockingStylesheets(
        '<noscript data-x><link rel="stylesheet" href="/a.css"></noscript>'
      ),
      0
    )
  })

  test('exige un href pour compter une feuille', () => {
    assert.equal(countRenderBlockingStylesheets('<link rel="stylesheet">'), 0)
  })
})

describe('0-14 AC-2 — shouldInlineCriticalCss', () => {
  const HTML_WITH_BLOCKING = '<head><link rel="stylesheet" href="/a.css"></head>'

  test('accepte une page HTML portant au moins une feuille bloquante', () => {
    assert.equal(shouldInlineCriticalCss('text/html; charset=utf-8', HTML_WITH_BLOCKING), true)
  })

  // Le hook Nitro `render:response` voit passer sitemap.xml, robots.txt et les
  // reponses JSON. Les traiter couterait ~57 ms de CPU pour rien.
  test('refuse les reponses non-HTML', () => {
    assert.equal(shouldInlineCriticalCss('application/json', HTML_WITH_BLOCKING), false)
    assert.equal(shouldInlineCriticalCss('application/xml', HTML_WITH_BLOCKING), false)
    assert.equal(shouldInlineCriticalCss('text/plain', HTML_WITH_BLOCKING), false)
  })

  test('refuse un content-type absent', () => {
    assert.equal(shouldInlineCriticalCss(undefined, HTML_WITH_BLOCKING), false)
    assert.equal(shouldInlineCriticalCss(null, HTML_WITH_BLOCKING), false)
  })

  test('refuse une page HTML sans feuille bloquante (rien a gagner)', () => {
    assert.equal(shouldInlineCriticalCss('text/html', '<head><style>a{}</style></head>'), false)
  })

  // Idempotence : re-traiter une page deja traitee doublerait l'inline sans
  // aucun gain. C'est le garde qui l'empeche.
  test('refuse une page deja traitee par beasties', () => {
    const processed = `<head><style>c</style>
      <link rel="preload" href="/a.css" as="style" onload="this.rel='stylesheet'">
      <noscript><link rel="stylesheet" href="/a.css"></noscript></head>`
    assert.equal(shouldInlineCriticalCss('text/html', processed), false)
  })

  test('refuse un corps vide', () => {
    assert.equal(shouldInlineCriticalCss('text/html', ''), false)
  })
})

describe('0-14 AC-2 — plugin Nitro', () => {
  const PLUGIN = path.resolve(process.cwd(), 'server/plugins/critical-css.ts')

  function readPlugin(): string {
    return fs.readFileSync(PLUGIN, 'utf-8')
  }

  test('le plugin existe et s\'accroche au hook render:response', () => {
    const src = readPlugin()
    assert.match(src, /defineNitroPlugin/)
    assert.match(src, /hooks\.hook\(\s*'render:response'/)
  })

  test('le plugin passe par le garde partage, sans redupliquer la logique', () => {
    const src = readPlugin()
    assert.match(src, /shouldInlineCriticalCss/)
    // La detection des feuilles bloquantes ne doit exister qu'a UN endroit.
    assert.doesNotMatch(src, /rel\s*=\s*\\?["']?stylesheet/)
  })

  // Un echec de beasties (CSS introuvable, HTML inattendu) ne doit JAMAIS
  // casser la page : le pipeline de rendu SSR sert toutes les pages publiques.
  test('un echec de beasties laisse le HTML intact', () => {
    const src = readPlugin()
    assert.match(src, /try\s*\{/)
    assert.match(src, /catch/)
    // Le catch ne doit pas relancer l'erreur.
    const catchBlock = src.slice(src.indexOf('catch'))
    assert.doesNotMatch(catchBlock.slice(0, 400), /throw\b/)
  })

  test('beasties est charge dynamiquement, hors du chemin des reponses non-HTML', () => {
    const src = readPlugin()
    assert.match(src, /await import\(\s*'beasties'\s*\)/)
  })

  // --- Mutation killers (CR 0-14) --------------------------------------------
  // Muter `preload: 'swap'` ou `pruneSource: false` laissait toute la suite
  // verte : les options qui portent le comportement livre sont epinglees.

  test('les options beasties du plugin sont epinglees', () => {
    const src = readPlugin()
    assert.match(src, /pruneSource:\s*false/)
    assert.match(src, /preload:\s*'swap'/)
    // Decision CR 0-14 : elagage des <style> inline conserve, rendu explicite.
    assert.match(src, /reduceInlineStyles:\s*true/)
  })

  // Les espaces `ssr: false` recoivent un shell SPA en text/html par le meme
  // renderer catch-all : sans exclusion, ils paieraient l'extraction et leur
  // CSS basculerait en async (course CSS/JS au montage de l'app).
  test('les shells SPA (client/provider/admin) sont exclus du traitement', () => {
    const src = readPlugin()
    assert.match(src, /'\/client'/)
    assert.match(src, /'\/provider'/)
    assert.match(src, /'\/admin'/)
  })

  // beasties 0.3.5 porte un etat module-level (classCache/idCache) relu apres
  // des await : deux process() concurrents s'entrelacent et une page recoit le
  // CSS critique de l'autre (prouve par execution, CR 0-14).
  test('les appels process() sont serialises (etat module-level de beasties)', () => {
    const src = readPlugin()
    assert.match(src, /processQueue/)
  })

  // `.pathname` conserve les percent-encodings (%20, accents) : ENOENT
  // silencieux sur tout chemin non-ASCII. Seul fileURLToPath decode.
  test('le dossier public est resolu via fileURLToPath, pas .pathname', () => {
    const src = readPlugin()
    assert.match(src, /fileURLToPath\(/)
    assert.doesNotMatch(src, /new URL\([^)]*\)\.pathname/)
  })
})

describe('0-14 AC-2 — integration beasties reelle (CR 0-14)', () => {
  // L'idempotence n'etait validee que contre une fixture IMITANT la sortie de
  // beasties : un bump changeant la forme produite (autre strategie de swap,
  // <noscript> avec attributs) aurait casse l'idempotence en laissant la suite
  // verte. Ici on execute le VRAI beasties, avec la config exacte du plugin.
  test('la sortie reelle de beasties est vue comme deja traitee par le garde', async () => {
    const mod = await import('beasties') as unknown as {
      default: new (options: Record<string, unknown>) => {
        process: (html: string) => Promise<string>
      }
    }
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'beasties-cr-0-14-'))
    try {
      fs.writeFileSync(path.join(dir, 'a.css'), '.x{color:red}.absent{color:blue}')
      const beasties = new mod.default({
        path: dir,
        publicPath: '/',
        pruneSource: false,
        preload: 'swap',
        reduceInlineStyles: true,
        logLevel: 'error'
      })
      const html = '<html><head><link rel="stylesheet" href="/a.css"></head>'
        + '<body><div class="x">t</div></body></html>'

      const processed = await beasties.process(html)

      assert.equal(countRenderBlockingStylesheets(processed), 0, 'la feuille doit etre asynchronisee')
      assert.equal(
        shouldInlineCriticalCss('text/html', processed),
        false,
        'idempotence : la vraie sortie ne doit pas etre re-traitee'
      )
      assert.match(processed, /<style>/, 'le CSS critique doit etre inline')
      assert.match(processed, /\.x\{/, 'la regle utilisee par la page doit etre inline')
    } finally {
      fs.rmSync(dir, { recursive: true, force: true })
    }
  })
})
