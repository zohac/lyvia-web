import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import {
  CLIENT_DOCUMENT_DOWNLOAD_ERROR,
  CLIENT_DOCUMENT_FALLBACK_FILENAME,
  createClientDocumentDownload,
  downloadFilename
} from '../../app/features/contents/createClientDocumentDownload'

function deferred<T>() {
  let resolve!: (value: T) => void
  let reject!: (err: unknown) => void
  const promise = new Promise<T>((res, rej) => {
    resolve = res
    reject = rej
  })
  return { promise, resolve, reject }
}

interface SavedDocument {
  blob: Blob
  filename: string
}

function harness() {
  const fetched: string[] = []
  const saved: SavedDocument[] = []
  const failure = { current: null as unknown }
  const download = createClientDocumentDownload({
    fetchDocument: async (slug) => {
      fetched.push(slug)
      if (failure.current !== null) throw failure.current
      return new Blob(['%PDF-1.4'], { type: 'application/pdf' })
    },
    save: (blob, filename) => {
      saved.push({ blob, filename })
    }
  })
  return { ...download, fetched, saved, failure }
}

describe('createClientDocumentDownload — the authenticated download (AC2)', () => {
  test('a click fetches the authenticated route with the content slug and saves the blob', async () => {
    const dl = harness()

    await dl.download({ slug: 'respirer', filename: 'guide.pdf' })

    assert.deepEqual(dl.fetched, ['respirer'], 'the route is called with the content slug')
    assert.equal(dl.saved.length, 1)
    assert.equal(dl.saved[0]!.filename, 'guide.pdf')
    assert.equal(dl.saved[0]!.blob.type, 'application/pdf')
    assert.equal(dl.errorMessage.value, null)
    assert.equal(dl.downloading.value, false)
  })

  test('downloading is true while the request is in flight, false after it settles', async () => {
    const pending = deferred<Blob>()
    const dl = createClientDocumentDownload({
      fetchDocument: () => pending.promise,
      save: () => {}
    })

    const call = dl.download({ slug: 'respirer', filename: null })
    assert.equal(dl.downloading.value, true)

    pending.resolve(new Blob(['x']))
    await call

    assert.equal(dl.downloading.value, false)
  })

  test('a failure surfaces a retryable message and saves nothing', async () => {
    const dl = harness()
    dl.failure.current = new Error('network down')

    await dl.download({ slug: 'respirer', filename: 'guide.pdf' })

    assert.equal(dl.errorMessage.value, CLIENT_DOCUMENT_DOWNLOAD_ERROR)
    assert.equal(dl.saved.length, 0, 'a failed fetch must not produce a file')
    assert.equal(dl.downloading.value, false)
  })

  test('a second click while the first request runs is ignored', async () => {
    const pending = deferred<Blob>()
    const fetched: string[] = []
    const saved: SavedDocument[] = []
    const dl = createClientDocumentDownload({
      fetchDocument: (slug) => {
        fetched.push(slug)
        return pending.promise
      },
      save: (blob, filename) => saved.push({ blob, filename })
    })

    const first = dl.download({ slug: 'respirer', filename: 'guide.pdf' })
    const second = dl.download({ slug: 'respirer', filename: 'guide.pdf' })

    pending.resolve(new Blob(['x']))
    await Promise.all([first, second])

    assert.equal(fetched.length, 1, 'one request per document, not two')
    assert.equal(saved.length, 1)
  })

  test('an empty or blank slug sends no request', async () => {
    const dl = harness()

    await dl.download({ slug: '', filename: 'guide.pdf' })
    await dl.download({ slug: '   ', filename: 'guide.pdf' })

    assert.deepEqual(dl.fetched, [])
    assert.equal(dl.errorMessage.value, null)
  })

  test('a later success clears the previous failure', async () => {
    const dl = harness()
    dl.failure.current = new Error('network down')
    await dl.download({ slug: 'respirer', filename: 'guide.pdf' })
    assert.equal(dl.errorMessage.value, CLIENT_DOCUMENT_DOWNLOAD_ERROR)

    dl.failure.current = null
    await dl.download({ slug: 'respirer', filename: 'guide.pdf' })

    assert.equal(dl.errorMessage.value, null, 'a retry that works must not keep the old error')
    assert.equal(dl.saved.length, 1)
  })
})

describe('downloadFilename — a name the browser accepts', () => {
  test('keeps a normal filename', () => {
    assert.equal(downloadFilename('guide.pdf'), 'guide.pdf')
  })

  test('falls back when the name is missing or blank', () => {
    assert.equal(downloadFilename(null), CLIENT_DOCUMENT_FALLBACK_FILENAME)
    assert.equal(downloadFilename(undefined), CLIENT_DOCUMENT_FALLBACK_FILENAME)
    assert.equal(downloadFilename('   '), CLIENT_DOCUMENT_FALLBACK_FILENAME)
  })

  test('path separators cannot escape the download name', () => {
    assert.equal(downloadFilename('../../etc/passwd'), '.._.._etc_passwd')
    assert.equal(downloadFilename('dossier\\guide.pdf'), 'dossier_guide.pdf')
  })
})
