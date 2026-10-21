import * as assert from 'node:assert/strict'
import { it } from 'node:test'
import * as Vue from 'vue'
import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'
import { ApiFetchError } from '../../app/services/api/api-error'

const fixture = {
  firstName: 'Fixture', email: 'fixture@example.com', specialty: 'naturopathie',
  activityStage: 'preparation-lancement', mainBlocker: 'partie-technique', message: 'Bonjour'
}
const messages = {
  'error': 'Votre demande n’a pas pu être envoyée. Merci de vérifier les champs obligatoires puis de réessayer.',
  'rate-limited': 'Trop de tentatives. Réessayez plus tard.',
  'unavailable': 'Un problème technique a empêché l’envoi de votre demande. Vos informations restent pré-remplies ci-dessous — vous pouvez réessayer.'
}
function formVNode(vnode: Vue.VNode): Vue.VNode {
  if (vnode.type === 'form') return vnode
  if (Array.isArray(vnode.children)) {
    for (const child of vnode.children) {
      if (Vue.isVNode(child)) {
        try {
          return formVNode(child)
        } catch { /* autre branche */ }
      }
    }
  }
  throw new Error('Formulaire absent du VNode rendu')
}
function options(access = ''): RenderSfcOptions {
  const field = {
    inheritAttrs: false,
    setup(_props: unknown, { slots }: { slots: { default?: () => Vue.VNodeChild } }) {
      return () => Vue.h('div', [slots.default?.()])
    }
  }
  const input = {
    props: ['modelValue'],
    setup(props: { modelValue: string }) { return () => Vue.h('input', { value: props.modelValue }) }
  }
  return {
    props: { mode: 'inline' },
    globals: {
      ...Vue,
      useToast: () => ({ add: () => {} }), useRoute: () => ({ query: { access } }),
      useRequestEvent: () => ({ context: { waitlistReplay: { ...fixture } } })
    },
    mocks: {
      '~/composables/useLandingAnalytics': { useLandingAnalytics: () => ({ track: () => {} }) },
      '~/services/api/apiFetch': { apiFetch: async () => ({ registered: true }) },
      '~/services/api/api-error': { ApiFetchError }
    },
    stubs: { UFormField: field, UInput: input, UTextarea: input, UIcon: { render: () => Vue.h('span') } }
  }
}

for (const [state, text] of Object.entries(messages)) {
  it(`WA.6 : alerte réellement rendue ${state}, valeurs restituées`, async () => {
    const html = await renderSfc('app/components/organisms/WaitlistForm.vue', options(state))
    assert.match(html, /role="alert"/)
    assert.ok(html.includes(text))
    assert.match(html, /value="Fixture"/)
    assert.match(html, /value="fixture@example.com"/)
    assert.match(html, /name="website"[^>]*tabindex="-1"[^>]*aria-hidden="true"/)
    assert.match(html, /name="website"[^>]* value(?:="")?>/)
  })
}

it('WA.6 : confirmation received réellement rendue à la place du formulaire', async () => {
  const html = await renderSfc('app/components/organisms/WaitlistForm.vue', options('received'))
  assert.match(html, /role="status"/)
  assert.ok(html.includes('Merci, votre demande d’accès a bien été reçue.'))
  assert.doesNotMatch(html, /<form\b/)
})

for (const [label, website] of [
  ['vide', ''],
  ['blanc', '   '],
  ['rempli', '  https://spam.example  ']
] as const) {
  it(`WA.6 : vrai submit SFC, leurre ${label} transmis`, async () => {
    const config = options()
    let emitted: unknown
    config.mocks = { ...config.mocks, '~/services/api/apiFetch': {
      apiFetch: async (url: string, request: { body: unknown }) => {
        assert.equal(url, '/public/waitlist')
        emitted = request.body
        return { registered: true }
      }
    } }
    config.inspect = async (instance) => {
      const form = formVNode(instance.subTree)
      assert.equal(form.type, 'form')
      const input = (form.children as Vue.VNode[]).find(vnode => vnode.props?.name === 'website')
      if (!input) throw new Error('Input website absent')
      input.props?.['onUpdate:modelValue'](website)
      await form.props?.onSubmit({ preventDefault() {} })
      assert.deepEqual(emitted, { ...fixture, ...(website.trim() ? { website: website.trim() } : {}) })
    }
    await renderSfc('app/components/organisms/WaitlistForm.vue', config)
  })
}

it('WA.6 : le leurre n\'est jamais pré-rempli par la restitution', async () => {
  // Le leurre est un prédicat de rejet, pas une donnée : le store de
  // restitution ne doit pas le contenir. Si un jour il le pré-remplissait, la
  // visiteuse verrait sa vraie demande rejetée en silence.
  const config = options()
  config.globals = {
    ...config.globals,
    useRequestEvent: () => ({ context: { waitlistReplay: { ...fixture, website: 'https://spam.example' } } })
  }
  const html = await renderSfc('app/components/organisms/WaitlistForm.vue', config)
  assert.doesNotMatch(html, /value="https:\/\/spam\.example"/)
  assert.match(html, /name="website"[^>]* value(?:="")?>/)
})

it('WA.6 : le leurre est invisible et hors écran au rendu', async () => {
  // Un champ leurre visible est un champ qui attire l'œil — et un humain
  // qui le remplit se voit rejeter en silence. Le masquage est donc une
  // propriété du formulaire, pas une intention : elle est assertée sur le
  // HTML rendu.
  const html = await renderSfc('app/components/organisms/WaitlistForm.vue', options())
  const honeypot = html.match(/<input[^>]*name="website"[^>]*>/)?.[0] ?? ''
  assert.notEqual(honeypot, '', 'Input leurre absent du rendu')
  const classes = honeypot.match(/class="([^"]*)"/)?.[1]?.split(/\s+/) ?? []
  for (const token of ['absolute', '-left-[9999px]', 'opacity-0', 'pointer-events-none']) {
    assert.ok(classes.includes(token), `Classe de masquage absente du leurre : ${token}`)
  }
})

for (const [code, state] of [[422, 'error'], [429, 'rate-limited'], [503, 'unavailable'], [0, 'unavailable']] as const) {
  it(`WA.6 : submit JS ${code || 'réseau'}, même message et saisie conservée`, async () => {
    const config = options()
    const toasts: Array<{ title: string }> = []
    config.globals = { ...config.globals, useToast: () => ({ add: (value: { title: string }) => toasts.push(value) }) }
    config.mocks = { ...config.mocks, '~/services/api/apiFetch': { apiFetch: async () => {
      throw new ApiFetchError({ statusCode: code, code: 'TEST', message: 'test' })
    } } }
    config.inspect = async (instance) => {
      await formVNode(instance.subTree).props?.onSubmit({ preventDefault() {} })
      assert.equal(toasts[0]?.title, messages[state])
      const setup = (instance as unknown as { setupState: { form: typeof fixture, serverErrorMessage: string } }).setupState
      assert.equal(setup.serverErrorMessage, messages[state])
      for (const [field, value] of Object.entries(fixture)) assert.equal(Reflect.get(setup.form, field), value)
    }
    await renderSfc('app/components/organisms/WaitlistForm.vue', config)
  })
}
