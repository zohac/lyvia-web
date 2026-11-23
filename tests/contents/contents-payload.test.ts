/**
 * Story 5.5 — execution tests for the create/edit PATCH payload builders.
 *
 * The mapping form → request used to live inline in each page, where nothing
 * could execute it: a dropped field produced a 200, a success toast and no
 * persistence. The builders are now pure and every field is asserted here.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  buildCreateContentPayload,
  buildUpdateContentPayload,
  type ContentOriginal
} from '../../app/features/contents/domain/content-payload'

const original: ContentOriginal = {
  title: 'Titre existant',
  type: 'article',
  slug: 'titre-existant',
  body: 'Corps existant',
  coverImageUrl: 'https://example.com/cover.jpg',
  audience: 'all'
}

function form(overrides: Partial<Record<'title' | 'type' | 'body' | 'coverImageUrl' | 'audience' | 'slug', unknown>> = {}) {
  return {
    title: original.title,
    type: original.type,
    body: original.body,
    coverImageUrl: original.coverImageUrl,
    audience: original.audience,
    slug: original.slug,
    ...overrides
  } as Parameters<typeof buildUpdateContentPayload>[0]
}

describe('buildCreateContentPayload', () => {
  test('relays every DTO field the form owns', () => {
    const payload = buildCreateContentPayload({
      title: '  Mon article  ',
      type: 'recette',
      body: '  Un corps  ',
      coverImageUrl: ' https://example.com/a.jpg ',
      audience: 'selected',
      slug: 'mon-article'
    })

    assert.deepEqual(payload, {
      title: 'Mon article',
      type: 'recette',
      audience: 'selected',
      body: 'Un corps',
      slug: 'mon-article',
      coverImageUrl: 'https://example.com/a.jpg'
    })
  })

  test('omits an empty body, slug and cover instead of sending empty strings', () => {
    const payload = buildCreateContentPayload({
      title: 'Titre',
      type: 'article',
      body: '   ',
      coverImageUrl: '',
      audience: 'all',
      slug: '  '
    })

    assert.deepEqual(payload, { title: 'Titre', type: 'article', audience: 'all' })
    assert.equal('body' in payload, false)
    assert.equal('slug' in payload, false)
    assert.equal('coverImageUrl' in payload, false)
  })

  test('defaults the audience to selected when the form does not carry it', () => {
    const payload = buildCreateContentPayload({ title: 'Titre', type: 'article' })
    assert.equal(payload.audience, 'selected')
  })
})

describe('buildUpdateContentPayload', () => {
  test('sends nothing when the form still matches the persisted content', () => {
    assert.deepEqual(buildUpdateContentPayload(form(), original), {})
  })

  test('sends each field that changed', () => {
    assert.deepEqual(
      buildUpdateContentPayload(form({ title: 'Nouveau titre' }), original),
      { title: 'Nouveau titre' }
    )
    assert.deepEqual(
      buildUpdateContentPayload(form({ type: 'actualite' }), original),
      { type: 'actualite' }
    )
    assert.deepEqual(
      buildUpdateContentPayload(form({ body: 'Nouveau corps' }), original),
      { body: 'Nouveau corps' }
    )
    assert.deepEqual(
      buildUpdateContentPayload(form({ coverImageUrl: 'https://example.com/b.jpg' }), original),
      { coverImageUrl: 'https://example.com/b.jpg' }
    )
    assert.deepEqual(
      buildUpdateContentPayload(form({ audience: 'selected' }), original),
      { audience: 'selected' }
    )
    assert.deepEqual(
      buildUpdateContentPayload(form({ slug: 'nouvelle-adresse' }), original),
      { slug: 'nouvelle-adresse' }
    )
  })

  test('clears the body and the cover with null, not with an empty string', () => {
    const payload = buildUpdateContentPayload(
      form({ body: '   ', coverImageUrl: '' }),
      original
    )

    assert.deepEqual(payload, { body: null, coverImageUrl: null })
  })

  test('does not resend an already-empty body when it stays empty', () => {
    const emptyOriginal: ContentOriginal = { ...original, body: null, coverImageUrl: null }
    assert.deepEqual(buildUpdateContentPayload(form({ body: '', coverImageUrl: '' }), emptyOriginal), {})
  })

  test('omits an emptied slug: the server has no way to clear it', () => {
    // `UpdateContentDto.slug` is `@Matches(kebab-case)`; sending '' would be a
    // 400 the provider cannot act on. Empty means "keep the current address".
    const payload = buildUpdateContentPayload(form({ slug: '   ' }), original)
    assert.deepEqual(payload, {})
    assert.equal('slug' in payload, false)
  })

  test('ignores a whitespace-only change that trims to the same value', () => {
    assert.deepEqual(buildUpdateContentPayload(form({ title: 'Titre existant  ' }), original), {})
  })
})

describe('delegation: the pages use the builders rather than rebuilding a payload', () => {
  // The builders above prove the mapping; these two guards keep it the only
  // mapping. A page that reintroduces its own field-by-field payload would
  // pass every other test in this suite.
  const appRoot = path.resolve(process.cwd(), 'app')

  function readPage(relativePath: string): string {
    return fs.readFileSync(path.join(appRoot, relativePath), 'utf-8')
  }

  test('the create page sends buildCreateContentPayload(...)', () => {
    const source = readPage('pages/provider/content/new.vue')
    assert.match(source, /buildCreateContentPayload\(/)
    assert.match(source, /createContent\(buildCreateContentPayload\(/)
  })

  test('the edit page delegates to the editor factory, which owns the builder call', () => {
    // The page is wiring only (AC9): its load token, its save and its
    // mutation-versus-re-read split are executed in
    // `create-provider-content-editor.test.ts`. A page that rebuilt a payload
    // field by field would pass every other test in this suite — the factory is
    // the single call site, and it passes `form`/`original` whole, so a new
    // field cannot be forgotten.
    const page = readPage('pages/provider/content/[id].vue')
    assert.match(page, /createProviderContentEditor\(\{/)
    assert.equal(/buildUpdateContentPayload\(/.test(page), false, 'the page must not build the PATCH itself')

    const factory = fs.readFileSync(
      path.resolve(process.cwd(), 'app/features/contents/createProviderContentEditor.ts'),
      'utf-8'
    )
    assert.match(factory, /buildUpdateContentPayload\(form, original\.value\)/)
  })
})
