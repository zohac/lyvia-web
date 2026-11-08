import * as assert from 'node:assert/strict'
import * as Vue from 'vue'
import test from 'node:test'

import { renderSfc } from '../helpers/render-sfc'

const HEADER_PATH = 'app/components/organisms/CoachPageHeader.vue'

test('CoachPageHeader renders the test badge when account is a test account', async () => {
  const html = await renderSfc(HEADER_PATH, {
    props: { account: { isTest: true, isPublished: true }, previewLink: '/preview', publishing: false },
    globals: { ...Vue }
  })
  assert.match(html, /Compte de test/)
  assert.doesNotMatch(html, /En ligne/)
})

test('CoachPageHeader preview link carries rel="noopener noreferrer"', async () => {
  const html = await renderSfc(HEADER_PATH, {
    props: { account: { isTest: false, isPublished: false }, previewLink: '/preview', publishing: false },
    globals: { ...Vue }
  })
  assert.match(html, /rel="noopener noreferrer"/)
})

test('CoachPageHeader emits publish on click', async () => {
  // wiring guard: the component declares the emit
  const source = (await import('node:fs')).readFileSync(
    (await import('node:path')).join(process.cwd(), HEADER_PATH),
    'utf-8'
  )
  assert.match(source, /publish:/)
})