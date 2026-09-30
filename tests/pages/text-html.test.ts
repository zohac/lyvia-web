/**
 * V2.2b — Plain-text → allowlisted HTML escaping (paste fallback / link label).
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { escapeHtml, textToHtml } from '../../app/features/pages/domain/text-html'

describe('pages/domain — text to html', () => {
  test('escapeHtml escapes markup, quotes and ampersands', () => {
    assert.equal(escapeHtml('<script>&"'), '&lt;script&gt;&amp;&quot;')
    assert.equal(escapeHtml('a & b'), 'a &amp; b')
  })

  test('textToHtml escapes plain text and converts newlines to <br>', () => {
    assert.equal(textToHtml('a & b\nc <d>'), 'a &amp; b<br>c &lt;d&gt;')
  })

  test('textToHtml collapses CRLF into a single break', () => {
    assert.equal(textToHtml('ligne 1\r\nligne 2'), 'ligne 1<br>ligne 2')
  })
})
