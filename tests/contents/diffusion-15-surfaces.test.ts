/**
 * Story diffusion-15 — the UX/UI pass on the five content surfaces.
 *
 * The behaviour of these screens is covered elsewhere (`client-content-pages-render`,
 * `content-client-checklist-render`, `create-provider-content-editor`, …). This
 * file pins what the pass added, and only what can fail:
 *
 * 1. **AC5 — one control geometry.** The presets must keep the 48 px provider
 *    target, the 40 px admin floor, a single 12 px radius, no field shadow and
 *    the 2 px / 2 px focus ring. Mutation: drop `h-12` and every provider field
 *    falls back to the 44 px theme height.
 * 2. **AC6 — measured contrast.** The badge inks are computed against the real
 *    palette read from `shared.css`, not asserted by eye. Mutation: re-point an
 *    ink at the `-500` step and « Clientes choisies » drops back to 2,53:1.
 * 3. **AC1 — no native control left on the admin filter row.** The status
 *    filters were raw `<button>`s; `UTabs` is the design-system control.
 * 4. **The 3,65:1 muted token is gone from these surfaces.** `text-muted` is the
 *    `--color-neutral-500` #8B… step measured at 3,65:1 on the page canvas.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import {
  CONTENT_FIELD_UI,
  CONTENT_FOCUS_RING,
  CONTENT_INPUT_UI,
  CONTENT_INPUT_UI_COMPACT,
  CONTENT_SELECT_UI
} from '../../app/features/contents/domain/content-field-ui'
import { getBadgeInkClass } from '../../app/features/contents/domain/contents-badges'

const REPO = process.cwd()

function read(relative: string): string {
  return fs.readFileSync(path.join(REPO, relative), 'utf-8')
}

/** One CSS custom property, read from the real stylesheet. */
function token(name: string): string {
  const css = read('app/assets/css/shared.css')
  const match = css.match(new RegExp(`--color-${name}:\\s*(#[0-9a-fA-F]{6})`))
  if (!match || !match[1]) throw new Error(`token --color-${name} is defined in shared.css`)
  return match[1]
}

function luminance(hex: string): number {
  const channels = [1, 3, 5].map(index => Number.parseInt(hex.slice(index, index + 2), 16) / 255)
  const linear = channels.map(value => (value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4))
  return 0.2126 * (linear[0] as number) + 0.7152 * (linear[1] as number) + 0.0722 * (linear[2] as number)
}

function contrast(foreground: string, background: string): number {
  const a = luminance(foreground)
  const b = luminance(background)
  const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
  return Math.round(ratio * 100) / 100
}

describe('AC5 — the content fields share one geometry', () => {
  test('provider and client fields are 48 px tall, admin fields 40 px', () => {
    assert.match(CONTENT_INPUT_UI.base, /\bh-12\b/)
    assert.match(CONTENT_INPUT_UI_COMPACT.base, /\bh-10\b/)
    assert.match(CONTENT_SELECT_UI.base, /\bh-12\b/)
  })

  test('a field is 12 px radius with no shadow, not the theme pill under a 0 4px 12px shadow', () => {
    for (const preset of [CONTENT_INPUT_UI, CONTENT_INPUT_UI_COMPACT, CONTENT_SELECT_UI]) {
      assert.match(preset.base, /rounded-\[12px\]/, 'one radius for every field')
      assert.equal(/rounded-full/.test(preset.base), false, 'the pill radius must be gone')
      assert.match(preset.base, /shadow-none/, 'the field shadow must be gone')
    }
  })

  test('the focus ring is 2 px, offset by 2 px, on the brand primary (AC5)', () => {
    assert.match(CONTENT_FOCUS_RING, /focus-visible:outline-2\b/)
    assert.match(CONTENT_FOCUS_RING, /focus-visible:outline-offset-2\b/)
    assert.match(CONTENT_FOCUS_RING, /color-brand-primary/)
  })

  test('the label is a 13 px semibold ink, not the inherited 16 px body', () => {
    const label = CONTENT_FIELD_UI.label
    assert.match(label, /text-\[13px\]/)
    assert.match(label, /font-semibold/)
  })
})

describe('AC6 — badge inks are measured against their own soft surface', () => {
  const inks: Array<[Parameters<typeof getBadgeInkClass>[0], string, string]> = [
    ['primary', 'crepuscule-700', 'crepuscule'],
    ['secondary', 'sunset-800', 'sunset'],
    ['success', 'success-700', 'success'],
    ['info', 'crepuscule-700', 'crepuscule'],
    ['warning', 'sunset-800', 'sunset'],
    ['neutral', 'neutral-700', 'neutral'],
    ['error', 'error-700', 'error']
  ]

  for (const [color, inkToken, family] of inks) {
    test(`« ${color} » reaches AA on the 50 and 100 steps of ${family}`, () => {
      const ink = token(inkToken)
      for (const step of ['50', '100']) {
        const background = token(`${family}-${step}`)
        const ratio = contrast(ink, background)
        assert.ok(ratio >= 4.5, `${color}: ${inkToken} on ${family}-${step} = ${ratio}:1`)
      }
      assert.match(getBadgeInkClass(color), new RegExp(`--color-${inkToken}`))
    })
  }

  test('the previous ink is what failed: the 500 steps do not reach AA', () => {
    // Guards the reason the override exists. If sunset-500 ever passes on its
    // own tint, this test fails and the override can be reconsidered.
    assert.ok(contrast(token('sunset-500'), token('sunset-50')) < 4.5)
    assert.ok(contrast(token('neutral-500'), token('neutral-50')) < 4.5)
  })
})

describe('AC1 — the admin status filter is a design-system control', () => {
  const page = read('app/pages/admin/content/index.vue')

  test('the filter row renders UTabs, not the native <button> pills', () => {
    assert.match(page, /<UTabs/)
    assert.equal(/filterPillClasses/.test(page), false, 'the native filter helper must not be used here')
  })

  test('the tabs are wired to the same state the factory owns', () => {
    assert.match(page, /:model-value="statusFilter"/)
    assert.match(page, /@update:model-value="statusFilter = \$event as AdminContentStatusFilter"/)
  })

  test('the status badge is not stretched across its column', () => {
    // A `flex flex-col` stretches its children: the 2026-11-24 capture showed a
    // green bar across the STATUT column instead of a badge.
    assert.match(page, /items-start/)
  })
})

describe('AC6 — no 3,65:1 muted text is left on the five surfaces', () => {
  const surfaces = [
    'app/pages/provider/content/index.vue',
    'app/pages/provider/content/new.vue',
    'app/pages/provider/content/[id].vue',
    'app/pages/provider/content/keova.vue',
    'app/pages/provider/settings/notifications.vue',
    'app/pages/client/content/index.vue',
    'app/pages/client/content/[slug].vue',
    'app/pages/admin/content/index.vue',
    'app/pages/admin/content/new.vue',
    'app/pages/admin/content/[id].vue',
    'app/components/molecules/ContentsFormFields.vue',
    'app/components/molecules/ContentCoverField.vue',
    'app/components/molecules/ContentDocumentField.vue',
    'app/components/molecules/ContentDiffusionSection.vue',
    'app/components/molecules/ContentClientChecklist.vue'
  ]

  for (const surface of surfaces) {
    test(`${path.basename(surface)} reads its secondary text at AA`, () => {
      const source = read(surface)
      assert.equal(
        /--color-text-muted\]/.test(source),
        false,
        'text-muted measures 3,65:1 on the page canvas: use text-secondary or neutral-600'
      )
    })
  }

  test('the two inks the pass uses are the ones measured at AA', () => {
    assert.ok(contrast(token('neutral-700'), token('neutral-50')) >= 4.5, 'text-secondary')
    assert.ok(contrast(token('neutral-600'), token('neutral-50')) >= 4.5, 'neutral-600')
  })
})
