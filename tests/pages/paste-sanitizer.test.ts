/**
 * V2.2b — Paste sanitizer parity with the server allowlist.
 *
 * These tests encode the server rules (`page-content-sanitizer.ts`): allowed
 * tags, allowed protocols, `rel` guarantee and style/attribute stripping.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  ALLOWED_TAGS,
  isSafeLinkHref,
  resolvePasteSource,
  sanitizeHtmlContent
} from '../../app/features/pages/domain/paste-sanitizer'

describe('pages/domain — paste sanitizer / protocol validation', () => {
  test('accepts https, mailto and single-slash relative paths', () => {
    assert.equal(isSafeLinkHref('https://sophiejouan.fr/tarifs'), true)
    assert.equal(isSafeLinkHref('mailto:contact@sophiejouan.fr'), true)
    assert.equal(isSafeLinkHref('/#tarifs'), true)
    assert.equal(isSafeLinkHref('/mes-conseils'), true)
  })

  test('rejects bare anchors, http, javascript and protocol-relative URLs', () => {
    assert.equal(isSafeLinkHref('#tarifs'), false)
    assert.equal(isSafeLinkHref('http://sophiejouan.fr'), false)
    assert.equal(isSafeLinkHref('javascript:alert(1)'), false)
    assert.equal(isSafeLinkHref('//evil.example.com'), false)
    assert.equal(isSafeLinkHref(''), false)
  })

  test('the shared allowlist is exactly the server list', () => {
    assert.deepEqual(
      [...ALLOWED_TAGS].sort(),
      ['a', 'b', 'blockquote', 'br', 'em', 'h2', 'h3', 'h4', 'i', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul'].sort()
    )
  })
})

describe('pages/domain — paste sanitizer / HTML cleaning', () => {
  test('strips inline Word styles while keeping the structure', () => {
    const word = '<p class="MsoNormal" style="font-family:Calibri;color:red;mso-line-height-rule:exactly"><b style="mso-bidi-font-weight:normal">Bonjour</b> et <i>merci</i></p>'
    const output = sanitizeHtmlContent(word)
    assert.equal(output, '<p><b>Bonjour</b> et <i>merci</i></p>')
  })

  test('keeps allowed tags and drops scripts entirely', () => {
    const input = '<h2>Titre</h2><p>Texte</p><script>alert(1)</script>'
    assert.equal(sanitizeHtmlContent(input), '<h2>Titre</h2><p>Texte</p>')
  })

  test('strips disallowed tags but preserves their inner text', () => {
    const input = '<div><p>Texte <font color="red">rouge</font></p></div>'
    assert.equal(sanitizeHtmlContent(input), '<p>Texte rouge</p>')
  })

  test('removes event handlers and unknown attributes', () => {
    const input = '<p onclick="steal()" data-x="1">Cliquez</p>'
    assert.equal(sanitizeHtmlContent(input), '<p>Cliquez</p>')
  })

  test('guarantees rel="noopener noreferrer" on target="_blank"', () => {
    const input = '<p><a href="https://example.com" target="_blank" style="color:red">Site</a></p>'
    const output = sanitizeHtmlContent(input)
    assert.ok(output.includes('target="_blank"'))
    assert.ok(output.includes('rel="noopener noreferrer"'))
    assert.ok(!output.includes('style='))
  })

  test('strips anchors with an unsafe href but keeps the text', () => {
    const input = '<p>Voir <a href="javascript:alert(1)">ici</a> et <a href="#tarifs">là</a></p>'
    assert.equal(sanitizeHtmlContent(input), '<p>Voir ici et là</p>')
  })

  test('preserves lists and blockquote', () => {
    const input = '<ul><li>Un</li><li>Deux</li></ul><blockquote>Citation</blockquote>'
    assert.equal(sanitizeHtmlContent(input), input)
  })

  test('does not re-encode entities already present in an href', () => {
    const input = '<p><a href="https://example.com/?a=1&amp;b=2">Lien</a></p>'
    const output = sanitizeHtmlContent(input)
    assert.ok(output.includes('href="https://example.com/?a=1&amp;b=2"'), output)
    assert.ok(!output.includes('&amp;amp;'), output)
  })

  test('returns an empty string for falsy input', () => {
    assert.equal(sanitizeHtmlContent(''), '')
    assert.equal(sanitizeHtmlContent(null as unknown as string), '')
  })
})

describe('pages/domain — paste source resolution', () => {
  test('prefers the rich HTML flavour and sanitizes it', () => {
    const output = resolvePasteSource({
      html: '<div><p onclick="steal()">Bonjour</p></div>',
      text: 'ignored'
    })

    assert.equal(output, '<p>Bonjour</p>')
  })

  test('falls back to escaped plain text when no HTML is available', () => {
    const output = resolvePasteSource({ html: '   ', text: 'Bonjour\n<Sophie>' })

    assert.equal(output, 'Bonjour<br>&lt;Sophie&gt;')
  })

  test('strips unsafe markup from the HTML flavour', () => {
    const output = resolvePasteSource({
      html: '<p>Voir <a href="javascript:alert(1)">ici</a></p>',
      text: ''
    })

    assert.equal(output, '<p>Voir ici</p>')
  })
})
