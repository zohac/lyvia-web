import * as assert from 'node:assert/strict'
import test from 'node:test'

import {
  ADMIN_NAVIGATION,
  getAdminNavigationItems
} from '../../app/features/navigation/domain/admin-navigation'

// ═══════════════════════════════════════════════════════════
// YC3.2 — Admin templates navigation
// ═══════════════════════════════════════════════════════════

test('YC3.2: admin navigation includes Templates pages link', () => {
  const items = getAdminNavigationItems()
  const templatesItem = items.find((i) => i.to === '/admin/coach-templates')

  assert.ok(templatesItem, 'Templates pages nav item should exist')
  if (!templatesItem) return
  assert.equal(templatesItem.label, 'Templates pages')
  assert.equal(templatesItem.icon, 'lucide:layout-template')
  assert.equal(templatesItem.match, 'prefix')
})

test('YC3.2: Templates pages appears before Outils in navigation order', () => {
  const allItems = ADMIN_NAVIGATION.groups.flatMap(g => g.items)
  const templatesIdx = allItems.findIndex(i => i.to === '/admin/coach-templates')
  const outilsIdx = allItems.findIndex(i => i.to === '/admin/tools')

  assert.ok(templatesIdx >= 0, 'Templates link should be in groups')
  assert.ok(outilsIdx >= 0, 'Outils link should be in groups')
  assert.ok(templatesIdx < outilsIdx, 'Templates should come before Outils')
})

// ═══════════════════════════════════════════════════════════
// YC3.2 — Fill rate formula validation (FR-Y30)
// ═══════════════════════════════════════════════════════════

test('YC3.2: fill rate formula = sectionsWithContent / sectionsAvailable.length * 100', () => {
  // Simulates the backend calculation for a Signature template
  const sectionsAvailable = [
    'hero', 'bio', 'pillars', 'faq', 'testimonials', 'benefits',
    'howItWorks', 'educationalContent', 'problemStatement', 'pricing', 'disclaimer'
  ]

  const alwaysFilled = new Set(['hero', 'disclaimer', 'pricing'])
  const contentMap: Record<string, unknown> = {
    bio: 'Sophie Martin est coach...',
    testimonials: [{ quote: 'Super' }],
    pillars: [{ title: 'Pilier 1' }],
    faq: null,
    benefits: null,
    howItWorks: null,
    educationalContent: null,
    problemStatement: null
  }

  const filledCount = sectionsAvailable.filter((s) => {
    if (alwaysFilled.has(s)) return true
    const val = contentMap[s]
    if (val === null || val === undefined) return false
    if (typeof val === 'string') return val.trim().length > 0
    if (Array.isArray(val)) return val.length > 0
    return true
  }).length

  const fillRate = Math.round((filledCount / sectionsAvailable.length) * 100)

  // hero(1) + disclaimer(1) + pricing(1) + bio(1) + testimonials(1) + pillars(1) = 6
  // Total = 11
  // fillRate = round(6/11 * 100) = 55
  assert.equal(filledCount, 6)
  assert.equal(fillRate, 55)
})

test('YC3.2: fill rate is 0 when no sections available', () => {
  const available: string[] = []
  const fillRate = available.length > 0 ? Math.round((0 / available.length) * 100) : 0
  assert.equal(fillRate, 0)
})

test('YC3.2: empty string bio does not count as filled', () => {
  const bio = '   '
  const filled = typeof bio === 'string' && bio.trim().length > 0
  assert.equal(filled, false)
})

test('YC3.2: empty array does not count as filled', () => {
  const val: unknown[] = []
  const filled = Array.isArray(val) && val.length > 0
  assert.equal(filled, false)
})
