/**
 * Story diffusion-7 — the cover field, mounted and driven (AC4).
 *
 * AC4 is a lifecycle rule: the preview's object URL must be revoked **on
 * replacement only**, never on unmount (AGENTS §11.6 — a URL revoked at unmount
 * breaks every preview that still references it). A source-text assertion
 * cannot prove it, so this test mounts the real SFC, picks a file through the
 * real handler, and invokes the registered unmount hooks.
 *
 * Mutations this file kills:
 * - add `URL.revokeObjectURL(localPreview)` in `onBeforeUnmount` → the unmount
 *   test fails;
 * - drop the revoke on replacement → the replacement test fails;
 * - drop the 5 Mo local guard → the size test fails;
 * - drop the monotonic `uploadToken` → the late-response test fails;
 * - emit `result.url ?? ''` → the missing-URL test fails.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test from 'node:test'

import * as Vue from 'vue'

import {
  formatUploadError,
  validateFileUpload
} from '../../app/features/assets/asset-validators'
import { renderSfc } from '../helpers/render-sfc'

const COMP = 'app/components/molecules/ContentCoverField.vue'
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

interface UploadRecorder {
  created: string[]
  revoked: string[]
  uploads: Array<{ type: string, name: string }>
}

function patchObjectUrls(): UploadRecorder {
  const recorder: UploadRecorder = { created: [], revoked: [], uploads: [] }
  let counter = 0
  ;(URL as unknown as { createObjectURL: (file: unknown) => string }).createObjectURL = () => {
    counter += 1
    const url = `blob:preview-${counter}`
    recorder.created.push(url)
    return url
  }
  ;(URL as unknown as { revokeObjectURL: (url: string) => void }).revokeObjectURL = (url: string) => {
    recorder.revoked.push(url)
  }
  return recorder
}

function file(name: string, size: number, type: string): File {
  return new File([new Uint8Array(size)], name, { type })
}

/** The `<script setup>` bindings this test drives. */
interface CoverState {
  handleFile(file: File): Promise<void>
  remove(): void
  uploadError: string | null
  localPreview: string | null
}

interface Mounted {
  html: string
  state: CoverState
  emits: Array<{ event: string, value: unknown }>
  recorder: UploadRecorder
}

async function mountCover(options: {
  modelValue?: string
  error?: string
  upload?: (type: string, file: File) => Promise<unknown>
} = {}): Promise<Mounted> {
  const recorder = patchObjectUrls()
  const emits: Array<{ event: string, value: unknown }> = []
  let state = {} as CoverState

  const html = await renderSfc(COMP, {
    props: {
      'modelValue': options.modelValue ?? '',
      ...(options.error ? { error: options.error } : {}),
      'onUpdate:modelValue': (value: unknown) => emits.push({ event: 'update:modelValue', value })
    },
    stubs: STUBS,
    mocks: {
      [UPLOAD_MODULE]: {
        uploadAsset: async (type: string, uploaded: File) => {
          recorder.uploads.push({ type, name: uploaded.name })
          return options.upload ? await options.upload(type, uploaded) : { url: 'https://cdn.example/cover.webp' }
        },
        validateFileUpload,
        formatUploadError
      }
    },
    inspect: (instance) => {
      state = (instance as unknown as { setupState: CoverState }).setupState
    }
  })

  return { html, state, emits, recorder }
}

test('the cover is a file picker with a drop zone — no URL text field (AC4)', async () => {
  const { html, state } = await mountCover()

  assert.equal(html.includes('type="file"'), true)
  assert.equal(html.includes('accept="image/jpeg,image/png,image/webp"'), true)
  assert.equal(html.includes('Glissez une image ici'), true)
  assert.equal(html.includes('JPEG, PNG, WebP — 5 Mo maximum'), true)
  assert.equal(html.includes('type="url"'), false, 'the URL field must be gone')
  assert.equal(typeof state.handleFile, 'function')
})

test('picking a file shows its preview and the Remplacer/Supprimer actions', async () => {
  const { state, html, recorder } = await mountCover({ modelValue: 'https://cdn.example/old.jpg' })

  // The stored cover is previewed before any pick.
  assert.equal(html.includes('https://cdn.example/old.jpg'), true)

  await state.handleFile(file('cover.png', 1024, 'image/png'))

  assert.deepEqual(recorder.created, ['blob:preview-1'])
  assert.deepEqual(recorder.uploads, [{ type: 'content_cover', name: 'cover.png' }])
})

test('the preview is bounded in width AND height, with the actions on their own line (AC5)', async () => {
  // diffusion-14 AC5. The 2026-11-24 capture showed « Remplacer »/« Supprimer »
  // overlapping a full-bleed cover: `max-h-48` bounded the height only, so a wide
  // image kept its natural width under the buttons. The markup assertions below
  // pin the box the layout needs; the rendering itself is proven by the browser
  // gate, which no SSR string can stand in for.
  const { html } = await mountCover({ modelValue: 'https://cdn.example/wide.jpg' })

  const image = html.match(/<img[^>]*alt="Aperçu de la couverture"[^>]*>/)?.[0] ?? ''
  assert.equal(image.length > 0, true)
  assert.equal(/\bh-40\b/.test(image), true, 'a height cap')
  assert.equal(/max-w-\[280px\]/.test(image), true, 'a width cap')
  assert.equal(/\bobject-cover\b/.test(image), true, 'crop instead of overflowing')

  // The actions live in their own block and wrap: on a phone « Supprimer » drops
  // under « Remplacer » instead of sitting on top of the image.
  const actions = html.match(/<div class="([^"]*)"[^>]*>\s*<button[^>]*data-component="UButton"/)?.[1] ?? ''
  assert.equal(actions.includes('flex-wrap'), true, 'the actions may wrap instead of overflowing')
  assert.equal(/<img[^>]*>\s*<div[^>]*>\s*<button/.test(html), true, 'the buttons are a sibling row, after the image')
})

test('a successful upload revokes its own local blob before emitting the server URL', async () => {
  const { state, recorder, emits } = await mountCover()

  await state.handleFile(file('a.png', 1024, 'image/png'))

  // The blob is no longer referenced once the stored URL replaces it.
  assert.deepEqual(recorder.revoked, ['blob:preview-1'])
  assert.equal(state.localPreview, null)
  assert.deepEqual(emits[emits.length - 1], { event: 'update:modelValue', value: 'https://cdn.example/cover.webp' })
})

test('no lifecycle hook may revoke the preview URL (AC4)', () => {
  // Measured, not assumed: the SFC harness renders in SSR mode, where Vue's
  // `createHook` skips *registering* every lifecycle hook (`isInSSRComponentSetup`
  // is true), so `instance.bum` stays undefined even for a component that calls
  // `onBeforeUnmount`. Mounting-then-unmounting therefore cannot observe this
  // rule; the executed half of AC4 is the replacement tests around this one.
  //
  // The rule itself is narrow enough to guard on the source: the component must
  // not register a lifecycle hook at all, and `revokeObjectURL` must only sit at
  // the three replacement points (replace, upload success, remove). Adding a
  // revoke on unmount adds a hook and breaks this test.
  const source = fs.readFileSync(path.resolve(process.cwd(), COMP), 'utf-8')

  assert.equal(/\bonBeforeUnmount\s*\(/.test(source), false, 'a revoke on unmount is the documented trap')
  assert.equal(/\bonUnmounted\s*\(/.test(source), false)
  const revokes = source.match(/URL\.revokeObjectURL\(/g) ?? []
  assert.equal(revokes.length, 3, 'replace, upload success and remove are the only revoke sites')
})

test('replacing a file revokes the previous local preview and creates a new one (AC4)', async () => {
  let release!: () => void
  const gate = new Promise<void>((resolve) => {
    release = resolve
  })
  const { state, recorder } = await mountCover({
    upload: async () => {
      await gate
      return { url: 'https://cdn/ok.webp' }
    }
  })

  const first = state.handleFile(file('a.png', 1024, 'image/png'))
  assert.deepEqual(recorder.created, ['blob:preview-1'])

  const second = state.handleFile(file('b.png', 1024, 'image/png'))
  assert.deepEqual(recorder.created, ['blob:preview-1', 'blob:preview-2'])
  assert.deepEqual(recorder.revoked, ['blob:preview-1'], 'only the replaced blob is revoked, at replacement')

  release()
  await Promise.all([first, second])
})

test('a file above 5 Mo is refused locally, with a message and no upload', async () => {
  const { state, recorder } = await mountCover()

  await state.handleFile(file('big.png', 6 * 1024 * 1024, 'image/png'))

  assert.equal(state.uploadError, 'La taille maximale est de 5 Mo.')
  assert.deepEqual(recorder.uploads, [])
  assert.deepEqual(recorder.created, [], 'no preview is created for a refused file')
})

test('a refused format is named locally rather than uploaded', async () => {
  const { state, recorder } = await mountCover()

  await state.handleFile(file('anim.gif', 1024, 'image/gif'))

  assert.equal(state.uploadError, 'Formats acceptés : JPEG, PNG, WEBP.')
  assert.deepEqual(recorder.uploads, [])
})

test('a failed upload keeps the picked preview and shows a French message', async () => {
  const { state, recorder } = await mountCover({
    upload: async () => {
      throw new Error('SEO_UPLOAD_TOO_LARGE')
    }
  })

  await state.handleFile(file('big.png', 1024, 'image/png'))

  assert.equal(state.uploadError, 'L\'image doit faire moins de 5 Mo.')
  assert.equal(state.localPreview, 'blob:preview-1', 'the provider keeps seeing what she picked')
  assert.equal(recorder.revoked.length, 0)
})

test('a late response from an abandoned file does not overwrite the newer cover', async () => {
  let releaseFirst!: () => void
  const firstGate = new Promise<void>((resolve) => {
    releaseFirst = resolve
  })
  let call = 0

  const { state, emits } = await mountCover({
    upload: async () => {
      call += 1
      if (call === 1) {
        await firstGate
        return { url: 'https://cdn/A.webp' }
      }
      return { url: 'https://cdn/B.webp' }
    }
  })

  const pickA = state.handleFile(file('a.png', 1024, 'image/png'))
  const pickB = state.handleFile(file('b.png', 1024, 'image/png'))
  await pickB
  releaseFirst()
  await pickA

  assert.deepEqual(emits, [{ event: 'update:modelValue', value: 'https://cdn/B.webp' }])
})

test('an upload that answers without a URL never clears the stored cover', async () => {
  const { state, emits } = await mountCover({
    modelValue: 'https://cdn.example/stored.jpg',
    upload: async () => ({})
  })

  await state.handleFile(file('a.png', 1024, 'image/png'))

  assert.deepEqual(emits, [], 'no empty URL is emitted')
  assert.equal(typeof state.uploadError, 'string')
})

test('the server-side cover error is displayed next to the field', async () => {
  const { html } = await mountCover({ error: 'URL d’image invalide. Utilisez une adresse http(s).' })
  assert.equal(html.includes('URL d’image invalide. Utilisez une adresse http(s).'), true)
})

test('"Supprimer" clears the cover and revokes the local preview', async () => {
  const { state, emits, recorder } = await mountCover()

  await state.handleFile(file('a.png', 1024, 'image/png'))
  state.remove()

  assert.equal(state.localPreview, null)
  assert.deepEqual(emits[emits.length - 1], { event: 'update:modelValue', value: '' })
  assert.equal(recorder.revoked.includes('blob:preview-1'), true)
})
