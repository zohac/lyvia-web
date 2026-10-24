import * as assert from 'node:assert/strict'
import { describe, test } from 'node:test'
import * as Vue from 'vue'

import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'

/**
 * LAB.4 — exécution réelle de `ProviderCredentialsEditor.vue`.
 *
 * La story déplace l'édition des certifications de `/provider/account` vers
 * `/provider/coach-page`. Avant ce fichier, la suite ne vérifiait que des listes
 * de constantes : supprimer entièrement le composant, casser le câblage
 * `v-model:credentials` ou rendre la mise en avant non exclusive laissait les
 * 2287 tests verts (mutation jouée en revue).
 *
 * Convention A32/KISS : les handlers du VNode rendu sont invoqués pour de vrai
 * (`tests/waitlist/waitlist-form.test.ts` est le motif), pas lus en regex.
 */

const UInput = Vue.defineComponent({
  name: 'UInputStub',
  setup: () => () => Vue.h('input')
})
const UButton = Vue.defineComponent({
  name: 'UButtonStub',
  setup: () => () => Vue.h('button')
})
const USwitch = Vue.defineComponent({
  name: 'USwitchStub',
  setup: () => () => Vue.h('button', { role: 'switch' })
})
const USelect = Vue.defineComponent({
  name: 'USelectStub',
  props: ['modelValue', 'items'],
  emits: ['update:modelValue'],
  setup: (props, { emit }) => () =>
    Vue.h('select', {
      value: props.modelValue ?? '',
      onChange: (e: Event) => emit('update:modelValue', (e.target as HTMLSelectElement).value)
    })
})

interface Credential {
  title: string
  institution?: string
  year?: number | null
  logoAssetId?: string
  logoUrl?: string | null
  featured?: boolean
  kind?: 'diploma' | 'certification'
}

function collect(vnode: Vue.VNode | Vue.VNode[] | null | undefined, out: Vue.VNode[] = []): Vue.VNode[] {
  if (!vnode) return out
  if (Array.isArray(vnode)) {
    for (const child of vnode) collect(child, out)
    return out
  }
  out.push(vnode)
  const children = vnode.children
  if (Array.isArray(children)) {
    for (const child of children) {
      if (Vue.isVNode(child)) collect(child, out)
    }
  }
  return out
}

/** Un `v-model` + un `@update:model-value` explicite produisent un TABLEAU de handlers. */
function fire(vnode: Vue.VNode, event: string, ...args: unknown[]): unknown {
  const handler = (vnode.props ?? {})[event] as unknown
  if (Array.isArray(handler)) {
    let result: unknown
    for (const fn of handler) result = (fn as (...a: unknown[]) => unknown)(...args)
    return result
  }
  if (typeof handler === 'function') return (handler as (...a: unknown[]) => unknown)(...args)
  throw new Error(`Handler ${event} absent du VNode`)
}

function ofType(vnodes: Vue.VNode[], type: unknown): Vue.VNode[] {
  return vnodes.filter(vnode => vnode.type === type)
}

function baseOptions(credentials: Credential[]): RenderSfcOptions {
  return {
    props: { credentials },
    globals: {
      ...Vue,
      useToast: () => ({ add: () => {} })
    },
    stubs: { UInput, UButton, USwitch, USelect }
  }
}

/** Rend le composant et capture ce qu'il émet, en laissant le test piloter le VNode. */
async function renderEditor(
  credentials: Credential[],
  drive: (tree: { all: Vue.VNode[], inputs: Vue.VNode[], switches: Vue.VNode[], buttons: Vue.VNode[] }) => void | Promise<void>,
  options: Partial<RenderSfcOptions> = {}
): Promise<{ emitted: Credential[][] }> {
  const emitted: Credential[][] = []
  const config = { ...baseOptions(credentials), ...options }
  config.props = {
    ...(config.props ?? {}),
    'onUpdate:credentials': (value: Credential[]) => emitted.push(value)
  }
  config.inspect = async (instance) => {
    const all = collect(instance.subTree as Vue.VNode)
    await drive({
      all,
      inputs: ofType(all, UInput),
      switches: ofType(all, USwitch),
      buttons: ofType(all, UButton)
    })
  }
  await renderSfc('app/components/organisms/ProviderCredentialsEditor.vue', config)
  return { emitted }
}

describe('LAB.4 — ProviderCredentialsEditor : payload émis', () => {
  test('un titre modifié est émis dans la liste complète', async () => {
    const { emitted } = await renderEditor(
      [{ title: '', institution: 'ISUPNAT' }],
      ({ inputs }) => {
        fire(inputs[0]!, 'onUpdate:modelValue', 'DU Naturopathie')
      }
    )
    assert.equal(emitted.length, 1)
    assert.equal(emitted[0]![0]!.title, 'DU Naturopathie')
    assert.equal(emitted[0]![0]!.institution, 'ISUPNAT')
  })

  test('vider l\'année émet year: null (jamais 0 ni chaîne vide)', async () => {
    const { emitted } = await renderEditor(
      [{ title: 'DU', year: 2020 }],
      ({ inputs }) => {
        fire(inputs[2]!, 'onUpdate:modelValue', '')
      }
    )
    assert.equal(emitted.length, 1)
    assert.equal(emitted[0]![0]!.year, null)
  })

  test('une année saisie est émise en nombre', async () => {
    const { emitted } = await renderEditor(
      [{ title: 'DU', year: null }],
      ({ inputs }) => {
        fire(inputs[2]!, 'onUpdate:modelValue', '2021')
      }
    )
    assert.equal(emitted[0]![0]!.year, 2021)
  })

  test('le payload porte toujours `year: number | null`, jamais `undefined`', async () => {
    // Le champ est nullable côté API : une certification sans année doit partir
    // en `null` explicite, pas avec la clé absente (l'ancien état « non
    // renseigné » deviendrait indistinguable d'un effacement).
    const { emitted } = await renderEditor(
      [{ title: 'DU' }],
      ({ inputs }) => {
        fire(inputs[0]!, 'onUpdate:modelValue', 'DU')
      }
    )
    assert.equal(emitted[0]![0]!.year, null)
  })

  test('la mise en avant est exclusive : activer une ligne désactive les autres', async () => {
    const { emitted } = await renderEditor(
      [
        { title: 'Première', featured: true },
        { title: 'Seconde', featured: false }
      ],
      ({ switches }) => {
        assert.equal(switches.length, 2, 'une ligne = un interrupteur')
        fire(switches[1]!, 'onUpdate:modelValue', true)
      }
    )
    assert.equal(emitted.length, 1)
    assert.deepEqual(emitted[0]!.map(c => c.featured), [false, true])
  })

  test('l\'upload d\'un logo attache l\'asset à la ligne visée', async () => {
    const { emitted } = await renderEditor(
      [{ title: 'DU' }, { title: 'Certification' }],
      async ({ all, buttons }) => {
        const logoButton = buttons.find(vnode => (vnode.props ?? {}).icon === 'i-lucide-image' && !((vnode.props ?? {}).label as string)?.includes('Changer'))
        assert.ok(logoButton, 'bouton « Ajouter un logo » introuvable')
        fire(logoButton!, 'onClick')

        const fileInput = all.find(vnode => vnode.type === 'input' && (vnode.props ?? {}).type === 'file')
        assert.ok(fileInput, 'input file introuvable')
        const file = { name: 'logo.png', type: 'image/png' }
        await fire(fileInput!, 'onChange', { target: { files: [file], value: '' } })
      },
      {
        mocks: {
          '~/features/assets/use-asset-upload': {
            uploadAsset: async () => ({ assetId: 'asset-1', url: 'https://cdn.test/logo.png' }),
            formatUploadError: () => 'upload impossible',
            validateCertificationLogoFile: () => null
          }
        }
      }
    )
    assert.equal(emitted.length, 1)
    assert.equal(emitted[0]![0]!.logoAssetId, 'asset-1')
    assert.equal(emitted[0]![0]!.logoUrl, 'https://cdn.test/logo.png')
    // La seconde ligne ne doit pas hériter du logo.
    assert.equal(emitted[0]![1]!.logoAssetId, undefined)
  })
})

describe('LAB.4 — ProviderCredentialsEditor : accessibilité', () => {
  test('chaque champ porte un nom accessible, y compris l\'année sans libellé visible', async () => {
    await renderEditor([{ title: 'DU' }], ({ inputs }) => {
      const labels = inputs.map(vnode => (vnode.props ?? {})['aria-label'])
      assert.deepEqual(labels, [
        'Titre du diplôme (obligatoire)',
        'Établissement',
        'Année du diplôme (optionnelle)'
      ])
    })
  })

  test('le bouton supprimer reste nommable quand le titre est vide', async () => {
    await renderEditor([{ title: '' }], ({ buttons }) => {
      const deleteButton = buttons.find(vnode => (vnode.props ?? {}).icon === 'i-lucide-trash-2')
      assert.ok(deleteButton)
      assert.equal((deleteButton!.props ?? {})['aria-label'], 'Supprimer le diplôme 1')
    })
  })
})
