/**
 * V2.2a — Behavioural tests for `createProviderPages` (the pure factory behind
 * `useProviderPages`). Uses fake transports, no Nuxt context.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import { createProviderPages } from '../../app/features/pages/createProviderPages'
import type { ProviderPageListItem } from '../../app/features/pages/api/pages.contract'

function makePage(id: string): ProviderPageListItem {
  return {
    id,
    title: `Page ${id}`,
    slug: id,
    status: 'draft',
    hasUnpublishedChanges: false,
    includeInMenu: false,
    menuLabel: null,
    sortOrder: 0,
    version: 1,
    firstPublishedAt: null,
    publishedAt: null,
    createdAt: '2026-09-19T00:00:00.000Z',
    updatedAt: '2026-09-19T00:00:00.000Z'
  }
}

describe('createProviderPages — load', () => {
  test('a successful create triggers a list reload', async () => {
    const store: ProviderPageListItem[] = [makePage('a')]
    const calls: string[] = []

    const providerPages = createProviderPages({
      list: async () => {
        calls.push('list')
        return [...store]
      },
      create: async () => {
        calls.push('create')
        store.push(makePage('b'))
        return {}
      }
    })

    await providerPages.load()
    const outcome = await providerPages.createPage({ title: 'Page b', slug: 'b' })

    assert.equal(outcome.ok, true)
    if (outcome.ok) assert.equal(outcome.reloadFailed, false)
    assert.equal(calls.filter(call => call === 'list').length, 2)
    assert.equal(providerPages.pages.value.length, 2)
  })

  test('a reload failure is reported instead of a silent success', async () => {
    let listCalls = 0

    const providerPages = createProviderPages({
      list: async () => {
        listCalls += 1
        if (listCalls > 1) throw new Error('network down')
        return []
      },
      create: async () => ({})
    })

    await providerPages.load()
    const outcome = await providerPages.createPage({ title: 'Page a', slug: 'a' })

    assert.equal(outcome.ok, true)
    if (outcome.ok) assert.equal(outcome.reloadFailed, true)
    assert.equal(providerPages.errorMessage.value, 'Impossible de charger vos pages.')
  })

  test('a stale response never overwrites a fresher list', async () => {
    let resolveFirst!: (pages: ProviderPageListItem[]) => void
    const first = new Promise<ProviderPageListItem[]>((resolve) => {
      resolveFirst = resolve
    })
    let call = 0

    const providerPages = createProviderPages({
      list: () => {
        call += 1
        return call === 1 ? first : Promise.resolve([makePage('fresher')])
      },
      create: async () => ({})
    })

    const staleLoad = providerPages.load()
    const freshLoad = providerPages.load()
    await freshLoad

    resolveFirst([makePage('stale')])
    await staleLoad

    assert.equal(providerPages.pages.value[0]?.id, 'fresher')
  })
})

describe('createProviderPages — create', () => {
  test('the limit short-circuits before any network call', async () => {
    const store = Array.from({ length: 10 }, (_, index) => makePage(`p${index}`))
    let createCalls = 0

    const providerPages = createProviderPages({
      list: async () => [...store],
      create: async () => {
        createCalls += 1
        return {}
      }
    })

    await providerPages.load()
    assert.equal(providerPages.isLimitReached.value, true)

    const outcome = await providerPages.createPage({ title: 'Page x', slug: 'x' })

    assert.equal(createCalls, 0)
    assert.equal(outcome.ok, false)
    if (!outcome.ok) {
      assert.equal(outcome.code, 'PAGE_LIMIT_REACHED')
      assert.equal(outcome.field, null)
      assert.equal(outcome.message, 'Vous avez atteint la limite de 10 pages.')
    }
  })

  test('maps PAGE_SLUG_RESERVED to the slug field', async () => {
    const providerPages = createProviderPages({
      list: async () => [],
      create: async () => {
        throw { apiError: { code: 'PAGE_SLUG_RESERVED' } }
      }
    })

    await providerPages.load()
    const outcome = await providerPages.createPage({ title: 'Mes conseils', slug: 'mes-conseils' })

    assert.equal(outcome.ok, false)
    if (!outcome.ok) {
      assert.equal(outcome.field, 'slug')
      assert.equal(outcome.code, 'PAGE_SLUG_RESERVED')
      assert.equal(outcome.message, 'Cette adresse est réservée ou déjà utilisée.')
    }
  })

  test('maps PAGE_CONTENT_INVALID to the title field', async () => {
    const providerPages = createProviderPages({
      list: async () => [],
      create: async () => {
        throw { apiError: { code: 'PAGE_CONTENT_INVALID' } }
      }
    })

    await providerPages.load()
    const outcome = await providerPages.createPage({ title: 'a'.repeat(301), slug: 'a' })

    assert.equal(outcome.ok, false)
    if (!outcome.ok) {
      assert.equal(outcome.field, 'title')
      assert.equal(outcome.message, 'Le titre ne doit pas dépasser 300 caractères.')
    }
  })
})
