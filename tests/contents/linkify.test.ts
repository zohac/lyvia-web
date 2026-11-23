import * as assert from 'node:assert/strict'
import test from 'node:test'

import { linkify } from '../../app/features/contents/domain/linkify'

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

test('linkify: javascript: stays text', () => {
  const input = 'javascript:alert(1)'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, input)
  assert.equal(segments[0]!.href, undefined)
})

test('linkify: data:text/html stays text', () => {
  const input = 'data:text/html,<script>alert(1)</script>'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
  assert.equal(segments[0]!.text, input)
})

test('linkify: a scheme-less URL stays text', () => {
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
})

test('linkify: an unknown scheme stays text (whitelist, not blacklist)', () => {
  const input = 'ftp://example.com/file'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
})

test('linkify: vbscript stays text', () => {
  const input = 'vbscript:msgbox(1)'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
})

test('linkify: multiple urls split correctly', () => {
  const segments = linkify('a https://x.fr b https://y.fr')
  assert.equal(segments.filter(s => s.type === 'link').length, 2)
})

test('linkify: null/undefined/empty', () => {
  assert.deepEqual(linkify(null), [])
  assert.deepEqual(linkify(undefined), [])
  assert.deepEqual(linkify(''), [])
})

test('linkify: HTML entities in scheme stay text', () => {
  const input = '&#104;ttps://example.com'
  const segments = linkify(input)
  assert.equal(segments.length, 1)
  assert.equal(segments[0]!.type, 'text')
})
