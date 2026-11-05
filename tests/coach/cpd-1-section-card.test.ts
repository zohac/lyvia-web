import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'

const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  props: { loading: { type: Boolean, default: false }, color: { type: String, default: '' } },
  emits: ['click'],
  setup: (props, { slots, emit }) => () =>
    Vue.h('button', { onClick: () => emit('click') }, slots.default ? slots.default() : [])
})

const USwitch = Vue.defineComponent({
  name: 'USwitchStub',
  props: { modelValue: { type: Boolean, default: false }, disabled: { type: Boolean, default: false } },
  emits: ['update:modelValue'],
  setup: (props, { emit }) => {
    return () => Vue.h('button', {
      role: 'switch',
      disabled: props.disabled,
      onClick: () => emit('update:modelValue', !props.modelValue)
    })
  }
})

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const c of vnode) collect(c, out)
    return out
  }
  out.push(vnode)
  const children = vnode.children
  if (Array.isArray(children)) for (const c of children) if (Vue.isVNode(c)) collect(c, out)
  if (vnode.component?.subTree) collect(vnode.component.subTree as Vue.VNode, out)
  return out
}

function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (Array.isArray(handler)) {
    let r: unknown
    for (const fn of handler) r = (fn as (...a: unknown[]) => unknown)(...args)
    return r
  }
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent`)
}

/**
 * L'interrupteur rendu, et lui seul. `/disabled/` sur le document entier était
 * aveugle : la sous-chaîne se satisfaisait d'un `disabled` dans une classe ou un
 * libellé, et surtout aucun test n'assertait l'ABSENCE de `disabled` quand la
 * section n'est pas verrouillée — une bascule désactivée en permanence laissait
 * les 8 tests verts (revue cpd-1).
 */
function switchTag(html: string): string {
  const match = html.match(/<button[^>]*\brole="switch"[^>]*>/)
  if (!match) throw new Error('interrupteur (role="switch") attendu dans le rendu')
  return match[0]
}

/** L'en-tête de carte : c'est lui (et non le `<p role="note">`) qui porte le `border-b` conditionnel. */
function headerTag(html: string): string {
  const match = html.match(/<div class="flex items-center justify-between px-6 py-4[^"]*"/)
  if (!match) throw new Error('en-tête de carte attendu dans le rendu')
  return match[0]
}

const BODY = { default: () => [Vue.h('p', { 'data-slot-body': '' }, 'corps de section')] }

async function renderCard(
  overrides: Record<string, unknown> = {},
  drive?: (all: Vue.VNode[]) => void | Promise<void>,
  slots: Record<string, () => Vue.VNode[]> = BODY
) {
  const events: { name: string, args: unknown[] }[] = []
  const listeners: Record<string, (...a: unknown[]) => void> = {}
  listeners.onToggle = (...a: unknown[]) => events.push({ name: 'toggle', args: a })
  listeners.onSave = () => events.push({ name: 'save', args: [] })
  const html = await renderSfc('app/components/organisms/CoachPageSectionCard.vue', {
    props: {
      section: 'bio',
      label: 'Qui suis-je',
      isOn: true,
      locked: false,
      lockReason: null,
      bodyOpen: true,
      saving: false,
      showFooter: true,
      ...listeners,
      ...overrides
    },
    slots,
    stubs: { UButton, USwitch },
    inspect: async (instance) => {
      if (!drive) return
      const all = collect(instance.subTree as Vue.VNode)
      await drive(all)
    }
  })
  return { html, events }
}

describe('CPD.1 — CoachPageSectionCard', () => {
  test('AC-1: rend l’enveloppe réelle (section, h2, switch, label Visible sur ma page)', async () => {
    const { html } = await renderCard()
    assert.match(html, /<section[^>]*id="section-bio"/)
    assert.match(html, /Qui suis-je/)
    assert.match(html, /role="switch"/)
    assert.match(html, /Visible sur ma page/)
    assert.match(html, /aria-label="Qui suis-je — visible sur ma page"/)
  })

  test('AC-1: id pillars', async () => {
    const { html } = await renderCard({ section: 'pillars', label: 'L’accompagnement' })
    assert.match(html, /id="section-pillars"/)
  })

  test('AC-1: bodyOpen false → en-tête sans border-b, ni corps ni pied', async () => {
    const { html } = await renderCard({ bodyOpen: false })
    assert.doesNotMatch(headerTag(html), /border-b/)
    assert.doesNotMatch(html, /data-slot-body/, 'le corps (slot) ne doit pas être rendu')
    assert.doesNotMatch(html, /Enregistrer/)
  })

  test('AC-1: bodyOpen true → border-b, corps du slot rendu, pied rendu, clic émet save', async () => {
    const { html, events } = await renderCard({ bodyOpen: true }, async (all) => {
      const btn = all.find(v => (v.props ?? {}).onClick && (v.props ?? {}).color === 'primary')
      assert.ok(btn, 'bouton Enregistrer attendu')
      fire(btn!, 'onClick')
    })
    assert.match(headerTag(html), /border-b/)
    assert.match(html, /data-slot-body/)
    assert.match(html, /corps de section/)
    assert.match(html, /Enregistrer/)
    assert.deepEqual(events, [{ name: 'save', args: [] }])
  })

  test('AC-1: clic interrupteur émet toggle avec la nouvelle valeur', async () => {
    const { events } = await renderCard({ isOn: true }, async (all) => {
      const sw = all.find(v => v.props?.role === 'switch')
      assert.ok(sw, 'switch attendu')
      fire(sw!, 'onClick')
    })
    assert.deepEqual(events, [{ name: 'toggle', args: ['bio', false] }])
  })

  test('AC-1: showFooter false → corps rendu, aucun pied, aucun save', async () => {
    const { html, events } = await renderCard({ showFooter: false, bodyOpen: true }, async (all) => {
      const btns = all.filter(v => (v.props ?? {}).onClick && (v.props ?? {}).color === 'primary')
      assert.equal(btns.length, 0, 'aucun bouton Enregistrer')
    })
    assert.match(html, /data-slot-body/, 'le corps reste rendu')
    assert.doesNotMatch(html, /Enregistrer/)
    assert.deepEqual(events, [])
  })

  test('AC-2: locked + lockReason → disabled + p role=note portant la raison VERBATIM', async () => {
    // Texte exact de `FREE_TEXT_LOCK_REASON` (`coach-page.vue`). La version
    // tronquée utilisée avant la revue laissait passer une carte qui couperait
    // la fin du message.
    const reason = 'Écrivez d’abord un titre ou un paragraphe pour pouvoir activer cette section.'
    const { html } = await renderCard({ locked: true, lockReason: reason })
    assert.match(switchTag(html), /\bdisabled\b/)
    assert.match(html, /role="note"/)
    assert.match(html, /data-testid="free-text-lock-reason"/)
    assert.ok(html.includes(reason), 'la raison doit être rendue verbatim, sans troncature')
  })

  test('AC-2: unlocked → pas de note, et l’interrupteur N’EST PAS désactivé', async () => {
    const { html } = await renderCard({ locked: false, lockReason: null })
    assert.doesNotMatch(html, /role="note"/)
    assert.doesNotMatch(switchTag(html), /\bdisabled\b/)
  })
})
