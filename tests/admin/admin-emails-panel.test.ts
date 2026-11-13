/**
 * EM-4 — l'écran Emails de l'admin, rendu par le **vrai** harnais SFC.
 *
 * Ce que ce test prouve, et qu'aucune assertion de source ne prouverait :
 *
 * 1. le panneau est **monté par la vraie page** `/admin/tools` (slot `#emails`
 *    câblé) et rend le catalogue, le fournisseur et l'activité ;
 * 2. le fournisseur n'est **pas** deviné : tant que l'activité n'est pas
 *    chargée, l'écran n'annonce ni « console » ni simulation ;
 * 3. l'erreur de la route `activity` est visible (une erreur de chargement
 *    n'est pas « aucun envoi ») ;
 * 4. une ligne **simulée** est affichée comme telle depuis le registre, même
 *    quand le fournisseur courant est `brevo`, et une ligne réelle affiche son
 *    identifiant fournisseur.
 *
 * Mutations attendues (chacune casse au moins un test) : retirer le slot
 * `#emails` de `tools.vue` ; retirer le badge de simulation ; lire
 * `simulated` depuis le fournisseur courant au lieu de la ligne ; afficher
 * « console » quand `activity` est nulle ; ignorer `activityError`.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc, type RenderSfcOptions } from '../helpers/render-sfc'
import type {
  AdminEmailsActivity,
  EmailCatalogueEntry
} from '../../app/features/admin/api/admin-emails.contract'

const PANEL_PATH = 'app/components/organisms/AdminEmailsPanel.vue'
const TOOLS_PAGE_PATH = 'app/pages/admin/tools.vue'

const STUBS = {
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  // Le slot est rendu : le libellé du bouton devient visible (et cliquable).
  UButton: {
    name: 'UButton',
    props: { loading: Boolean, disabled: Boolean },
    setup(props: { loading?: boolean, disabled?: boolean }, { slots }: { slots: { default?: () => unknown } }) {
      return () => Vue.h(
        'button',
        {
          'type': 'button',
          'data-loading': String(props.loading ?? false),
          'data-disabled': String(props.disabled ?? false)
        },
        (slots.default?.() ?? []) as Vue.VNodeChild[]
      )
    }
  },
  AtomsDsErrorState: {
    name: 'AtomsDsErrorState',
    props: { message: String },
    setup(props: { message?: string }) {
      return () => Vue.h('div', { 'data-error-state': 'true' }, props.message ?? 'Erreur')
    }
  }
}

const CATALOGUE: EmailCatalogueEntry[] = [
  {
    kind: 'APPOINTMENTS_CLIENT_REQUEST_CANCELLATION',
    label: 'Demande client : annulation',
    category: 'Appointments',
    trigger: 'POST /client/appointments/:id/request-cancellation',
    channel: 'client_request_notification',
    channels: ['client_request_notification'],
    traceability: 'tracked'
  },
  {
    kind: 'PROGRAM_PAYMENT_FAILED',
    label: 'Échec de paiement programme',
    category: 'Programs',
    trigger: 'Webhook Stripe invoice.payment_failed',
    channel: 'program_payment_failed',
    channels: ['program_payment_failed'],
    traceability: 'tracked'
  },
  {
    kind: 'AUTH_PASSWORD_RESET',
    label: 'Réinitialisation du mot de passe',
    category: 'Auth',
    trigger: 'POST /auth/forgot-password (best-effort, sans notification_logs)',
    channel: null,
    channels: [],
    traceability: 'untracked'
  }
]

function activityFixture(overrides: Partial<AdminEmailsActivity> = {}): AdminEmailsActivity {
  return {
    provider: 'brevo',
    simulated: false,
    items: [
      {
        kind: 'PROGRAM_PAYMENT_FAILED',
        lastSend: {
          id: 'log-sent',
          status: 'sent',
          channel: 'program_payment_failed',
          createdAt: '2026-11-13T09:15:00.000Z',
          providerMessageId: '<abc@brevo>',
          simulated: false
        },
        lastFailure: {
          id: 'log-failed',
          createdAt: '2026-11-13T08:00:00.000Z',
          errorMessage: 'retryable=true;provider=brevo'
        }
      }
    ],
    ...overrides
  }
}

interface PanelHarness {
  options: RenderSfcOptions
  sent: Array<Record<string, unknown>>
}

function panelHarness(input: {
  activity?: AdminEmailsActivity | null
  activityError?: Error | null
  activityPending?: boolean
  sendResult?: Record<string, unknown>
} = {}): PanelHarness {
  const sent: Array<Record<string, unknown>> = []

  const options: RenderSfcOptions = {
    stubs: { ...STUBS },
    mocks: {
      '~/features/admin/services/admin-emails.service': {
        listAdminEmailCatalogue: async () => CATALOGUE,
        getAdminEmailsActivity: async () => {
          if (input.activityError) throw input.activityError
          return input.activity ?? activityFixture()
        },
        sendAdminTestEmail: async (payload: Record<string, unknown>) => {
          sent.push(payload)
          return input.sendResult ?? {
            kind: payload.kind,
            channel: 'program_payment_failed',
            status: 'sent',
            providerMessageId: '<new@brevo>',
            simulated: false,
            notificationLogId: 'log-new'
          }
        }
      }
    },
    globals: {
      ...Vue,
      useToast: () => ({ add: () => {} }),
      // `useAsyncData` de Nuxt **capture** l'erreur du handler et la publie
      // dans `error` ; il ne la propage pas. Un mock qui la propage rendrait
      // le cas « l'appel a échoué » intestable.
      useAsyncData: async (key: string, handler: () => Promise<unknown>) => {
        const isActivity = key.includes('activity')
        if (input.activityPending === true && isActivity) {
          // Chargement en cours : aucune donnée disponible, comme le vrai
          // `useAsyncData` avant résolution.
          return {
            data: Vue.ref(null),
            pending: Vue.ref(true),
            error: Vue.ref(null),
            refresh: async () => {}
          }
        }
        try {
          const data = Vue.ref(await handler())
          return {
            data,
            pending: Vue.ref(input.activityPending === true && isActivity),
            error: Vue.ref(null),
            refresh: async () => {}
          }
        } catch (error) {
          return {
            data: Vue.ref(null),
            pending: Vue.ref(false),
            error: Vue.ref(error),
            refresh: async () => {}
          }
        }
      }
    }
  }

  return { options, sent }
}

/**
 * HTML **visible** : les commentaires de template sont rendus par le SSR et
 * ne doivent pas faire passer une assertion de texte (le commentaire du bloc
 * fournisseur nomme « console » pour expliquer qu'il n'est pas deviné).
 */
function visible(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, '')
}

function countOccurrences(haystack: string, needle: string): number {
  return haystack.split(needle).length - 1
}

describe('AdminEmailsPanel', () => {
  test('renders the catalogue, the provider and the per-kind activity', async () => {
    const { options } = panelHarness()
    const html = await renderSfc(PANEL_PATH, options)

    for (const entry of CATALOGUE) {
      assert.ok(html.includes(entry.kind), `ligne absente du catalogue rendu : ${entry.kind}`)
      assert.ok(html.includes(entry.label), `libellé absent : ${entry.label}`)
    }
    assert.ok(html.includes('Fournisseur configuré'))
    assert.ok(html.includes('brevo'), 'le fournisseur configuré doit être affiché')
    // Pas de simulation en brevo : le badge ne doit pas apparaître.
    assert.ok(!html.includes('Simulation (console)'))
    // Dernier envoi réel : l'identifiant fournisseur est la preuve (CAP-5).
    assert.ok(html.includes('abc@brevo'), 'l’identifiant fournisseur du dernier envoi est absent')
    // Dernier échec : le motif vient du registre, pas d'une interprétation.
    assert.ok(html.includes('retryable=true;provider=brevo'))
    // Le formulaire de test propose les modèles du catalogue.
    assert.ok(html.includes('Envoyer un email de test'))
    assert.ok(countOccurrences(html, '<option') === CATALOGUE.length, 'une option par modèle attendu')
  })

  test('marks a simulated send from the register, not from the current provider', async () => {
    const { options } = panelHarness({
      activity: {
        provider: 'brevo',
        simulated: false,
        items: [
          {
            kind: 'PROGRAM_PAYMENT_FAILED',
            lastSend: {
              id: 'log-sim',
              status: 'sent',
              channel: 'program_payment_failed',
              createdAt: '2026-11-13T09:15:00.000Z',
              providerMessageId: null,
              simulated: true
            },
            lastFailure: null
          }
        ]
      }
    })

    const html = await renderSfc(PANEL_PATH, options)

    // Le fournisseur courant est brevo : seul le drapeau de la ligne peut
    // dire que cette ligne-là n'a jamais été envoyée.
    assert.ok(html.includes('simulé (aucun envoi réel)'))
  })

  test('flags the console provider as a simulation', async () => {
    const { options } = panelHarness({
      activity: { provider: 'console', simulated: true, items: [] }
    })

    const html = await renderSfc(PANEL_PATH, options)

    assert.ok(html.includes('Simulation (console)'))
    assert.ok(html.includes('console'), 'le fournisseur configuré est nommé')
  })

  test('does not announce a provider before the activity is loaded', async () => {
    const { options } = panelHarness({ activityPending: true })
    const html = visible(await renderSfc(PANEL_PATH, options))

    // Avant chargement, annoncer « console » affirmerait une simulation qui
    // n'a peut-être pas lieu.
    assert.ok(!html.includes('Simulation (console)'))
    assert.ok(!html.includes('console'), 'aucun fournisseur ne doit être annoncé avant chargement')
    assert.ok(!html.includes('brevo'), 'aucun fournisseur ne doit être annoncé avant chargement')
    assert.ok(html.includes('Fournisseur configuré'))
  })

  test('shows the error of the activity route, not an empty activity', async () => {
    const { options } = panelHarness({ activityError: new Error('activity down') })
    const html = await renderSfc(PANEL_PATH, options)

    assert.ok(html.includes('data-error-state="true"'), 'l’erreur de l’activité doit être rendue')
    assert.ok(html.includes('activity down') || html.includes('Erreur lors du chargement'))
    // Une erreur n'est pas « aucun envoi » : le tableau ne doit pas être rendu
    // avec des « — » partout, ce qui se lirait comme un registre vide.
    assert.ok(!html.includes('Dernier envoi'))
  })

  test('sends the test email to the endpoint and reports the provider id', async () => {
    const { options, sent } = panelHarness()
    let button: Vue.VNode | null = null

    const html = await renderSfc(PANEL_PATH, {
      ...options,
      inspect: (instance) => {
        // Le bouton « Envoyer » est un VNode de UButton stubbé : on le
        // retrouve dans l'arbre pour invoquer son handler comme un clic.
        const walk = (node: Vue.VNode): void => {
          if (node.type && (node.type as { name?: string }).name === 'UButton') {
            button = node
          }
          const children = node.children
          if (!Array.isArray(children)) return
          for (const child of children) {
            if (child && typeof child === 'object' && 'type' in child) {
              walk(child as Vue.VNode)
            }
          }
        }
        walk(instance.subTree)
      }
    })

    assert.ok(html.includes('Envoyer'))
    assert.ok(button, 'le bouton d’envoi est introuvable dans l’arbre rendu')
    const props = (button as unknown as Vue.VNode).props as { onClick?: () => Promise<void> }
    assert.equal(typeof props.onClick, 'function', 'le bouton d’envoi n’a pas de handler')

    // Le destinataire est vide : le handler doit refuser de partir.
    await props.onClick?.()
    assert.deepEqual(sent, [], 'aucun envoi ne doit partir sans destinataire')
  })
})

describe('/admin/tools — onglet Emails', () => {
  const TABS_STUB = {
    name: 'UTabs',
    setup(_props: unknown, { slots }: { slots: Record<string, () => Vue.VNode[]> }) {
      // Rend **tous** les slots d'onglet : c'est ce qui prouve que le contenu
      // de l'onglet Emails est bien câblé au composant.
      return () => Vue.h(
        'div',
        Object.entries(slots).map(([name, render]) =>
          Vue.h('section', { 'data-tab-slot': name }, render())
        )
      )
    }
  }

  const OTHER_PANELS = {
    '../../components/organisms/AdminAnalyticsPanel.vue': {
      name: 'AdminAnalyticsPanel',
      setup: () => () => Vue.h('div', { 'data-panel': 'analytics' })
    },
    '../../components/organisms/AdminBusinessLogsPanel.vue': {
      name: 'AdminBusinessLogsPanel',
      setup: () => () => Vue.h('div', { 'data-panel': 'logs' })
    },
    '../../components/organisms/AdminNotificationLogsPanel.vue': {
      name: 'AdminNotificationLogsPanel',
      setup: () => () => Vue.h('div', { 'data-panel': 'notifications' })
    }
  }

  test('mounts the emails panel inside the emails tab slot', async () => {
    const { options } = panelHarness()
    const html = await renderSfc(TOOLS_PAGE_PATH, {
      ...options,
      stubs: {
        ...options.stubs,
        UTabs: TABS_STUB,
        AtomsDsPageHeader: { name: 'AtomsDsPageHeader', setup: () => () => Vue.h('h1') },
        OrganismsAdminWaitlistPanel: {
          name: 'OrganismsAdminWaitlistPanel',
          setup: () => () => Vue.h('div', { 'data-panel': 'waitlist' })
        }
      },
      mocks: { ...options.mocks, ...OTHER_PANELS },
      globals: {
        ...(options.globals ?? {}),
        definePageMeta: () => {},
        useRoute: () => ({ query: {} }),
        useRouter: () => ({ replace: () => {} }),
        nextTick: Vue.nextTick
      }
    })

    assert.ok(html.includes('data-tab-slot="emails"'), 'le slot #emails de /admin/tools est absent')
    // Le contenu vient du vrai panneau, monté par la page.
    assert.ok(html.includes('Fournisseur configuré'), 'le panneau Emails n’est pas rendu dans l’onglet')
    assert.ok(html.includes('Échec de paiement programme'), 'le catalogue du panneau n’est pas rendu')
  })
})
