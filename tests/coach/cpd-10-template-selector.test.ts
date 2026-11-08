import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'
import { PREMIUM_TEMPLATE_BADGE_LABEL } from '../../app/features/plans/domain/template-lock'
import { featureGateLockTitle } from '../../app/features/plans/domain/feature-gate-copy'
import { FEATURE_COACH_PAGE_PREMIUM_TEMPLATES } from '../../app/features/plans/domain/feature-codes'

/**
 * CPD.10 — preuve de RENDU du sélecteur de template (AC-3, AC-7).
 *
 * Le composant est livré sans aucun test dans la première version : la règle
 * fail-closed d'AC-3 et la mutation « rendre un template verrouillé
 * sélectionnable » ne tuaient donc rien. Ici les handlers des boutons rendus
 * sont invoqués pour de vrai.
 */

const SELECTOR_PATH = 'app/components/organisms/CoachPageTemplateSelector.vue'

const NuxtImg = Vue.defineComponent({
  name: 'NuxtImgStub',
  props: { src: { type: String, default: '' }, alt: { type: String, default: '' } },
  setup: props => () => Vue.h('img', { src: props.src, alt: props.alt })
})

const UIcon = Vue.defineComponent({
  name: 'UIconStub',
  props: { name: { type: String, default: '' } },
  setup: props => () => Vue.h('span', { 'data-icon': props.name })
})

const stubs = { NuxtImg, UIcon }

const templates = [
  {
    id: 'tpl-free',
    code: 'essentiel',
    name: 'Essentiel',
    description: null,
    previewImageUrl: null,
    sectionsAvailable: ['bio'],
    locked: false
  },
  {
    id: 'tpl-locked',
    code: 'signature',
    name: 'Signature',
    description: null,
    previewImageUrl: null,
    sectionsAvailable: ['bio'],
    locked: true
  }
]

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const child of vnode) collect(child, out)
    return out
  }
  out.push(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) if (Vue.isVNode(child)) collect(child, out)
  }
  if (vnode.component?.subTree) collect(vnode.component.subTree as Vue.VNode, out)
  return out
}

function buttons(all: Vue.VNode[]): Vue.VNode[] {
  return all.filter(v => v.type === 'button')
}

function byTestId(all: Vue.VNode[], testid: string): Vue.VNode {
  const found = buttons(all).find(v => (v.props ?? {})['data-testid'] === testid)
  assert.ok(found, `carte "${testid}" attendue dans le rendu`)
  return found as Vue.VNode
}

function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): void {
  const handler = (vnode.props ?? {})[event] as unknown
  assert.equal(typeof handler, 'function', `handler ${event} attendu sur la carte`)
  ;(handler as (...a: unknown[]) => unknown)(...args)
}

async function renderSelector(options: {
  selectedTemplateId?: string | null
  saving?: boolean
  drive?: (all: Vue.VNode[]) => void
} = {}): Promise<{ html: string, events: string[], all: Vue.VNode[] }> {
  const events: string[] = []
  let collected: Vue.VNode[] = []

  const html = await renderSfc(SELECTOR_PATH, {
    props: {
      templates,
      selectedTemplateId: options.selectedTemplateId ?? null,
      saving: options.saving ?? false,
      hasPremiumTemplates: false,
      onSelect: (id: string) => events.push(id)
    },
    globals: { ...Vue },
    stubs,
    inspect: (instance) => {
      collected = collect(instance.subTree as Vue.VNode)
      options.drive?.(collected)
    }
  })

  return { html, events, all: collected }
}

describe('CPD.10 — CoachPageTemplateSelector (AC-3)', () => {
  test('rend une carte par template', async () => {
    const { html, all } = await renderSelector()

    assert.equal(buttons(all).length, 2)
    assert.match(html, /Essentiel/)
    assert.match(html, /Signature/)
  })

  test('la carte sélectionnée porte aria-pressed="true", les autres "false"', async () => {
    const { all } = await renderSelector({ selectedTemplateId: 'tpl-free' })

    const free = byTestId(all, 'coach-template-card')
    const locked = byTestId(all, 'coach-template-card-locked')

    assert.equal((free.props ?? {})['aria-pressed'], true)
    assert.equal((locked.props ?? {})['aria-pressed'], false)
  })

  test('la carte verrouillée est désactivée, badgée et annoncée aux technologies d\'assistance', async () => {
    const { html, all } = await renderSelector()
    const locked = byTestId(all, 'coach-template-card-locked')

    assert.equal((locked.props ?? {}).disabled, true)
    assert.match(html, /data-testid="coach-template-premium-badge"/)
    assert.match(html, new RegExp(PREMIUM_TEMPLATE_BADGE_LABEL))

    const expectedLabel = `Signature — ${PREMIUM_TEMPLATE_BADGE_LABEL} : ${featureGateLockTitle(FEATURE_COACH_PAGE_PREMIUM_TEMPLATES)}`
    assert.equal((locked.props ?? {})['aria-label'], expectedLabel)
  })

  test('un clic sur la carte verrouillée n\'émet pas select (fail-closed)', async () => {
    const { all, events } = await renderSelector()

    fire(byTestId(all, 'coach-template-card-locked'), 'onClick')
    assert.deepEqual(events, [])
  })

  test('un clic sur une carte libre émet select avec l\'id', async () => {
    const { all, events } = await renderSelector()

    fire(byTestId(all, 'coach-template-card'), 'onClick')
    assert.deepEqual(events, ['tpl-free'])
  })

  test('pendant un enregistrement, aucune carte n\'émet select', async () => {
    const { all, events } = await renderSelector({ saving: true })

    fire(byTestId(all, 'coach-template-card'), 'onClick')
    assert.deepEqual(events, [])
  })
})
