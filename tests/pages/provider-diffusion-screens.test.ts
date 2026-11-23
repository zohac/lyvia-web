/**
 * Diffusion-8 — wiring of the practitioner "Articles Keova" and notification
 * settings screens.
 *
 * The pure rules (status labels, optimistic approval, rollback, page ownership)
 * are executed by `tests/contents/platform-approvals.test.ts` and
 * `tests/notifications/notification-preferences.test.ts`. These tests guard the
 * template wiring those rules depend on — the verbatim wording the ACs fix, the
 * preview carrying the cover, and the absence of a navigation away from the
 * screen — using the repo's source-inspection convention
 * (`tests/pages/provider-pages-view.test.ts`).
 */
import * as assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import test, { describe } from 'node:test'

const ROOT = process.cwd()

function read(relativePath: string): string {
  return readFileSync(join(ROOT, relativePath), 'utf8')
}

describe('keova/view — /provider/content/keova wiring', () => {
  const page = read('app/pages/provider/content/keova.vue')

  test('renders the exact empty state of the AC', () => {
    assert.ok(page.includes('title="Aucun article Keova pour le moment."'))
  })

  test('derives the status and action labels from the shared helpers', () => {
    assert.ok(page.includes('platformApprovalStatusLabel(item.approved)'))
    assert.ok(page.includes('platformApprovalActionLabel(item.approved)'))
    // The labels themselves are pinned by the domain tests; a hardcoded copy
    // here would drift from them.
    assert.ok(!page.includes('Visible par vos clientes'))
    assert.ok(!page.includes('Ne plus rendre visible'))
  })

  test('the card shows the excerpt and the publication date', () => {
    assert.ok(page.includes('platformExcerpt(item.body)'))
    assert.ok(page.includes('formatDate(item.publishedAt)'))
  })

  test('the preview is a slideover carrying title, body and cover', () => {
    assert.ok(page.includes('<USlideover'))
    assert.ok(page.includes('previewItem.coverImageUrl'))
    assert.ok(page.includes('previewItem.body'))
    assert.ok(page.includes('previewItem?.title'))
  })

  test('the preview never navigates away from the screen', () => {
    assert.ok(!page.includes('navigateTo('))
    assert.ok(!page.includes('$router'))
    assert.ok(!page.includes('<NuxtLink'))
  })

  test('approval and withdrawal share the same optimistic path', () => {
    assert.ok(page.includes(':loading="approvingIds.has(item.id)"'))
    assert.ok(page.includes('approveItem(item.id)'))
    assert.ok(page.includes('withdrawItem(item.id)'))
  })

  test('a failed "load more" is reported instead of staying silent', () => {
    assert.ok(page.includes('loadMoreErrorMessage'))
    assert.ok(page.includes('@click="loadMore"'))
  })
})

describe('notifications/view — /provider/settings/notifications wiring', () => {
  const page = read('app/pages/provider/settings/notifications.vue')

  test('renders the companion wording verbatim', () => {
    assert.ok(page.includes('Nouvel article Keova à valider'))
    assert.ok(
      page.includes('Vous recevez un e-mail quand Keova publie un article que vos clientes pourraient voir.')
    )
  })

  test('saves on change, with no save button', () => {
    assert.ok(page.includes('@update:model-value="toggle"'))
    assert.ok(!page.toLowerCase().includes('enregistrer'))
    assert.ok(!page.includes('<UButton'))
  })

  test('the switch is named for assistive technology', () => {
    assert.ok(page.includes('aria-label="Nouvel article Keova à valider"'))
  })
})

describe('navigation — entries added by diffusion-8', () => {
  const layout = read('app/layouts/provider-standard.vue')
  const quote = String.fromCharCode(39)
  const entry = (path: string): string => `to: ${quote}${path}${quote}`

  test('"Articles Keova" points at the list and lives in the Configuration group', () => {
    assert.ok(layout.includes(`label: ${quote}Articles Keova${quote}`))
    assert.ok(layout.includes(entry('/provider/content/keova')))
    const configurationStart = layout.indexOf(`key: ${quote}configuration${quote}`)
    const keovaIndex = layout.indexOf(entry('/provider/content/keova'))
    const seoIndex = layout.indexOf(entry('/provider/seo'))
    assert.ok(configurationStart > -1 && keovaIndex > configurationStart && keovaIndex < seoIndex)
  })

  test('"Notifications" reaches the settings page, next to Paramètres', () => {
    assert.ok(layout.includes(`label: ${quote}Notifications${quote}`))
    assert.ok(layout.includes(entry('/provider/settings/notifications')))
    const configurationStart = layout.indexOf(`key: ${quote}configuration${quote}`)
    assert.ok(layout.indexOf(entry('/provider/settings/notifications')) > configurationStart)
  })

  test('no path is registered twice', () => {
    for (const path of ['/provider/content/keova', '/provider/settings/notifications']) {
      assert.equal(layout.split(entry(path)).length - 1, 1, `${path} registered once`)
    }
  })
})
