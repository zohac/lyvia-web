/**
 * em-2b — le panneau des business logs envoie les préfixes de famille.
 *
 * Le panneau est rendu par le harnais SFC (rendu réel) : ce qui est prouvé ici
 * est ce que l'écran **demande à l'API** quand on clique un chip, pas ce que
 * contient une constante. Depuis em-2b, les chips sont servis par
 * `GET /admin/logs/event-families` : la fixture ci-dessous ne coïncide
 * volontairement pas avec la taxonomie réelle, donc un panneau qui garderait
 * une copie de la liste ne pourrait pas passer ces tests.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'

const PANEL_PATH = 'app/components/organisms/AdminBusinessLogsPanel.vue'

const FAMILIES_PAYLOAD = {
  families: [
    { key: 'payment', label: 'Paiements', prefixes: ['PAYMENT_', 'PAYMENTS_'] },
    {
      key: 'appointment',
      label: 'RDV',
      prefixes: [
        'APPOINTMENT_',
        'APPOINTMENTS_',
        'FREE_FOLLOWUP_',
        'REQUEST_',
        'CONSULTATION_',
        'MEETING_LINK_'
      ]
    },
    { key: 'program', label: 'Programmes', prefixes: ['PROGRAM_'] },
    { key: 'availability', label: 'Disponibilités', prefixes: ['AVAILABILITY_RULE_'] },
    { key: 'reminder', label: 'Jobs de rappel', prefixes: ['REMINDER_'] }
  ],
  excluded: [{ prefixes: ['HONEYPOT_'], reason: 'Purge interne.' }],
  prefixLimit: 30
}

const STUBS = {
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') },
  UButton: {
    name: 'UButton',
    setup(_props: unknown, { slots }: { slots: { default?: () => Vue.VNodeChild } }) {
      return () => Vue.h('button', { type: 'button' }, slots.default?.() ?? [])
    }
  },
  UTable: { name: 'UTable', setup: () => () => Vue.h('table') },
  AtomsDsErrorState: { name: 'AtomsDsErrorState', setup: () => () => Vue.h('div') },
  AtomsDsEmptyState: { name: 'AtomsDsEmptyState', setup: () => () => Vue.h('div') },
  USlideover: { name: 'USlideover', setup: () => () => Vue.h('div') }
}

interface PanelHarness {
  /** Rend le panneau (une seule fois : l'état des chips vit dans l'instance). */
  render: () => Promise<string>
  /** Clique un chip du rendu réel, par son libellé. */
  clickChip: (label: string) => void
  /** Paramètres réellement demandés à l'API des logs, dans l'ordre. */
  apiCalls: Array<Record<string, unknown>>
  /** Libellés de tous les boutons rendus. */
  buttonLabels: () => string[]
  /** Attribut `aria-pressed` du bouton portant ce libellé. */
  ariaPressed: (label: string) => string | undefined
}

/** Monte le panneau avec une API fausse : ce qui est observé, c'est le filtre demandé. */
function buildHarness(
  familiesPayload: unknown = FAMILIES_PAYLOAD
): PanelHarness {
  const apiCalls: Array<Record<string, unknown>> = []
  let instance: Vue.ComponentInternalInstance | null = null

  const options: RenderSfcOptions = {
    stubs: STUBS,
    mocks: {
      '~/services/api/apiFetch': {
        apiFetch: async (url: string, request?: { params?: Record<string, unknown> }) => {
          if (url === '/admin/logs/event-families') return familiesPayload
          // Un filtre vide n'est pas envoyé du tout : l'absence de clé est le
          // cas nominal, et c'est elle que le test de désélection observe.
          apiCalls.push({ ...(request?.params ?? {}) })
          return {
            items: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                eventType: 'PAYMENT_SUCCEEDED',
                userId: null,
                createdAt: '2026-11-13T10:00:00.000Z',
                metadataPreview: '{}'
              }
            ],
            page: { limit: 20, nextCursor: null }
          }
        }
      }
    },
    globals: {
      ...Vue,
      useAsyncData: async (_key: string, handler: () => Promise<unknown>) => {
        const data = Vue.ref(await handler())
        return {
          data,
          pending: Vue.ref(false),
          error: Vue.ref(null),
          refresh: async () => {
            data.value = await handler()
          }
        }
      }
    } as Record<string, unknown>,
    inspect: (rendered) => {
      instance = rendered
    }
  }

  const buttons = () => {
    if (!instance) throw new Error('panel not rendered yet')
    return clickableButtons(instance.subTree)
  }

  return {
    apiCalls,
    render: () => renderSfc(PANEL_PATH, options),
    clickChip: (label: string) => {
      const button = buttons().find(candidate => candidate.text === label)
      if (!button) {
        throw new Error(
          `chip "${label}" introuvable. Boutons rendus: ${buttons()
            .map(candidate => candidate.text)
            .join(' | ')}`
        )
      }
      button.onClick()
    },
    buttonLabels: () => buttons().map(candidate => candidate.text),
    ariaPressed: (label: string) =>
      buttons().find(candidate => candidate.text === label)?.ariaPressed
  }
}

/** Texte rendu d'un VNode (récursif). */
function textOf(node: unknown): string {
  if (typeof node === 'string') return node
  if (Array.isArray(node)) return node.map(textOf).join('')
  if (!node || typeof node !== 'object') return ''
  const vnode = node as Vue.VNode
  if (typeof vnode.children === 'string') return vnode.children
  return textOf(vnode.children)
}

/** Tous les boutons cliquables du VNode rendu, avec leur libellé. */
function clickableButtons(
  node: unknown,
  out: Array<{
    text: string
    onClick: () => void
    ariaPressed: string | undefined
  }> = []
): Array<{ text: string, onClick: () => void, ariaPressed: string | undefined }> {
  if (Array.isArray(node)) {
    node.forEach(child => clickableButtons(child, out))
    return out
  }
  if (!node || typeof node !== 'object') return out
  const vnode = node as Vue.VNode
  const onClick = vnode.props?.onClick
  if (typeof onClick === 'function') {
    out.push({
      text: textOf(vnode.children).trim(),
      onClick: onClick as () => void,
      ariaPressed:
        vnode.props?.['aria-pressed'] === undefined
          ? undefined
          : String(vnode.props['aria-pressed'])
    })
  }
  if (vnode.component?.subTree) clickableButtons(vnode.component.subTree, out)
  clickableButtons(vnode.children, out)
  return out
}

describe('em-2b — le panneau des business logs envoie les préfixes de famille', () => {
  test('les familles servies par l API sont proposées à l écran', async () => {
    const harness = buildHarness()
    await harness.render()

    const labels = harness.buttonLabels()
    for (const label of [
      'Paiements',
      'RDV',
      'Programmes',
      'Disponibilités',
      'Jobs de rappel'
    ]) {
      assert.ok(labels.includes(label), `chip ${label} missing (got ${labels.join(' | ')})`)
    }
    // Aucun libellé hors de la réponse de l'API : le panneau n'a pas de copie.
    assert.equal(labels.filter(label => label === 'Auth').length, 0)
  })

  test('un chip porte son état dans un attribut accessible', async () => {
    const harness = buildHarness()
    await harness.render()

    // Le harnais rend en SSR (un seul passage) : l'état « pressé » après clic
    // n'est pas ré-observable ici, c'est l'appel API qui le prouve. Ce test
    // épingle la présence et la forme de l'attribut sur l'état initial.
    assert.equal(harness.ariaPressed('Paiements'), 'false')
    assert.equal(harness.ariaPressed('Programmes'), 'false')
  })

  test('cliquer « Programmes » envoie PROGRAM_ (famille servie par l API)', async () => {
    const harness = buildHarness()
    await harness.render()
    harness.clickChip('Programmes')

    assert.equal(harness.apiCalls.length, 2, 'one initial load + one filtered load')
    assert.deepEqual(harness.apiCalls[1].eventType, ['PROGRAM_'])
  })

  test('cliquer « Paiements » envoie PAYMENT_ ET PAYMENTS_', async () => {
    const harness = buildHarness()
    await harness.render()
    harness.clickChip('Paiements')

    // Le bug d'origine : le filtre n'envoyait que `PAYMENT_` (ou rien), et les
    // paiements de consultation (`PAYMENTS_*`) restaient invisibles.
    assert.deepEqual(harness.apiCalls[1].eventType, ['PAYMENT_', 'PAYMENTS_'])
  })

  test('cliquer « RDV » envoie tous les préfixes de la famille servie', async () => {
    const harness = buildHarness()
    await harness.render()
    harness.clickChip('RDV')

    assert.deepEqual(harness.apiCalls[1].eventType, [
      'APPOINTMENT_',
      'APPOINTMENTS_',
      'FREE_FOLLOWUP_',
      'REQUEST_',
      'CONSULTATION_',
      'MEETING_LINK_'
    ])
  })

  test('les préfixes envoyés sont des préfixes, jamais la clé de la famille', async () => {
    // Mutation visée : `flatMap(family => [family.key])` enverrait `payment`,
    // que l'API lirait comme un préfixe littéral et qui ne matcherait rien.
    const harness = buildHarness()
    await harness.render()
    harness.clickChip('Paiements')

    const sent = harness.apiCalls[1].eventType
    assert.ok(Array.isArray(sent))
    for (const prefix of sent as string[]) {
      assert.match(prefix, /^[A-Z][A-Z0-9_]*_$/, `not a prefix: ${prefix}`)
    }
  })

  test('désélectionner la famille retire le filtre de la requête', async () => {
    const harness = buildHarness()
    await harness.render()
    harness.clickChip('Paiements')
    harness.clickChip('Paiements')

    const lastCall = harness.apiCalls[harness.apiCalls.length - 1]
    assert.equal('eventType' in lastCall, false)
  })

  test('une taxonomie servie différente change les chips sans toucher au panneau', async () => {
    const harness = buildHarness({
      families: [
        { key: 'custom', label: 'Famille inédite', prefixes: ['CUSTOM_'] }
      ],
      excluded: [],
      prefixLimit: 30
    })
    await harness.render()

    assert.ok(harness.buttonLabels().includes('Famille inédite'))
    // Aucun libellé de la taxonomie réelle ne subsiste : le panneau n'a pas de
    // liste locale. (Le rendu contient aussi le bouton d'ouverture d'une ligne.)
    assert.equal(harness.buttonLabels().includes('Paiements'), false)
    harness.clickChip('Famille inédite')
    assert.deepEqual(harness.apiCalls[1].eventType, ['CUSTOM_'])
  })
})
