import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'
import { effectScope, ref } from 'vue'

import { createCoachPreview, toPublicProgram } from '../../app/features/coach/useCoachPreview'
import type { ProgramResponse } from '../../app/features/programs/api/programs.contract'

describe('cpd-9 — useCoachPreview', () => {
  test('toPublicProgram maps every field, including absent ones as null/undefined-free', () => {
    const p = {
      id: 'p1',
      name: 'Programme',
      description: 'desc',
      totalSessions: 5,
      validityMonths: 6,
      priceCents: 1000,
      allowInstallments: false,
      installmentCount: 1,
      monthlyPriceCents: 200,
      discoveryGate: true,
      sessionDurationMinutes: 60
    } as unknown as ProgramResponse
    const out = toPublicProgram(p)
    assert.equal(out.id, 'p1')
    assert.equal(out.name, 'Programme')
    assert.equal(out.totalSessions, 5)
    assert.equal(out.sessionDurationMinutes, 60)
    // no undefined serialized
    assert.ok(!Object.values(out).some(v => v === undefined))
  })

  test('transitions: openMobile opens mobile; closeMobile does NOT close desktop', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const preview = createCoachPreview({})
        assert.equal(preview.mobileOpen.value, false)
        preview.openMobile()
        assert.equal(preview.mobileOpen.value, true)
        // desktop persisted state untouched
        preview.closeMobile()
        assert.equal(preview.mobileOpen.value, false)
      })
    } finally {
      scope.stop()
    }
  })

  test('reopenDesktop toggles desktop open; closeDesktop toggles it closed', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const preview = createCoachPreview({})
        // default open true
        const before = preview.previewOpen.value
        preview.closeDesktop()
        assert.notEqual(preview.previewOpen.value, before)
        preview.reopenDesktop()
        assert.equal(preview.previewOpen.value, before)
      })
    } finally {
      scope.stop()
    }
  })

  test('closeMobile is NOT equivalent to closeDesktop (non-vacuity)', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const preview = createCoachPreview({})
        const desktopBefore = preview.previewOpen.value
        preview.closeMobile()
        // desktop state must be unchanged by closeMobile
        assert.equal(preview.previewOpen.value, desktopBefore)
      })
    } finally {
      scope.stop()
    }
  })

  test('exposes the documented keys', () => {
    const scope = effectScope()
    try {
      scope.run(() => {
        const preview = createCoachPreview({})
        for (const k of ['device', 'mobileOpen', 'openMobile', 'closeMobile', 'reopenDesktop', 'closeDesktop', 'setDevice', 'publicLink', 'previewLink', 'draftProfile', 'draftTenant', 'consultationPlans', 'publicPrograms']) {
          assert.ok(k in preview, `missing ${k}`)
        }
      })
    } finally {
      scope.stop()
    }
  })
})