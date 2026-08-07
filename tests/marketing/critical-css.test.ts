import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
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
})
