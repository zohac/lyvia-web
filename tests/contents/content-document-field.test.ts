/**
 * Story diffusion-7 — the document field (AC5).
 *
 * The five messages AC5 requires are the ones `interfaces.md` §6 spells out
 * verbatim; this test compares them character for character, through the real
 * handler the `<input type="file">` calls.
 *
 * Mutations this file kills: changing a capital, a space or a "Mo"/"Mo." in one
 * message; dropping the local size guard; dropping the local format guard;
 * mapping only `CONTENT_DOCUMENT_QUOTA_EXCEEDED` and letting the rest fall to
 * the generic upload text; emitting a document that was never uploaded.
 */
import * as assert from 'node:assert/strict'
import * as path from 'node:path'
import test from 'node:test'

import * as Vue from 'vue'

import {
  CONTENT_DOCUMENT_INVALID_MIME_MESSAGE,
  CONTENT_DOCUMENT_QUOTA_MESSAGE,
  CONTENT_DOCUMENT_TOO_LARGE_MESSAGE,
  formatUploadError,
  validateFileUpload
} from '../../app/features/assets/asset-validators'
import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/molecules/ContentDocumentField.vue'
const UPLOAD_MODULE = path.resolve(process.cwd(), 'app/features/assets/use-asset-upload.ts')

type SlotMap = Record<string, (() => Vue.VNode[]) | undefined>

const STUBS = {
  UButton: {
    name: 'UButton',
    props: ['onClick', 'loading', 'disabled'],
    setup: (props: Record<string, unknown>, { slots }: { slots: SlotMap }) => () =>
      Vue.h('button', {
        'onClick': props.onClick as (() => void) | undefined,
        'data-component': 'UButton'
      }, slots.default?.() ?? [])
  }
}

function pdfFile(name: string, size: number, type = 'application/pdf'): File {
  return new File([new Uint8Array(size)], name, { type })
}

function apiError(code: string): Error {
  return Object.assign(new Error(code), { apiError: { code } })
}

interface MountOptions {
  modelValue?: { assetId: string, filename: string, sizeBytes: number } | null
  upload?: () => Promise<unknown>
}

/** The `<script setup>` bindings this test drives. */
interface DocumentState {
  onFileSelected(event: Event): Promise<void>
  remove(): void
  error: string | null
}

async function mountDocument(options: MountOptions = {}) {
  const uploads: string[] = []
  const emits: Array<{ event: string, value: unknown }> = []
  let state = {} as DocumentState

  const html = await renderSfc(COMP, {
    props: {
      'modelValue': options.modelValue ?? null,
      'onUpdate:modelValue': (value: unknown) => emits.push({ event: 'update:modelValue', value }),
      'onUploading': (value: unknown) => emits.push({ event: 'uploading', value })
    },
    stubs: STUBS,
    mocks: {
      [UPLOAD_MODULE]: {
        CONTENT_DOCUMENT_QUOTA_MESSAGE,
        CONTENT_DOCUMENT_TOO_LARGE_MESSAGE,
        CONTENT_DOCUMENT_INVALID_MIME_MESSAGE,
        uploadAsset: async (type: string, uploaded: File) => {
          uploads.push(`${type}:${uploaded.name}`)
          return options.upload ? await options.upload() : { assetId: 'asset-1', filename: 'programme.pdf', sizeBytes: 2048 }
        },
        validateFileUpload,
        formatUploadError
      }
    },
    inspect: (instance) => {
      state = (instance as unknown as { setupState: DocumentState }).setupState
    }
  })

  return { html, state, uploads, emits }
}

function selectEvent(file: File): Event {
  const target = { files: [file], value: file.name }
  return { target } as unknown as Event
}

test('the field offers "Joindre un document (PDF)" and the pedagogical warning (AC5)', async () => {
  const { html } = await mountDocument()
  const text = html.replace(/&#39;/g, '\'')

  assert.equal(text.includes('Joindre un document (PDF)'), true)
  assert.equal(
    text.includes('Support pédagogique destiné à vos clientes. N\'y placez pas de données de santé ni d\'informations nominatives.'),
    true
  )
  assert.equal(html.includes('accept="application/pdf"'), true)
  assert.equal(html.includes('Remplacer'), false, 'no document attached yet')
})

test('an attached document shows its filename, its size, Remplacer and Retirer (AC5)', async () => {
  const { html } = await mountDocument({
    modelValue: { assetId: 'asset-1', filename: 'programme-perimenopause.pdf', sizeBytes: 2 * 1024 * 1024 }
  })

  assert.equal(html.includes('programme-perimenopause.pdf'), true)
  assert.equal(html.includes('2.0 Mo'), true)
  assert.equal(html.includes('Remplacer'), true)
  assert.equal(html.includes('Retirer'), true)
})

test('selecting a PDF uploads it and emits the asset the content can hold', async () => {
  const { state, uploads, emits } = await mountDocument()

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.deepEqual(uploads, ['content_document:programme.pdf'])
  assert.deepEqual(emits, [
    { event: 'uploading', value: true },
    {
      event: 'update:modelValue',
      value: { assetId: 'asset-1', filename: 'programme.pdf', sizeBytes: 2048 }
    },
    { event: 'uploading', value: false }
  ])
})

test('a response without url keeps the local filename and size (AC2)', async () => {
  // The upload endpoint may answer the asset id alone: the preview must not be
  // erased, and the name the provider picked must survive.
  const { state, emits } = await mountDocument({
    upload: async () => ({ assetId: 'asset-2' })
  })

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.deepEqual(
    emits.filter(entry => entry.event === 'update:modelValue'),
    [{
      event: 'update:modelValue',
      value: { assetId: 'asset-2', filename: 'programme.pdf', sizeBytes: 1024 }
    }]
  )
  assert.equal(state.error, null)
})

test('the field announces the upload so the page can refuse to save (AC2)', async () => {
  let finish!: (value: unknown) => void
  const pending = new Promise((resolve) => {
    finish = resolve
  })
  const { state, emits } = await mountDocument({ upload: async () => await pending })

  const uploading = state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))
  await Promise.resolve()

  assert.deepEqual(
    emits.filter(entry => entry.event === 'uploading'),
    [{ event: 'uploading', value: true }]
  )

  finish({ assetId: 'asset-3', filename: 'programme.pdf', sizeBytes: 1024 })
  await uploading

  assert.deepEqual(
    emits.filter(entry => entry.event === 'uploading'),
    [{ event: 'uploading', value: true }, { event: 'uploading', value: false }]
  )
})

test('a PDF above 10 Mo is refused locally with the exact spec sentence', async () => {
  const { state, uploads } = await mountDocument()

  await state.onFileSelected(selectEvent(pdfFile('enorme.pdf', 11 * 1024 * 1024)))

  assert.equal(state.error, 'Le document dépasse 10 Mo.')
  assert.equal(state.error, CONTENT_DOCUMENT_TOO_LARGE_MESSAGE)
  assert.deepEqual(uploads, [], 'nothing is uploaded for a refused file')
})

test('a non-PDF is refused locally with the exact spec sentence', async () => {
  const { state, uploads } = await mountDocument()

  await state.onFileSelected(selectEvent(pdfFile('notes.docx', 1024, 'application/msword')))

  assert.equal(state.error, 'Seuls les PDF sont acceptés.')
  assert.deepEqual(uploads, [])
})

test('the quota refusal from the API is named, verbatim (AC5)', async () => {
  const { state } = await mountDocument({
    upload: async () => {
      throw apiError('CONTENT_DOCUMENT_QUOTA_EXCEEDED')
    }
  })

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.equal(
    state.error,
    'Votre espace de documents est plein (500 Mo). Supprimez un document pour en ajouter un nouveau.'
  )
  assert.equal(state.error, CONTENT_DOCUMENT_QUOTA_MESSAGE)
})

test('a server-side size refusal is named, verbatim (AC5)', async () => {
  const { state } = await mountDocument({
    upload: async () => {
      throw apiError('SEO_UPLOAD_TOO_LARGE')
    }
  })

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.equal(state.error, 'Le document dépasse 10 Mo.')
})

test('a server-side format refusal is named, verbatim (AC5)', async () => {
  const { state } = await mountDocument({
    upload: async () => {
      throw apiError('SEO_UPLOAD_INVALID_MIME')
    }
  })

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.equal(state.error, 'Seuls les PDF sont acceptés.')
})

test('a plain Error carrying only the code is still mapped', async () => {
  const { state } = await mountDocument({
    upload: async () => {
      throw new Error('CONTENT_DOCUMENT_TOO_LARGE')
    }
  })

  await state.onFileSelected(selectEvent(pdfFile('programme.pdf', 1024)))

  assert.equal(state.error, 'Le document dépasse 10 Mo.')
})

test('"Retirer" clears the attached document', async () => {
  const { state, emits } = await mountDocument({
    modelValue: { assetId: 'asset-1', filename: 'programme.pdf', sizeBytes: 1024 }
  })

  state.remove()

  assert.deepEqual(emits, [{ event: 'update:modelValue', value: null }])
})
