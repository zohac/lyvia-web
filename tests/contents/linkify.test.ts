import * as assert from 'node:assert/strict'
import test from 'node:test'

import { linkify } from '../../app/features/contents/domain/linkify'

/** The hrefs produced, in order — the only thing a caller can act on. */
function hrefs(input: string): string[] {
  return linkify(input)
    .filter(segment => segment.type === 'link')
    .map(segment => segment.href ?? '')
}

test('linkify: an https URL becomes a link segment', () => {
  const segments = linkify('voir https://exemple.fr/article ici')
  assert.equal(segments.length, 3)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, 'voir ')
  assert.equal(segments[1]!.type, 'link')
  assert.equal(segments[1]!.href, 'https://exemple.fr/article')
  assert.equal(segments[1]!.text, 'https://exemple.fr/article')
  assert.equal(segments[2]!.type, 'text')
  assert.equal(segments[2]!.text, ' ici')
})

test('linkify: http is also a link', () => {
  const segments = linkify('http://example.com/x')
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'link')
  assert.equal(segments[0]!.href, 'http://example.com/x')
})

test('linkify: javascript: stays text (AC4)', () => {
  const input = 'javascript:alert(1)'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, input)
  assert.equal(segments[0]!.href, undefined)
})

test('linkify: data:text/html stays text (AC4)', () => {
  const input = 'data:text/html,<script>alert(1)</script>'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, input)
})

test('linkify: a scheme-less URL stays text (AC4)', () => {
  const input = 'www.exemple.fr'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, input)
})

test('linkify: mixed-case javascript: stays text (masked scheme)', () => {
  const input = 'JaVaScRiPt:alert(1)'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.deepEqual(hrefs(input), [])
})

test('linkify: a scheme with a tab inside it stays text', () => {
  const input = 'java\tscript:alert(1)'
  assert.deepEqual(hrefs(input), [])
})

test('linkify: an unknown scheme stays text — the whitelist, not a blacklist, decides', () => {
  // `javascript://…` DOES match the candidate pattern (scheme + `//`), so this
  // assertion is only green because `ALLOWED_SCHEMES` rejects it by name.
  // Mutation: turn the whitelist into a blacklist of known-bad schemes and the
  // `ftp`/`file`/`vbscript` payloads below become links.
  for (const input of [
    'ftp://example.com/file',
    'file:///etc/passwd',
    'vbscript://msgbox(1)',
    'javascript://alert(1)',
    'foo://bar'
  ]) {
    assert.deepEqual(hrefs(input), [], `${input} must not become a link`)
    const segments = linkify(input)
    assert.equal(segments.length, 1)
    assert.equal(segments[0]!.type, 'text')
  }
})

test('linkify: vbscript: stays text', () => {
  const segments = linkify('vbscript:msgbox(1)')
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
})

test('linkify: a protocol-relative URL stays text (no scheme)', () => {
  assert.deepEqual(hrefs('//exemple.fr/article'), [])
})

test('linkify: an uppercase scheme is still a link, and keeps its case', () => {
  assert.deepEqual(hrefs('HTTPS://EXEMPLE.FR/Article'), ['HTTPS://EXEMPLE.FR/Article'])
})

test('linkify: a full stop ending the sentence is not part of the link', () => {
  const segments = linkify('Voir https://exemple.fr/article.')
  assert.deepEqual(hrefs('Voir https://exemple.fr/article.'), ['https://exemple.fr/article'])
  const last = segments[segments.length - 1]!
  assert.equal(last.type, 'text')
  assert.equal(last.text, '.')
})

test('linkify: a comma ending the sentence is not part of the link', () => {
  assert.deepEqual(hrefs('https://exemple.fr/a, puis autre chose'), ['https://exemple.fr/a'])
})

test('linkify: an unbalanced closing parenthesis is left out of the link', () => {
  assert.deepEqual(hrefs('(voir https://exemple.fr/a)'), ['https://exemple.fr/a'])
  assert.deepEqual(hrefs('(https://exemple.fr/a).'), ['https://exemple.fr/a'])
})

test('linkify: a balanced parenthesis inside the URL is kept', () => {
  const url = 'https://fr.wikipedia.org/wiki/Foo_(bar)'
  assert.deepEqual(hrefs(url), [url])
})

test('linkify: a query string keeps its separators', () => {
  const url = 'https://exemple.fr/a?x=1&y=2#top'
  assert.deepEqual(hrefs(`voir ${url} ici`), [url])
})

test('linkify: multiple urls split correctly', () => {
  const segments = linkify('a https://x.fr b https://y.fr')
  assert.equal(segments.filter(segment => segment.type === 'link').length, 2)
})

test('linkify: the same URL twice yields two links, not one', () => {
  assert.deepEqual(hrefs('https://x.fr https://x.fr'), ['https://x.fr', 'https://x.fr'])
})

test('linkify: a URL at the end of a line keeps the following line as text', () => {
  const segments = linkify('ligne 1 https://x.fr/a\nligne 2')
  assert.equal(segments[2]!.type, 'text')
  assert.equal(segments[2]!.text, '\nligne 2')
})

test('linkify: a bare scheme with nothing after // stays text', () => {
  assert.deepEqual(hrefs('https://'), [])
  assert.deepEqual(hrefs('https://.'), [])
})

test('linkify: a URL glued to a word stays text (unrecognised scheme)', () => {
  assert.deepEqual(hrefs('voirhttps://x.fr'), [])
})

test('linkify: null/undefined/empty', () => {
  assert.deepEqual(linkify(null), [])
  assert.deepEqual(linkify(undefined), [])
  assert.deepEqual(linkify(''), [])
})

test('linkify: HTML entities in the scheme stay text', () => {
  const input = '&#106;avascript:alert(1)'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.deepEqual(hrefs('&#104;ttps://example.com'), [])
})

test('linkify: two calls never share state', () => {
  // The candidate regex is rebuilt per call; a module-level `lastIndex` would
  // make the second call start where the first stopped.
  assert.deepEqual(hrefs('https://a.fr https://b.fr'), ['https://a.fr', 'https://b.fr'])
  assert.deepEqual(hrefs('https://a.fr https://b.fr'), ['https://a.fr', 'https://b.fr'])
})
