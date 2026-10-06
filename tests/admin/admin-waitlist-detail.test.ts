/**
 * WA.1 — Vue de détail d'une demande d'accès.
 *
 * Ces tests **exécutent le rendu** du composant réel (via le harness SFC) au
 * lieu d'en lire la source : c'est la condition de l'AC-5 et la fermeture de
 * LB2-11, resté ouvert parce que les seuls tests du panneau étaient des regex
 * sur du markup mort.
 *
 * `USlideover` est stubé en passe-plat qui rend `#title` + `#body`. reka-ui ne
 * rend rien tant que le panneau n'est pas ouvert, et le chrome du slideover
 * (overlay, animation, piège de focus) n'est pas du ressort d'un rendu SSR :
 * il est couvert par le gate navigateur A-35.
 */
import * as assert from 'node:assert/strict'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import { renderSfc } from '../helpers/render-sfc'
import {
  focusSlideoverTitle,
  restoreFocusToTrigger
} from '../../app/features/admin/admin-waitlist-helpers'
import type { AdminWaitlistLead } from '../../app/features/admin/api/admin-waitlist.contract'

const DETAIL_PATH = 'app/components/organisms/AdminWaitlistLeadDetail.vue'

/**
 * Stub passe-plat qui rend **tous** les slots qu'il reçoit, comme le vrai
 * `USlideover`. Rendre seulement `title` et `body` rendait l'assertion
 * « aucun footer » incapable d'échouer : un `<template #footer>` avec un
 * bouton de mutation serait passé inaperçu.
 */
function slideoverStub(): Record<string, unknown> {
  const SLOT_NAMES = ['title', 'description', 'header', 'body', 'footer'] as const
  return {
    name: 'USlideover',
    inheritAttrs: false,
    props: { open: { type: Boolean, default: false } },
    setup(_props: unknown, { slots }: { slots: Record<string, (() => Vue.VNodeChild) | undefined> }) {
      return () => Vue.h('div', { 'data-sfc-stub': 'USlideover' },
        SLOT_NAMES.map(name => Vue.h('div', { 'data-sfc-slot': name }, [slots[name]?.()])))
    }
  }
}

function baseLead(overrides: Partial<AdminWaitlistLead> = {}): AdminWaitlistLead {
  return {
    id: 'lead-1',
    firstName: 'Émilie',
    lastName: 'Durand',
    email: 'emilie.durand@example.fr',
    specialty: 'sophrologie',
    activityStage: 'lancement-recent',
    mainBlocker: 'organiser-reservations',
    discoverySource: 'recommandation',
    status: 'pending',
    message: 'Bonjour,\nje cherche à simplifier mes réservations.\nCordialement, Émilie',
    createdAt: '2026-10-01T08:30:00.000Z',
    contactedAt: '2026-10-02T09:00:00.000Z',
    onboardedAt: null,
    updatedAt: '2026-10-02T09:00:00.000Z',
    ...overrides
  }
}

function renderDetail(lead: AdminWaitlistLead): Promise<string> {
  return renderSfc(DETAIL_PATH, {
    props: { open: true, lead },
    stubs: { USlideover: slideoverStub() }
  })
}

/**
 * Balise ouvrante du bloc message. Les assertions portent sur elle, pas sur le
 * HTML entier : les commentaires de gabarit sont conservés dans la sortie SSR,
 * donc `/whitespace-pre-wrap/` matcherait aussi le commentaire qui explique la
 * classe sans qu'elle soit posée.
 */
function messageTag(html: string): string {
  const tag = html.match(/<p[^>]*data-testid="admin-waitlist-detail-message"[^>]*>/)
  assert.ok(tag, 'the message element must render')
  return tag![0]
}

describe('WA.1 — Détail d\'une demande : le message complet (AC-1)', () => {
  test('rend le message intégral, retours à la ligne compris', async () => {
    const message = baseLead().message as string
    const html = await renderDetail(baseLead())

    // Les retours à la ligne saisis doivent survivre tels quels dans le HTML :
    // c'est `whitespace-pre-wrap` qui les rend visibles à l'écran, donc ils
    // doivent être présents dans la sortie et non échappés ou aplatis.
    const rendered = html.match(
      /data-testid="admin-waitlist-detail-message"[^>]*>([\s\S]*?)<\/p>/
    )
    assert.ok(rendered, 'the message block must render')
    assert.equal(
      rendered![1].trim(),
      message,
      'the message must be rendered as one contiguous block, with its line breaks intact'
    )
  })

  test('le message préserve les retours à la ligne et casse les mots longs', async () => {
    const tag = messageTag(await renderDetail(baseLead()))

    assert.match(
      tag,
      /\bwhitespace-pre-wrap\b/,
      'UX-DR-WA3: entered line breaks must be preserved, not collapsed'
    )
    assert.match(
      tag,
      /\bbreak-words\b/,
      'a long unbreakable token must wrap instead of overflowing horizontally'
    )
  })

  test('aucune troncature ni info-bulle sur le message (FR-WA7)', async () => {
    const longMessage = 'x'.repeat(4000)
    const html = await renderDetail(baseLead({ message: longMessage }))

    assert.ok(html.includes(longMessage), 'the full message must survive rendering')
    assert.ok(
      !/title="x{40,}/.test(html),
      'the message must not be pushed into a tooltip that hides it'
    )
    assert.ok(!html.includes('…'), 'no ellipsis truncation in the detail')

    const tag = messageTag(html)
    for (const hiding of ['truncate', 'line-clamp', 'text-ellipsis', 'overflow-hidden']) {
      assert.ok(
        !tag.includes(hiding),
        `the message element must not use "${hiding}" — it hides what the admin must read`
      )
    }
  })

  test('affiche l\'email en clair et la qualification en liste libellée', async () => {
    const html = await renderDetail(baseLead())

    assert.match(html, /emilie\.durand@example\.fr/)
    const emailTag = html.match(/<span[^>]*data-testid="admin-waitlist-detail-email"[^>]*>/)
    assert.ok(emailTag, 'the email element must render')
    assert.match(
      emailTag![0],
      /\bbreak-words\b/,
      'a long address must wrap instead of overflowing the mobile sheet'
    )
    assert.match(html, /Je viens de me lancer/, 'activityStage label')
    assert.match(html, /Organiser mes réservations/, 'mainBlocker label')
    assert.match(html, /Une formatrice \/ une recommandation/, 'discoverySource label')
  })

  test('affiche le libellé de statut et de spécialité', async () => {
    const html = await renderDetail(baseLead({ status: 'contacted', specialty: 'hypnose' }))

    assert.match(html, /Contacté/, 'status label from WAITLIST_STATUS_LABELS')
    assert.match(html, /Hypnose/, 'specialty label from WAITLIST_SPECIALTY_LABELS')
  })

  test('spécialité inconnue : retombe sur la valeur brute plutôt que sur undefined', async () => {
    // `kundalini` n'existe ni dans le contrat ni dans `SPECIALTY_LABELS` : c'est
    // exactement le cas qui distingue le `?? lead.specialty` d'un libellé vide.
    const html = await renderDetail(baseLead({
      specialty: 'kundalini' as AdminWaitlistLead['specialty']
    }))

    assert.match(html, />kundalini</, 'an unmapped specialty falls back to its raw value')
    assert.ok(!html.includes('undefined'), 'no "undefined" may leak into the badge')
  })

  test('les horodatages sont formatés, pas affichés tels quels', async () => {
    const html = await renderDetail(baseLead({ onboardedAt: '2026-10-05T14:00:00.000Z' }))
    const block = html.match(/data-testid="admin-waitlist-detail-timestamps"[\s\S]*?<\/dl>/)

    assert.ok(block, 'the timestamps list must render')
    const text = block![0]
    assert.ok(!text.includes('2026-10-01T08:30:00.000Z'), 'no raw ISO date may be rendered')
    assert.ok(!text.includes('Invalid Date'), 'every timestamp must be a real date')
    assert.equal(
      (text.match(/\d{4}/g) ?? []).length,
      3,
      'three formatted dates, each carrying its year'
    )
    assert.ok(
      !/\d{4}-\d{2}-\d{2}T/.test(text),
      'an unformatted ISO string must not survive anywhere in the block'
    )
  })

  test('n\'affiche ni contactedAt ni onboardedAt quand ils sont absents', async () => {
    const html = await renderDetail(baseLead({ contactedAt: null, onboardedAt: null }))

    assert.match(html, /Reçue le/)
    assert.ok(!html.includes('Contactée le'), 'contactedAt must not render when null')
    assert.ok(!html.includes('Onboardée le'), 'onboardedAt must not render when null')
  })
})

describe('WA.1 — Le détail reste valide sans message ni qualification', () => {
  test('lead sans message : ligne de remplacement, reste de la fiche inchangé', async () => {
    const html = await renderDetail(baseLead({ message: null }))

    assert.match(html, /Aucun message renseigné\./)
    assert.ok(!html.includes('admin-waitlist-detail-message"'), 'the message block must not render')
    assert.match(html, /Je viens de me lancer/, 'qualification still rendered')
    assert.match(html, /emilie\.durand@example\.fr/, 'email still rendered')
  })

  test('qualification nulle : fallback « — », pas d\'erreur ni de ligne vide', async () => {
    const html = await renderDetail(baseLead({
      activityStage: null,
      mainBlocker: null,
      discoverySource: null
    }))

    assert.match(html, /admin-waitlist-detail-qualification/)
    const block = html.match(/data-testid="admin-waitlist-detail-qualification"[\s\S]*?<\/dl>/)
    assert.ok(block, 'the qualification list must render')
    assert.equal(
      (block![0].match(/—/g) ?? []).length,
      3,
      'each of the three null qualification fields falls back to the em dash'
    )
  })

  test('lastName null : le nom retombe sur le prénom seul (LB.1, pas de régression)', async () => {
    const html = await renderDetail(baseLead({ lastName: null }))

    assert.match(html, />Émilie</)
    assert.ok(!html.includes('null'), 'no "null" may leak into the rendered name')
  })

  test('lead null : le panneau ne rend aucun contenu et ne lève pas', async () => {
    const html = await renderSfc(DETAIL_PATH, {
      props: { open: true, lead: null },
      stubs: { USlideover: slideoverStub() }
    })

    assert.ok(!html.includes('admin-waitlist-detail"'), 'no lead → no detail body')
    assert.match(html, /Détail de la demande/, 'the heading stays available')
  })
})

describe('WA.1 — Clavier (AC-2)', () => {
  test('le titre du panneau est focusable (tabindex -1)', async () => {
    const html = await renderDetail(baseLead())

    assert.match(html, /data-testid="admin-waitlist-detail-title"[^>]*>/)
    const title = html.match(/<h2[^>]*data-testid="admin-waitlist-detail-title"[^>]*>/)
    assert.ok(title, 'the heading must be rendered')
    assert.match(title![0], /tabindex="-1"/, 'focus must be movable to the heading')
  })

  test('le détail n\'expose aucune mutation de statut (UX-DR-WA5)', async () => {
    const html = await renderDetail(baseLead())
    const footer = html.match(/<div[^>]*data-sfc-slot="footer"[^>]*>([\s\S]*?)<\/div>/)

    // Le stub rend `#footer` : un slot de mutation ajouté au détail se verrait
    // ici. Avant, ce slot n'était pas rendu du tout et l'assertion ne pouvait
    // pas échouer.
    assert.ok(footer, 'the stub must render a footer slot')
    assert.ok(
      !/<[a-zA-Z]/.test(footer![1].replace(/<!--[\s\S]*?-->/g, '')),
      `the detail fills no footer, found: ${footer![1]}`
    )
    assert.ok(
      !html.includes('Marquer contacté') && !html.includes('Décliner'),
      'no status transition may be offered from the detail panel'
    )
  })
})

describe('WA.1 — focusSlideoverTitle (prise sur l\'autofocus de reka-ui)', () => {
  test('annule le défaut puis pose le focus sur le titre', () => {
    const calls: string[] = []
    const event = { preventDefault: () => calls.push('preventDefault') }
    const heading = { focus: () => calls.push('focus') }

    assert.equal(focusSlideoverTitle(event, heading), true)
    assert.deepEqual(calls, ['preventDefault', 'focus'])
  })

  test('sans titre, laisse le comportement par défaut intact', () => {
    let prevented = false
    const event = {
      preventDefault: () => {
        prevented = true
      }
    }

    assert.equal(focusSlideoverTitle(event, null), false)
    assert.equal(prevented, false, 'cancelling without focusing would leave the focus nowhere')
  })
})

describe('WA.1 — restoreFocusToTrigger (restitution du focus à la ligne)', () => {
  /** Faux `HTMLElement` focusable : le helper ne lit que ces champs. */
  function fakeTrigger(
    overrides: { isConnected?: boolean, offsetParent?: unknown } = {}
  ): { element: HTMLElement, focused: string[] } {
    const focused: string[] = []
    const element = {
      isConnected: overrides.isConnected ?? true,
      offsetParent: overrides.offsetParent === undefined ? {} : overrides.offsetParent,
      focus: () => focused.push('focus')
    } as unknown as HTMLElement
    return { element, focused }
  }

  test('annule le défaut de reka puis refocuse le déclencheur mémorisé', () => {
    const calls: string[] = []
    const event = { preventDefault: () => calls.push('preventDefault') }
    const { element, focused } = fakeTrigger()

    assert.equal(restoreFocusToTrigger(event, [element]), true)
    assert.deepEqual(calls, ['preventDefault'])
    assert.deepEqual(focused, ['focus'])
  })

  test('aucun candidat : rend la main à reka', () => {
    let prevented = false
    const event = {
      preventDefault: () => {
        prevented = true
      }
    }

    assert.equal(restoreFocusToTrigger(event, []), false)
    assert.equal(prevented, false)
  })

  test('déclencheur déconnecté : pas de preventDefault, le focus reste à reka', () => {
    let prevented = false
    const event = {
      preventDefault: () => {
        prevented = true
      }
    }
    const { element, focused } = fakeTrigger({ isConnected: false })

    assert.equal(restoreFocusToTrigger(event, [element]), false)
    assert.equal(prevented, false)
    assert.deepEqual(focused, [], 'a detached trigger must not be focused')
  })

  test('candidats nuls ou vides tolérés', () => {
    let prevented = false
    const event = {
      preventDefault: () => {
        prevented = true
      }
    }

    assert.equal(restoreFocusToTrigger(event, [null, null]), false)
    assert.equal(prevented, false)
  })
})

/**
 * Le cas que le premier candidat seul ne couvrait pas : une même demande est
 * rendue deux fois (ligne desktop dans `hidden md:block`, carte mobile dans
 * `md:hidden`). Après un redimensionnement franchissant `md`, le rendu qui a
 * déclenché l'ouverture est `display:none` — `isConnected` y reste vrai et
 * `.focus()` y est un no-op silencieux qui envoie le focus sur `body`, ce
 * qu'AC-2 interdit explicitement. Le second candidat prend le relais.
 */
describe('WA.1 — restoreFocusToTrigger franchit le point de rupture md', () => {
  function candidate(
    overrides: { isConnected?: boolean, offsetParent?: unknown } = {}
  ): { element: HTMLElement, focused: () => number } {
    let count = 0
    const element = {
      isConnected: overrides.isConnected ?? true,
      offsetParent: overrides.offsetParent === undefined ? {} : overrides.offsetParent,
      focus: () => {
        count++
      }
    } as unknown as HTMLElement
    return { element, focused: () => count }
  }

  test('le déclencheur masqué est sauté au profit du rendu encore visible', () => {
    const calls: string[] = []
    const event = { preventDefault: () => calls.push('preventDefault') }
    const desktopRow = candidate({ offsetParent: null })
    const mobileCard = candidate()

    assert.equal(restoreFocusToTrigger(event, [desktopRow.element, mobileCard.element]), true)
    assert.equal(mobileCard.focused(), 1, 'the still-visible card takes the focus')
    assert.equal(desktopRow.focused(), 0, 'a hidden row must never be focused')
    assert.deepEqual(calls, ['preventDefault'])
  })

  test('le premier candidat focusable l’emporte quand les deux sont visibles', () => {
    const event = { preventDefault: () => {} }
    const fired = candidate()
    const counterpart = candidate()

    assert.equal(restoreFocusToTrigger(event, [fired.element, counterpart.element]), true)
    assert.equal(fired.focused(), 1)
    assert.equal(counterpart.focused(), 0)
  })

  test('les deux rendus disparus : rend la main à reka (seule issue restante)', () => {
    let prevented = false
    const event = {
      preventDefault: () => {
        prevented = true
      }
    }
    const rowGone = candidate({ isConnected: false })
    const cardGone = candidate({ isConnected: false })

    assert.equal(restoreFocusToTrigger(event, [rowGone.element, cardGone.element]), false)
    assert.equal(prevented, false)
  })
})

/**
 * Capture ce que le composant transmet au `USlideover` : le contenu `content`
 * et la fonction `emit`, pour pouvoir reproduire une fermeture.
 */
interface SlideoverCapture {
  content: Record<string, unknown>
  emit: (event: string, value: boolean) => void
}

function captureSlideover(): { stub: Record<string, unknown>, calls: SlideoverCapture[] } {
  const calls: SlideoverCapture[] = []
  return {
    calls,
    stub: {
      name: 'USlideover',
      props: {
        open: { type: Boolean, default: false },
        content: { type: Object, default: undefined }
      },
      emits: ['update:open'],
      setup(
        props: { content?: Record<string, unknown> },
        { emit, slots }: {
          emit: (event: string, value: boolean) => void
          slots: Record<string, (() => Vue.VNodeChild) | undefined>
        }
      ) {
        return () => {
          calls.push({ content: props.content ?? {}, emit })
          return Vue.h('div', [slots.title?.(), slots.body?.()])
        }
      }
    }
  }
}

/** Rends le détail en capturant le `USlideover`, avec un spy sur `update:open`. */
async function renderWithCapture(props: Record<string, unknown>): Promise<{
  calls: SlideoverCapture[]
  closed: boolean[]
}> {
  const { stub, calls } = captureSlideover()
  const closed: boolean[] = []
  await renderSfc(DETAIL_PATH, {
    props: { 'open': true, 'lead': baseLead(), ...props, 'onUpdate:open': (v: boolean) => closed.push(v) },
    stubs: { USlideover: stub }
  })
  return { calls, closed }
}

describe('WA.1 — le contrat avec le USlideover', () => {
  test('onOpenAutoFocus ET onCloseAutoFocus sont dans `content`', async () => {
    const { calls } = await renderWithCapture({})

    assert.equal(calls.length, 1, 'the slideover must be mounted once')
    assert.equal(
      typeof calls[0]?.content.onOpenAutoFocus,
      'function',
      'AC-4/UX-DR-WA2: without onOpenAutoFocus, reka-ui focuses the close button'
    )
    assert.equal(
      typeof calls[0]?.content.onCloseAutoFocus,
      'function',
      'AC-2: reka restores focus to document.activeElement, which is not the clicked row'
    )
  })

  test('onCloseAutoFocus refocuse le déclencheur et annule le défaut de reka', async () => {
    const focused: string[] = []
    const trigger = {
      isConnected: true,
      offsetParent: {},
      focus: () => focused.push('row')
    } as unknown as HTMLElement
    const { calls } = await renderWithCapture({ returnFocusTo: [trigger] })

    const closeHandler = calls[0]?.content.onCloseAutoFocus as ((e: Event) => void) | undefined
    assert.equal(typeof closeHandler, 'function', 'onCloseAutoFocus must be handed to the slideover')
    let prevented = false
    closeHandler!({
      preventDefault: () => {
        prevented = true
      }
    } as unknown as Event)

    assert.deepEqual(focused, ['row'], 'the memorised trigger must receive the focus')
    assert.equal(prevented, true, 'reka default must be cancelled, it would land on body')
  })

  /**
   * Le panneau transmet les **deux** rendus de la demande. Si le premier est
   * parti (`display:none` après un resize franchissant `md`), c'est l'autre
   * qui reçoit le focus — sinon `.focus()` sur le premier est un no-op silencieux
   * et le focus part sur `body`, ce qu'AC-2 interdit.
   */
  test('onCloseAutoFocus bascule sur le rendu mobile si la ligne desktop est masquée', async () => {
    const focused: string[] = []
    const hiddenRow = {
      isConnected: true,
      offsetParent: null,
      focus: () => focused.push('row')
    } as unknown as HTMLElement
    const visibleCard = {
      isConnected: true,
      offsetParent: {},
      focus: () => focused.push('card')
    } as unknown as HTMLElement
    const { calls } = await renderWithCapture({ returnFocusTo: [hiddenRow, visibleCard] })

    const closeHandler = calls[0]?.content.onCloseAutoFocus as ((e: Event) => void) | undefined
    let prevented = false
    closeHandler!({
      preventDefault: () => {
        prevented = true
      }
    } as unknown as Event)

    assert.deepEqual(focused, ['card'], 'the visible card must receive the focus, not body')
    assert.equal(prevented, true, 'reka default must be cancelled, it would land on body')
  })

  test('onCloseAutoFocus sans prop : rend la main à reka sans planter', async () => {
    const { calls } = await renderWithCapture({})

    const closeHandler = calls[0]?.content.onCloseAutoFocus as ((e: Event) => void) | undefined
    let prevented = false
    closeHandler!({
      preventDefault: () => {
        prevented = true
      }
    } as unknown as Event)

    assert.equal(prevented, false)
  })

  test('onCloseAutoFocus laisse le défaut de reka si le déclencheur est déconnecté', async () => {
    const focused: string[] = []
    const trigger = {
      isConnected: false,
      offsetParent: {},
      focus: () => focused.push('row')
    } as unknown as HTMLElement
    const { calls } = await renderWithCapture({ returnFocusTo: [trigger] })

    const closeHandler = calls[0]?.content.onCloseAutoFocus as ((e: Event) => void) | undefined
    assert.equal(typeof closeHandler, 'function', 'onCloseAutoFocus must be handed to the slideover')
    let prevented = false
    closeHandler!({
      preventDefault: () => {
        prevented = true
      }
    } as unknown as Event)

    assert.deepEqual(focused, [], 'a detached trigger must not be focused')
    assert.equal(prevented, false, 'cancelling without a target would strand the focus')
  })

  test('une fermeture du USlideover est relayée par `update:open`', async () => {
    const { calls, closed } = await renderWithCapture({})

    calls[0]?.emit('update:open', false)

    assert.deepEqual(closed, [false], 'closing must reach the panel, which drives v-model:open')
  })
})
