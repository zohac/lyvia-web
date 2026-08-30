import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  registerSupport401Handler,
  invokeSupport401Handler,
  hasActiveSupport401Handler
} from '../../app/services/api/support-auth-recovery'

describe('support-auth-recovery', () => {
  it('registers handler, invokes it on demand, and allows clean unregister', async () => {
    let callCount = 0
    const unregister = registerSupport401Handler(async () => {
      callCount++
    })

    assert.equal(hasActiveSupport401Handler(), true)

    await invokeSupport401Handler()
    assert.equal(callCount, 1)

    unregister()
    assert.equal(hasActiveSupport401Handler(), false)

    await invokeSupport401Handler()
    assert.equal(callCount, 1) // Did not increment after unregister
  })

  it('handles multiple calls safely without failing if handler is null', async () => {
    assert.equal(hasActiveSupport401Handler(), false)
    await invokeSupport401Handler() // Should not throw
    assert.ok(true)
  })
})
