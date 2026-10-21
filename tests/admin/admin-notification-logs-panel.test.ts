/**
 * WA.7 — C1 : le rendu du panneau des notifications admin.
 *
 * Le panneau est rendu par le harnais SFC (rendu réel, pas une assertion de
 * source) : ce qui est prouvé ici est ce que l'admin **voit**, pas ce que le
 * code contient.
 *
 * Trois preuves :
 * - le **motif** est lisible dans la liste (colonne + carte mobile) ;
 * - le **filtre par motif** existe et part dans la requête ;
 * - le filtre est **reporté dans l'URL**, comme les autres filtres du panneau.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'
import type { AdminNotificationLogListItem } from '../../app/features/admin/api/admin-notification-log.contract'

const PANEL_PATH = 'app/components/organisms/AdminNotificationLogsPanel.vue'

const STUBS = {
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') },
  // Le slot est rendu : c'est ce qui rend le libellé du bouton « Charger
  // plus » visible dans le VNode (et donc cliquable par le test).
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

function logFixture(
  overrides: Partial<AdminNotificationLogListItem> = {}
): AdminNotificationLogListItem {
  return {
    id: '11111111-1111-1111-1111-111111111111',
    type: 'email',
    channel: 'waitlist_admin',
    status: 'skipped',
    recipient: 'sha256:e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    appointmentId: null,
    reason: 'honeypot_detected',
    createdAt: '2026-10-20T17:50:11.000Z',
    ...overrides
  }
}

interface PanelHarness {
  options: RenderSfcOptions
  apiCalls: Array<Record<string, string>>
  replaced: Array<{ query: Record<string, unknown> }>
  route: { query: Record<string, string> }
  /**
   * Déclenche les watchers enregistrés par le composant.
   *
   * Le harnais ne déclenche pas les watchers de Vue : ils sont **capturés**
   * via un `watch` injecté, puis invoqués à la main — c'est la seule façon
   * d'exercer le retour arrière / avant du navigateur de façon déterministe.
   */
  triggerWatchers: () => void
  /**
   * Simule une navigation : la query est **remplacée** et les watchers
   * capturés sont déclenchés — comme le fait vue-router.
   */
  navigate: (query: Record<string, string>) => void
  /** Lève la réponse différée de `loadMore` (quand elle est en attente). */
  resolveLoadMore: (value: unknown) => void
  /** Les lignes actuellement affichées — la source de vérité de la liste. */
  listedItems: () => AdminNotificationLogListItem[]
}

interface HarnessOptions {
  /** Curseur renvoyé par la liste : sans lui, « Charger plus » n'est pas rendu. */
  nextCursor?: string | null
  /** Met la réponse de `loadMore` en attente (le test la libère). */
  deferCursorCalls?: boolean
}

/**
 * Monte le panneau avec une API et un routeur **faux** : ce qui est observé,
 * c'est ce que le panneau **demande** (params de requête, écriture d'URL).
 */
function buildHarness(
  items: AdminNotificationLogListItem[] = [],
  query: Record<string, string> = {},
  options: HarnessOptions = {}
): PanelHarness {
  const apiCalls: Array<Record<string, string>> = []
  const replaced: Array<{ query: Record<string, unknown> }> = []
  const watchers: Array<() => void> = []
  let pendingLoadMore: ((value: unknown) => void) | null = null
  let listData: Vue.Ref<unknown> | null = null
  const route = Vue.reactive({ query: { ...query } })

  const harnessOptions: RenderSfcOptions = {
    stubs: STUBS,
    mocks: {
      '~/services/api/apiFetch': {
        apiFetch: async (_url: string, request?: { params?: Record<string, string> }) => {
          const params = request?.params ?? {}
          apiCalls.push(params)

          if (params.cursor && options.deferCursorCalls) {
            return new Promise((resolve) => {
              pendingLoadMore = resolve
            })
          }

          return {
            items,
            page: { limit: 20, nextCursor: options.nextCursor ?? null }
          }
        }
      },
      './AdminReminderJobsPanel.vue': { name: 'AdminReminderJobsPanel', setup: () => () => Vue.h('div') },
      './AdminNotificationLogDetail.vue': { name: 'AdminNotificationLogDetail', setup: () => () => Vue.h('div') }
    },
    globals: {
      ...Vue,
      useToast: () => ({ add: () => {} }),
      useRoute: () => route,
      useRouter: () => ({
        replace: (payload: { query: Record<string, unknown> }) => {
          replaced.push(payload)
          // vue-router **remplace** l'objet `query` à chaque navigation, et la
          // navigation déclenche les watchers. Le muter en place, ou ne pas
          // déclencher les watchers, rendrait la boucle
          // `router.replace` → watcher → `refresh()` invisible au test.
          route.query = { ...payload.query } as Record<string, string>
          watchers.forEach(callback => callback())
        }
      }),
      // `watch` est intercepté : le harnais ne déclenche pas les watchers de
      // Vue tout seul, c'est la navigation qui les déclenche.
      watch: (_source: unknown, callback: () => void) => {
        watchers.push(callback)
        return () => {}
      },
      useAsyncData: async (_key: string, handler: () => Promise<unknown>) => {
        const data = Vue.ref(await handler())
        listData = data
        return {
          data,
          pending: Vue.ref(false),
          error: Vue.ref(null),
          refresh: async () => {
            data.value = await handler()
          }
        }
      }
    } as Record<string, unknown>
  }

  return {
    options: harnessOptions,
    apiCalls,
    replaced,
    route,
    triggerWatchers: () => watchers.forEach(callback => callback()),
    navigate: (next: Record<string, string>) => {
      route.query = { ...next }
      watchers.forEach(callback => callback())
    },
    resolveLoadMore: (value: unknown) => {
      if (pendingLoadMore) pendingLoadMore(value)
    },
    listedItems: () => {
      const value = listData?.value as { items?: AdminNotificationLogListItem[] } | undefined
      return value?.items ?? []
    }
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

/**
 * Tous les boutons cliquables du VNode rendu.
 *
 * Le parcours descend aussi dans le rendu des **composants** (`component.subTree`)
 * : un `<UButton>` n'est pas un `<button>` du gabarit, et son gestionnaire
 * `@click` atterrit sur l'élément racine de son rendu.
 */
function clickableButtons(
  node: unknown,
  out: Array<{ text: string, onClick: () => void }> = []
): Array<{ text: string, onClick: () => void }> {
  if (Array.isArray(node)) {
    node.forEach(child => clickableButtons(child, out))
    return out
  }
  if (!node || typeof node !== 'object') return out
  const vnode = node as Vue.VNode
  const onClick = vnode.props?.onClick
  if (typeof onClick === 'function') {
    out.push({ text: textOf(vnode.children).trim(), onClick: onClick as () => void })
  }
  if (vnode.component?.subTree) clickableButtons(vnode.component.subTree, out)
  clickableButtons(vnode.children, out)
  return out
}

describe('WA.7 — panneau des notifications : le motif est lisible (C1)', () => {
  test('le filtre par motif propose le motif honeypot', async () => {
    const harness = buildHarness()

    const html = await renderSfc(PANEL_PATH, harness.options)

    assert.match(html, /Motif:/)
    assert.match(html, /Rejet robot/)
  })

  test('les trois groupes de filtres exposent leur état actif (aria-pressed)', async () => {
    // L'état actif ne doit pas être porté par la **seule** couleur : un
    // lecteur d'écran doit pouvoir dire quelle option est sélectionnée.
    const harness = buildHarness([], { tab: 'notifications', reason: 'honeypot_detected' })

    const html = await renderSfc(PANEL_PATH, harness.options)

    // Le motif sélectionné est annoncé comme pressé…
    assert.match(
      html,
      /<button[^>]*aria-pressed="true"[^>]*>\s*Rejet robot\s*<\/button>/
    )
    // …et les autres, non.
    assert.match(
      html,
      /<button[^>]*aria-pressed="false"[^>]*>\s*Autre motif\s*<\/button>/
    )
    assert.match(
      html,
      /<button[^>]*aria-pressed="false"[^>]*>\s*Envoyé\s*<\/button>/
    )
    assert.match(
      html,
      /<button[^>]*aria-pressed="false"[^>]*>\s*Email\s*<\/button>/
    )
  })

  test('la carte mobile affiche le motif de la notification', async () => {
    const harness = buildHarness([logFixture({ reason: 'honeypot_detected' })])

    const html = await renderSfc(PANEL_PATH, harness.options)

    // La carte mobile est rendue directement par le panneau : c'est le seul
    // rendu que le harnais produit (UTable est un stub).
    const badge = html.match(
      /<span[^>]*data-testid="admin-notification-log-reason-card"[^>]*>([\s\S]*?)<\/span>/
    )
    assert.ok(badge, 'the reason badge must render on the mobile card')
    assert.ok(badge![1].includes('Rejet robot'))
  })

  test('une notification sans motif ne montre pas de pastille de motif', async () => {
    const harness = buildHarness([logFixture({ reason: null })])

    const html = await renderSfc(PANEL_PATH, harness.options)

    assert.doesNotMatch(html, /data-testid="admin-notification-log-reason-card"/)
  })
})

describe('WA.7 — panneau des notifications : le filtre par motif agit (C1)', () => {
  test('le motif de l\'URL part dans la requête API', async () => {
    const harness = buildHarness([], { tab: 'notifications', reason: 'honeypot_detected' })

    await renderSfc(PANEL_PATH, harness.options)

    assert.equal(harness.apiCalls.length, 1)
    assert.equal(harness.apiCalls[0].reason, 'honeypot_detected')
  })

  test('le filtre se combine avec le filtre de statut', async () => {
    // C'est la combinaison qui évite qu'un flot de robots repousse les
    // notifications réelles hors de la première page.
    const harness = buildHarness([], { status: 'skipped', reason: 'honeypot_detected' })

    await renderSfc(PANEL_PATH, harness.options)

    assert.equal(harness.apiCalls[0].status, 'skipped')
    assert.equal(harness.apiCalls[0].reason, 'honeypot_detected')
  })

  test('appliquer le filtre le reporte dans l\'URL, sans perdre l\'onglet', async () => {
    const harness = buildHarness([], { tab: 'notifications' })

    await renderSfc(PANEL_PATH, {
      ...harness.options,
      inspect: async (instance) => {
        const buttons = clickableButtons(instance.subTree)
        const target = buttons.find(button => button.text === 'Rejet robot')
        assert.ok(target, 'the honeypot filter button must render')
        target!.onClick()
      }
    })

    assert.equal(harness.replaced.length, 1)
    const query = harness.replaced[0].query
    assert.equal(query.reason, 'honeypot_detected')
    assert.equal(query.tab, 'notifications')
  })
})

describe('WA.7 — panneau des notifications : l\'URL et l\'écran ne divergent pas', () => {
  test('une URL invalide est réécrite avec les filtres réellement appliqués', async () => {
    // Un motif inconnu et une date ISO (que l'input `datetime-local` ne sait
    // pas afficher) sont **abandonnés** : ils ne doivent pas rester dans l'URL,
    // qui advertirait alors un filtre en vigueur.
    const harness = buildHarness([], {
      tab: 'notifications',
      reason: 'motif_inexistant',
      dateFrom: '2026-10-01T08:30:00.000Z'
    })

    await renderSfc(PANEL_PATH, harness.options)

    assert.equal(harness.replaced.length, 1)
    const query = harness.replaced[0].query
    assert.equal('reason' in query, false)
    assert.equal('dateFrom' in query, false)
    assert.equal(query.tab, 'notifications')
  })

  test('une URL valide n\'est pas réécrite', async () => {
    const harness = buildHarness([], {
      tab: 'notifications',
      reason: 'honeypot_detected'
    })

    await renderSfc(PANEL_PATH, harness.options)

    assert.equal(harness.replaced.length, 0)
  })
})

describe('WA.7 — panneau des notifications : le retour arrière rejoue l\'URL', () => {
  test('la liste est refaite avec les filtres de la nouvelle URL, et l\'état local suit', async () => {
    const harness = buildHarness([], { tab: 'notifications' })

    await renderSfc(PANEL_PATH, harness.options)
    assert.equal(harness.apiCalls.length, 1)
    assert.equal(harness.apiCalls[0].reason, undefined)

    // Navigation vers une autre URL : vue-router **remplace** l'objet `query`.
    harness.route.query = {
      tab: 'notifications',
      reason: 'honeypot_detected'
    } as Record<string, string>

    harness.triggerWatchers()

    // La requête est refaite, et elle porte les filtres de la nouvelle URL.
    assert.equal(harness.apiCalls.length, 2)
    assert.equal(harness.apiCalls[1].reason, 'honeypot_detected')
  })
})

describe('WA.7 — panneau des notifications : pas de boucle entre l\'URL et la liste', () => {
  test('une navigation qui réécrit les mêmes filtres ne produit pas de second appel API', async () => {
    const harness = buildHarness([], { tab: 'notifications' })

    await renderSfc(PANEL_PATH, harness.options)
    assert.equal(harness.apiCalls.length, 1)

    // `router.replace` réécrit la query et déclenche le watcher. Si les
    // filtres sont **inchangés**, le watcher ne doit rien recharger : sinon
    // chaque changement de filtre produirait deux requêtes au lieu d'une.
    harness.navigate({ tab: 'notifications' })

    assert.equal(
      harness.apiCalls.length,
      1,
      'an identical navigation must not trigger a second API call'
    )
  })

  test('un changement de filtre ne déclenche qu\'un seul rechargement', async () => {
    const harness = buildHarness([], { tab: 'notifications' })

    await renderSfc(PANEL_PATH, {
      ...harness.options,
      inspect: async (instance) => {
        const buttons = clickableButtons(instance.subTree)
        const target = buttons.find(button => button.text === 'Rejet robot')
        assert.ok(target, 'the honeypot filter button must render')
        target!.onClick()
      }
    })

    // Un appel au montage + **un** rechargement (pas deux : le `router.replace`
    // du filtre ne doit pas déclencher un refresh supplémentaire).
    assert.equal(harness.apiCalls.length, 2)
    assert.equal(harness.apiCalls[1].reason, 'honeypot_detected')
  })
})

describe('WA.7 — panneau des notifications : « Charger plus » ne mélange pas deux listes', () => {
  test('une page reçue après un changement de filtre est abandonnée', async () => {
    const harness = buildHarness([logFixture()], { tab: 'notifications' }, {
      nextCursor: 'cursor-1',
      deferCursorCalls: true
    })

    let instance: Vue.ComponentInternalInstance | null = null
    await renderSfc(PANEL_PATH, {
      ...harness.options,
      inspect: async (rendered) => {
        instance = rendered
      }
    })

    const before = harness.listedItems().length

    const buttons = clickableButtons(instance!.subTree)
    const more = buttons.find(button => button.text === 'Charger plus')
    assert.ok(more, 'the "Charger plus" button must render when a cursor exists')
    more!.onClick()

    // Les filtres changent **pendant** le vol de la page.
    const filter = buttons.find(button => button.text === 'Rejet robot')
    assert.ok(filter, 'the honeypot filter button must render')
    filter!.onClick()

    // La page arrive : elle appartient à l'ancienne liste, elle est abandonnée.
    harness.resolveLoadMore({
      items: [logFixture({ id: '22222222-2222-2222-2222-222222222222' })],
      page: { limit: 20, nextCursor: null }
    })
    await new Promise(resolve => setTimeout(resolve, 0))

    assert.equal(
      harness.listedItems().length,
      before,
      'the page received after the filter changed must be discarded'
    )
  })
})
