import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import type {
  AppointmentDisplayItem,
  EmailReason
} from '../../app/features/clients/api/clients.contract'
import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'

/**
 * EM-6, gate A35 — the extended surface must actually RENDER.
 *
 * Nuxt registers `app/components/**` by path prefix, so an unresolved tag renders
 * nothing while lint, typecheck, unit tests and the build all stay green. Nothing
 * in this story's first cut mounted `AppointmentLine.vue`: the mutation table
 * claimed « retirer le bloc Motif » would hide the state, and no test could have
 * noticed. This harness compiles the real SFC and renders its HTML, so an absent
 * block fails here.
 */

const LINE = 'app/components/molecules/AppointmentLine.vue'

function stub(tag: string): Record<string, unknown> {
  return {
    inheritAttrs: false,
    setup(_props: unknown, { slots }: { slots: Record<string, (() => Vue.VNodeChild) | undefined> }) {
      return () => Vue.h(tag, [slots.default?.()])
    }
  }
}

function options(appointment: AppointmentDisplayItem): RenderSfcOptions {
  return {
    props: { appointment, temporalContext: 'past' },
    globals: { ...Vue },
    stubs: {
      UIcon: stub('span'),
      UBadge: stub('span'),
      UButton: stub('button')
    }
  }
}

function appointment(
  overrides: Partial<AppointmentDisplayItem> = {}
): AppointmentDisplayItem {
  return {
    id: '22222222-2222-4222-8222-222222222222',
    type: 'consultation',
    status: 'scheduled',
    scheduledAt: '2026-09-09T09:00:00.000Z',
    durationMinutes: 60,
    paymentStatus: 'unpaid',
    cancellationReason: null,
    notifications: [],
    ...overrides
  }
}

/** Strips tags so an assertion can be about what the practitioner reads. */
function text(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

describe('AppointmentLine — last email and non-send motive (em-6)', () => {
  test('renders the last email with the server channel label', async () => {
    const html = await renderSfc(
      LINE,
      options(
        appointment({
          paymentStatus: 'paid',
          notifications: [
            {
              channel: 'consultation_reminder',
              channelLabel: 'Rappel consultation J-2 (48 h)',
              status: 'sent',
              createdAt: '2026-11-12T09:14:00.000Z',
              simulated: false
            }
          ]
        })
      )
    )

    assert.match(html, /data-last-email/)
    const rendered = text(html)
    assert.ok(rendered.includes('Dernier email :'))
    assert.ok(rendered.includes('Rappel consultation J-2 (48 h)'))
    assert.ok(rendered.includes('envoyé'))
  })

  test('a simulated row reads « simulé », and « envoyé » is nowhere on the line', async () => {
    const html = await renderSfc(
      LINE,
      options(
        appointment({
          paymentStatus: 'paid',
          notifications: [
            {
              channel: 'consultation_reminder',
              channelLabel: 'Rappel consultation J-2 (48 h)',
              status: 'sent',
              createdAt: '2026-11-12T09:14:00.000Z',
              simulated: true
            }
          ]
        })
      )
    )

    const rendered = text(html)
    assert.ok(rendered.includes('Dernier email :'))
    assert.ok(rendered.includes('simulé'))
    assert.ok(
      !rendered.includes('envoyé'),
      `a console-mode send must not read « envoyé »: ${rendered}`
    )
  })

  test('renders the decided motive verbatim, from the API', async () => {
    const emailReason: EmailReason = {
      code: 'payment_unpaid',
      label: 'consultation impayée'
    }

    const html = await renderSfc(LINE, options(appointment({ emailReason })))

    assert.match(html, /data-email-reason/)
    assert.match(html, /data-email-reason-code="payment_unpaid"/)

    const rendered = text(html)
    assert.ok(rendered.includes('Motif : consultation impayée'))
    // Nothing went out, so there is no last email to show.
    assert.ok(!html.includes('data-last-email'))
  })

  test('renders a failed send motive', async () => {
    const html = await renderSfc(
      LINE,
      options(
        appointment({
          paymentStatus: 'paid',
          emailReason: { code: 'send_failed', label: 'email en échec' }
        })
      )
    )

    assert.ok(text(html).includes('Motif : email en échec'))
  })

  test('shows neither block when nothing is recorded and the API gave no motive', async () => {
    // A cancelled unpaid consultation: the API answers null (the cancellation is
    // the cause, not the payment). The line must show no motive at all rather
    // than the story's first cut's « consultation impayée ».
    const html = await renderSfc(
      LINE,
      options(
        appointment({
          status: 'cancelled',
          paymentStatus: 'unpaid',
          notifications: [],
          emailReason: null
        })
      )
    )

    assert.ok(!html.includes('data-last-email'))
    assert.ok(!html.includes('data-email-reason'))
    assert.ok(!text(html).includes('Motif :'))
  })

  test('shows both blocks when a simulated send produced a simulation motive', async () => {
    const html = await renderSfc(
      LINE,
      options(
        appointment({
          paymentStatus: 'paid',
          notifications: [
            {
              channel: 'consultation_reminder',
              channelLabel: 'Rappel consultation J-2 (48 h)',
              status: 'sent',
              createdAt: '2026-11-12T09:14:00.000Z',
              simulated: true
            }
          ],
          emailReason: {
            code: 'mail_simulated',
            label: 'service email en simulation'
          }
        })
      )
    )

    const rendered = text(html)
    assert.ok(rendered.includes('simulé'))
    assert.ok(rendered.includes('Motif : service email en simulation'))
    assert.ok(!rendered.includes('envoyé'))
  })
})
