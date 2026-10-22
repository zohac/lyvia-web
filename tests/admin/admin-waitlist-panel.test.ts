/**
 * Story 0-33 — behavioural coverage of the admin Waitlist panel (AC-6, AC-8).
 * WA.1 — branchement de la vue de détail (ligne et carte déclencheurs).
 *
 * The project ships no DOM-mount framework. Vue components are therefore
 * covered two ways, and the split is deliberate:
 *
 *  - **rendered assertions** (new in WA.1) for anything behavioural — they run
 *    the real component through the SFC harness and read its HTML. This is
 *    what closes LB2-11: `fullName()` and the Qualification block had no test
 *    that *executes*, so a source regex on the wiring passed just as happily
 *    over dead markup.
 *  - **source assertions** for what a render cannot prove: literal UI wording
 *    pinned by an AC (A31), and wiring into a page that is itself only read
 *    as text.
 */
import * as assert from 'node:assert/strict'
import * as fs from 'node:fs'
import * as path from 'node:path'
import test, { describe } from 'node:test'

import * as Vue from 'vue'

import {
  computeActionsForStatus,
  fullName,
  reconcileLead,
  resolveTriggers,
  shouldIgnoreClickForSelection,
  statusBadgeClasses
} from '../../app/features/admin/admin-waitlist-helpers'
import { renderSfc } from '../helpers/render-sfc'
import type { AdminWaitlistLead } from '../../app/features/admin/api/admin-waitlist.contract'

const appRoot = path.resolve(process.cwd(), 'app')
const PANEL_PATH = 'components/organisms/AdminWaitlistPanel.vue'
const TOOLS_PAGE_PATH = 'pages/admin/tools.vue'

function readPanel(): string {
  return fs.readFileSync(path.join(appRoot, PANEL_PATH), 'utf-8')
}

function readToolsPage(): string {
  return fs.readFileSync(path.join(appRoot, TOOLS_PAGE_PATH), 'utf-8')
}

/**
 * Isole la **région d'une balise** dont la balise ouvrante porte un marqueur.
 *
 * Sert aux assertions de source qui portent sur une région — « la cellule du
 * menu porte bien un `.stop` » — plutôt que sur une forme de texte exacte. La
 * recherche s'arrête sur la balise ouvrante elle-même, donc l'ordre des
 * attributs, leur nombre et le formatage sur plusieurs lignes n'ont aucune
 * incidence : la preuve survit au reformat, ce que ne faisait pas l'ancienne
 * assertion qui épinglait la classe et l'ordre sur une fenêtre de 80 caractères.
 */
function sliceTagWith(source: string, tagName: string, marker: string): string | null {
  const openTag = new RegExp(`<${tagName}\\b[\\s\\S]*?>`, 'g')
  for (const match of source.matchAll(openTag)) {
    if (match[0].includes(marker)) {
      const start = match.index ?? -1
      const end = source.indexOf(`</${tagName}`, start)
      if (end === -1) return null
      return source.slice(start, end)
    }
  }
  return null
}

// ---------------------------------------------------------------------------
// Rendered coverage (WA.1 — LB2-11)
// ---------------------------------------------------------------------------

const STUBS = {
  USkeleton: { name: 'USkeleton', setup: () => () => Vue.h('div') },
  UIcon: { name: 'UIcon', setup: () => () => Vue.h('i') },
  USelect: { name: 'USelect', setup: () => () => Vue.h('select') },
  UDropdownMenu: { name: 'UDropdownMenu', setup: () => () => Vue.h('div') },
  UButton: { name: 'UButton', setup: () => () => Vue.h('button') },
  AtomsDsErrorState: { name: 'AtomsDsErrorState', setup: () => () => Vue.h('div') },
  AtomsDsEmptyState: { name: 'AtomsDsEmptyState', setup: () => () => Vue.h('div') },
  USlideover: { name: 'USlideover', setup: () => () => Vue.h('div') }
}

/**
 * Le détail est importé explicitement par le panneau (plus d'auto-import :
 * voir le commentaire de l'import). Ce stub observe ce que le panneau lui
 * passe — monté, fermé, sans lead — sans rendre son contenu.
 */
const DETAIL_STUB = {
  name: 'AdminWaitlistLeadDetail',
  props: {
    open: { type: Boolean, default: false },
    lead: { type: Object, default: null },
    returnFocusTo: { type: Array, default: () => [] }
  },
  setup(props: { open: boolean, lead: AdminWaitlistLead | null, returnFocusTo: HTMLElement[] }) {
    return () => Vue.h('div', {
      'data-sfc-stub': 'detail',
      'data-detail-open': String(props.open),
      'data-detail-has-lead': String(props.lead !== null),
      'data-detail-return-focus-count': String(props.returnFocusTo.length),
      // L'ordre porte le contrat de focus : le déclencheur qui a reçu l'événement
      // passe en premier, l'autre rendu de la même demande en second.
      'data-detail-return-focus-kind': props.returnFocusTo.map((el, i) => {
        const tag = (el as unknown as { tagName?: string }).tagName ?? 'row'
        return `${i}:${tag.toLowerCase()}`
      }).join(',')
    })
  }
}

function leadFixture(overrides: Partial<AdminWaitlistLead> = {}): AdminWaitlistLead {
  return {
    id: 'lead-1',
    firstName: 'Émilie',
    lastName: 'Durand',
    email: 'emilie.durand@example.fr',
    specialty: 'sophrologie',
    activityStage: 'lancement-recent',
    mainBlocker: 'creer-site',
    discoverySource: 'google',
    status: 'pending',
    message: 'Bonjour',
    createdAt: '2026-10-01T08:30:00.000Z',
    contactedAt: null,
    onboardedAt: null,
    updatedAt: '2026-10-01T08:30:00.000Z',
    ...overrides
  }
}

/** États du store que le panneau lit directement dans son template. */
interface PanelStoreState {
  loading: boolean
  error: string | null
  isEmpty: boolean
  nextCursor: string | null
}

const DEFAULT_STATE: PanelStoreState = {
  loading: false,
  error: null,
  isEmpty: false,
  nextCursor: null
}

/**
 * Les chemins réseau du store simulé. Ce sont les seules méthodes qu'un test
 * appelle directement — pour prouver que le compteur est atteignable.
 */
interface PanelStoreNetworkPaths {
  fetchInitial: () => Promise<void>
  loadMore: () => Promise<void>
  applyFilters: (filters: { status?: string }) => void
  resetFilters: () => void
}

/** Store tel que le composant le reçoit : chaque état est une ref. */
type PanelStoreRefs = PanelStoreNetworkPaths & Record<string, unknown>

/**
 * Construit le store simulé injecté par `renderPanel`, exposé pour être appelé
 * directement. Nécessaire pour prouver que le compteur réseau est
 * **atteignable** : le harnais rend en SSR, donc `onMounted` ne s'exécute pas et
 * une assertion « 0 appel au rendu » ne peut pas échouer sur la violation
 * qu'elle vise.
 *
 * `sink.listCalls` compte les appels réseau — NFR-WA1 exige que l'ouverture du
 * détail n'en déclenche aucun. Les quatre chemins qui atteignent `service.list`
 * y sont branchés : `fetchInitial` **et** `applyFilters` / `resetFilters` /
 * `loadMore`, sans quoi une violation passerait inaperçue.
 */
function buildPanelStore(
  leads: AdminWaitlistLead[],
  sink: { listCalls: number },
  state: Partial<PanelStoreState> = {}
): PanelStoreRefs & PanelStoreNetworkPaths {
  const resolved = { ...DEFAULT_STATE, ...state }
  const countCall = () => {
    sink.listCalls++
  }
  return {
    items: Vue.shallowRef(leads),
    loading: Vue.ref(resolved.loading),
    loadingMore: Vue.ref(false),
    error: Vue.ref<string | null>(resolved.error),
    nextCursor: Vue.ref<string | null>(resolved.nextCursor),
    filters: Vue.reactive({ limit: 50 }),
    isEmpty: Vue.computed(() => resolved.isEmpty),
    fetchInitial: async () => {
      countCall()
    },
    loadMore: async () => {
      countCall()
    },
    applyFilters: () => {
      countCall()
    },
    resetFilters: () => {
      countCall()
    },
    updateStatus: async () => leadFixture()
  }
}

function renderPanel(
  leads: AdminWaitlistLead[],
  sink?: { listCalls: number },
  state: Partial<PanelStoreState> = {}
): Promise<string> {
  const store = buildPanelStore(leads, sink ?? { listCalls: 0 }, state)

  return renderSfc(`app/${PANEL_PATH}`, {
    stubs: STUBS,
    mocks: {
      '~/features/admin/use-admin-waitlist': {
        useAdminWaitlist: () => store,
        WAITLIST_SPECIALTY_LABELS: {
          'sophrologie': 'Sophrologie',
          'yoga-meditation': 'Yoga & Méditation'
        },
        WAITLIST_STATUS_LABELS: {
          pending: 'En attente',
          contacted: 'Contacté',
          onboarded: 'Onboardé',
          declined: 'Décliné'
        }
      },
      // Le panneau importe le détail explicitement ; ce stub observe ce qu'il
      // lui passe. La vue de détail a sa propre suite.
      './AdminWaitlistLeadDetail.vue': DETAIL_STUB
    },
    globals: { useToast: () => ({ add: () => {} }) }
  })
}

describe('WA.1 — Panneau rendu : nom complet et qualification (LB2-11)', () => {
  /**
   * Isole un bloc de qualification rendu — cellule desktop ou carte mobile.
   * Le HTML du panneau contient déjà des tirets cadratins dans ses propres
   * commentaires de gabarit : compter sur le document entier ne prouve rien,
   * et supprimer le repli laisserait le test vert.
   */
  function sliceQualification(html: string, mobile = false): string {
    const start = mobile
      ? html.indexOf('space-y-0.5 text-xs')
      : html.indexOf('<span class="sr-only">Stade de l&#39;activit')
    // La cellule desktop se ferme par `</td>`, la carte mobile par `</div>`.
    const end = html.indexOf(mobile ? '</div>' : '</td>', start)
    assert.ok(start !== -1 && end > start, 'the Qualification block must render')
    return html.slice(start, end)
  }

  test('fullName() concatène prénom et nom', () => {
    assert.equal(fullName({ firstName: 'Émilie', lastName: 'Durand' }), 'Émilie Durand')
  })

  test('fullName() retombe sur le prénom seul quand lastName est null', () => {
    assert.equal(fullName({ firstName: 'Émilie', lastName: null }), 'Émilie')
  })

  test('le tableau rendu affiche le nom complet et la qualification libellée', async () => {
    const html = await renderPanel([leadFixture()])

    assert.match(html, /Émilie Durand/, 'fullName must be rendered, desktop table included')
    assert.match(html, /Je viens de me lancer/, 'activityStage label')
    assert.match(html, /Créer ou terminer mon site/, 'mainBlocker label')
    assert.match(html, /Google/, 'discoverySource label')
  })

  test('qualification nulle : le panneau rendu affiche le fallback « — »', async () => {
    const html = await renderPanel([leadFixture({
      activityStage: null,
      mainBlocker: null,
      discoverySource: null
    })])

    assert.match(html, /Émilie Durand/, 'the row still renders')
    // Le HTML du panneau contient des tirets cadratins dans ses propres
    // commentaires de gabarit : compter sur le document entier ne prouve rien.
    // On isole chaque bloc de qualification.
    for (const [where, mobile] of [['desktop', false], ['mobile', true]] as const) {
      assert.equal(
        (sliceQualification(html, mobile).match(/—/g) ?? []).length,
        3,
        `${where}: the three null qualification fields each fall back to the em dash`
      )
    }
  })

  test('le nom sans lastName ne fuit pas de « null » à l\'écran', async () => {
    const html = await renderPanel([leadFixture({ lastName: null })])

    assert.match(html, /Émilie/)
    assert.ok(!html.includes('Émilie null'), 'no "null" may leak into the rendered name')
  })
})

describe('WA.1 — Panneau rendu : la ligne et la carte ouvrent le détail', () => {
  test('la ligne desktop est focusable et porte le déclencheur du détail', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const row = html.match(/<tr[^>]*data-testid="admin-waitlist-row-abc"[^>]*>/)

    assert.ok(row, 'the seeded row must render')
    assert.match(row![0], /tabindex="0"/, 'the row must be focusable for the focus to return to it')
    assert.match(row![0], /data-detail-trigger="abc"/, 'the row itself opens the detail (option A)')
  })

  test('ligne et carte sont toutes deux câblées à openDetail (source)', () => {
    // Les gestionnaires ne sont pas sérialisés dans le HTML SSR : seule la
    // source prouve *que* le clic ouvre le détail. Ce qui est rendu, c'est que
    // la surface est focusable et annoncée — les deux moitiés du contrat.
    // On compte les occurrences sans épingler l'ordre des attributs ni le libellé
    // exact du handler : un reformat inoffensif ne doit pas casser ce test.
    const source = readPanel()

    assert.equal(
      (source.match(/@click="openDetail\(/g) ?? []).length,
      2,
      'both the desktop row and the mobile card must open the detail'
    )
    assert.match(source, /@keydown\.enter\.prevent="openDetail\(/)
    assert.match(source, /@keydown\.space\.prevent="openDetail\(/)
  })

  /**
   * Sans `@keydown.stop` sur cette cellule, `Entrée` sur le bouton « Actions »
   * remonte jusqu'au `<tr>` et ouvre le détail pendant que le statut change.
   *
   * On extrait la cellule puis on cherche le `.stop` **n'importe où** à
   * l'intérieur : l'ancienne assertion épinglait la classe et l'ordre exacts
   * des attributs sur une fenêtre de 80 caractères, donc elle cassait au
   * reformat et passait si le `.stop` partait sur un ancêtre inerte.
   */
  test('la cellule du menu desktop arrête clic ET clavier', () => {
    const cell = sliceTagWith(readPanel(), 'td', 'px-6 py-3 text-right')

    if (cell === null) throw new Error('the desktop menu cell must exist')
    assert.match(cell, /@click\.stop/, 'the desktop menu cell must stop click propagation')
    assert.match(cell, /@keydown\.stop/, 'the desktop menu cell must stop keyboard propagation')
    assert.match(cell, /<UDropdownMenu/, 'the cell must be the one wrapping the row menu')
  })

  test('le conteneur du menu mobile arrête clic ET clavier', () => {
    const wrapper = sliceTagWith(readPanel(), 'div', 'mt-3 flex justify-end')

    if (wrapper === null) throw new Error('the mobile menu wrapper must exist')
    assert.match(wrapper, /@click\.stop/, 'the mobile menu wrapper must stop click propagation')
    assert.match(wrapper, /@keydown\.stop/, 'the mobile menu wrapper must stop keyboard propagation')
    assert.match(wrapper, /<UDropdownMenu/, 'the wrapper must be the one around the card menu')
  })

  test('@click.stop n\'est posé ni sur UDropdownMenu (reka ne rend pas d\'élément racine)', () => {
    const source = readPanel()

    assert.ok(
      !/<UDropdownMenu[\s\S]{0,80}@click\.stop/.test(source),
      '@click.stop on UDropdownMenu is silently dropped — it must live on the DOM ancestor'
    )
  })

  test('openDetail mémorise les deux déclencheurs pour rendre le focus (AC-2)', () => {
    // Le rendu couvre la surface focusable et les deux cibles `data-detail-trigger`
    // (voir le test voisin) ; ici on couvre que le panneau transmet bien une
    // **liste** de déclencheurs au détail, pas un nœud unique — un nœud unique
    // renvoie le focus sur `body` dès qu'un resize franchit `md`.
    // On n'épingle pas le cast TypeScript : un simple renommage de variable ne
    // doit pas casser un test de comportement.
    const source = readPanel()

    assert.match(source, /:return-focus-to="detailTriggers"/)
    // `[\s\S]` et non `.` : l'assignation s'étale sur plusieurs lignes depuis
    // que `resolveTriggers` est une fonction pure qui prend la racine.
    assert.match(source, /detailTriggers\.value = [\s\S]*?currentTarget/)
  })

  test('la ligne est annoncée avec le nom et l\'email de la demande', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const row = html.match(/<tr[^>]*data-testid="admin-waitlist-row-abc"[^>]*>/)

    assert.ok(row)
    assert.match(row![0], /aria-label="[^"]*Émilie Durand[^"]*"/)
    assert.match(row![0], /emilie\.durand@example\.fr/)
  })

  test('la carte mobile porte le même déclencheur que la ligne', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const card = html.match(/<div[^>]*data-testid="admin-waitlist-card-abc"[^>]*>/)

    assert.ok(card, 'the mobile card must render')
    // Symétrique du test de la ligne : `data-detail-trigger` est ce que
    // `resolveTriggers` interroge, donc son absence ici casserait la restitution
    // du focus sur mobile sans qu'aucun test ne le voie.
    assert.match(card![0], /data-detail-trigger="abc"/, 'the card itself opens the detail (option A)')
    assert.match(card![0], /role="button"/)
    assert.match(card![0], /tabindex="0"/)
    assert.match(card![0], /aria-label="/)
  })

  test('ligne et carte annoncent l\'ouverture d\'une boîte de dialogue', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const row = html.match(/<tr[^>]*data-testid="admin-waitlist-row-abc"[^>]*>/)![0]
    const card = html.match(/<div[^>]*data-testid="admin-waitlist-card-abc"[^>]*>/)![0]

    for (const [where, tag] of [['row', row], ['card', card]] as const) {
      assert.match(tag, /aria-haspopup="dialog"/, `${where}: the affordance must be announced`)
      assert.match(tag, /aria-expanded="false"/, `${where}: collapsed while the detail is closed`)
    }
  })

  test('aucun appel réseau au rendu du panneau (NFR-WA1)', async () => {
    const sink = { listCalls: 0 }

    await renderPanel([leadFixture()], sink)

    // Le panneau est monté mais fermé : la vue de détail est rendue avec un
    // `lead` null et n'émet aucun fetch.
    //
    // Ce test ne peut échouer que si le compteur est branché : c'est vérifié
    // dans « le compteur réseau est atteignable », plus bas dans ce fichier.
    assert.equal(sink.listCalls, 0, 'rendering the panel must not hit the API')
  })

  test('openDetail ne déclenche aucun appel réseau (NFR-WA1)', () => {
    // Le rendu ci-dessus prouve l'absence d'appel au montage. Il reste
    // l'ouverture elle-même : `openDetail` ne doit faire que mémoriser des
    // références, la donnée est déjà dans le store.
    //
    // La liste est élargie aux formes par lesquelles un fetch peut se cacher
    // sans écrire le nom d'une méthode du store : un `watch` sur `detailOpen`
    // (le candidat le plus probable, écrit dans `onMounted` où le harnais SSR
    // n'entre jamais) ou un appel différé. Aucune n'est exécutée ici — le
    // harnais rend en SSR — mais le garde doit au moins les interdire.
    const source = readPanel()
    const body = source.match(/function openDetail\([^)]*\): void \{[\s\S]*?\n\}/)

    assert.ok(body, 'openDetail must exist')
    const forbidden = [
      'fetchInitial',
      'loadMore',
      'applyFilters',
      'resetFilters',
      'updateStatus',
      'apiFetch',
      '$fetch',
      'await',
      'watch',
      'watchEffect',
      'queueMicrotask',
      '.then(',
      'setTimeout'
    ]
    for (const token of forbidden) {
      assert.ok(
        !body![0].includes(token),
        `openDetail must not trigger "${token}" — the lead is already in the store`
      )
    }
  })

  /**
   * Le vecteur le plus probable d'une régression NFR-WA1 n'est pas dans
   * `openDetail` : c'est un `watch(detailOpen, handler)` ajouté à côté, où le
   * handler déclenche un fetch.
   *
   * Ronde 4 : une assertion de **proximité** (scanner 500 caractères après
   * chaque `watch(`) n'attrapait pas un handler nommé — `watch(detailOpen,
   * refreshOnOpen)` avec `fetchInitial` dans `refreshOnOpen` laissait 57/57
   * vert. Et avec zéro observateur, la boucle ne s'exécutait pas : l'assertion
   * ne s'évaluait jamais. Le harnais SSR ne pouvant pas observer le réseau, la
   * seule preuve tenable est **structurelle** : aucun observateur n'est
   * autorisé, et en ajouter un exige de venir l'autoriser ici explicitement,
   * après revue au regard de NFR-WA1.
   */
  test('tout observateur du panneau doit être explicitement autorisé (NFR-WA1)', () => {
    const source = readPanel()
    const allowListedObservers: string[] = []
    const observers = [...source.matchAll(/watch(?:Effect)?\(/g)]
      .map(match => source.slice(match.index, (match.index ?? 0) + 40).split('\n')[0].trim())

    assert.deepEqual(
      observers,
      allowListedObservers,
      `the panel must declare no watcher unless it is allow-listed here — found: ${observers.join(' | ')}`
    )
  })

  test('openDetail ignore le clic qui termine une sélection de texte', () => {
    // Un drag-select qui finit sur la ligne émet quand même `click` : sans ce
    // garde, le panneau s'ouvre par-dessus la sélection et l'admin ne peut
    // plus copier un email. `getSelection` n'existe pas en SSR, l'assertion
    // porte donc sur le source du corps de `openDetail`.
    const source = readPanel()
    const body = source.match(/function openDetail\([^)]*\): void \{[\s\S]*?\n\}/)

    assert.ok(body, 'openDetail must exist')
    assert.match(body![0], /event\.type === 'click'/, 'the guard must be scoped to the click path')
  })

  /**
   * La portée du garde est une décision produit, pas un détail : appliquée aussi
   * à `Entrée` / `Espace`, elle rendait le détail **inatteignable au clavier**
   * dès qu'une sélection traînait ailleurs dans le document — y compris dans un
   * autre panneau `UTabs` que `:unmount-on-hide="false"` garde en vie. La ligne et
   * la carte doivent donc rester câblées à `openDetail` sur les trois événements,
   * sans condition.
   */
  test('le garde anti-sélection ne s’applique qu’au clic', () => {
    const source = readPanel()
    const body = source.match(/function openDetail\([^)]*\): void \{[\s\S]*?\n\}/)

    assert.ok(body, 'openDetail must exist')
    const guard = body![0]
      .split('\n')
      .find(line => /^\s*if \(.*\) return\s*$/.test(line))

    assert.ok(guard, 'openDetail must bail out on the guarded condition')
    assert.ok(
      !/keydown/.test(guard!),
      `Enter and Space must never be blocked by a text selection — found: ${guard!.trim()}`
    )
  })

  test('Entrée et Espace ouvrent le détail sans condition de sélection', () => {
    const source = readPanel()

    assert.match(source, /@keydown\.enter\.prevent="openDetail\(/)
    assert.match(source, /@keydown\.space\.prevent="openDetail\(/)
  })

  /**
   * Le harnais rend en SSR : `openDetail` n'est jamais dispatché, donc on ne peut
   * pas observer la bascule `detailOpen` de `false` à `true`. Ce que le test peut
   * prouver, c'est que le **contrat de liaison** qui la rendrait possible est
   * présent — et c'est précisément ce qui manque si `v-model:open` est remplacé
   * par `:open`.
   *
   * Avec `:open="detailOpen"` seul, le panneau ouvre une fois puis n'est plus
   * jamais.syncronisé : `detailOpen` reste `true`, reka ne ré-ouvre rien, et les
   * clics suivants sont silencieusement ignorés pendant que la ligne annonce
   * `aria-expanded="true"` en boucle. C'est le défaut le plus grave que cette
   * story puisse livrer, et il était invisible.
   */
  test('la fermeture est relayée au panneau : liaison bidirectionnelle obligatoire', () => {
    const source = readPanel()

    assert.match(
      source,
      /<AdminWaitlistLeadDetail\s+v-model:open="detailOpen"/,
      'v-model:open carries both the open state and the update:open relay — a read-only :open makes the panel unreopenable'
    )
  })

  test('le détail est monté par le panneau, fermé et sans lead', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const detail = html.match(/<div[^>]*data-sfc-stub="detail"[^>]*>/)

    assert.ok(detail, 'the panel must mount the detail view')
    assert.match(detail![0], /data-detail-open="false"/)
    assert.match(detail![0], /data-detail-has-lead="false"/)
    assert.match(
      detail![0],
      /data-detail-return-focus-count="0"/,
      'no trigger is memorised until a row is actually activated'
    )
  })

  /**
   * Le harnais rend en SSR : `openDetail` n'est jamais dispatché, donc on ne peut
   * pas observer le tableau `returnFocusTo` « en action ». Ce test fixe le
   * **contrat observable** — les deux rendus de la demande sont résolus par
   * `data-detail-trigger`, donc `resolveTriggers` a deux cibles — et la suite
   * `restoreFocusToTrigger franchit le point de rupture md` prouve le comportement
   * une fois les candidats fournis.
   */
  test('les deux rendus d’une demande sont résolus pour la restitution du focus', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])
    const triggers = html.match(/data-detail-trigger="abc"/g) ?? []

    assert.equal(
      triggers.length,
      2,
      'the row and the card must both expose data-detail-trigger — resolveTriggers needs both'
    )
  })

  test('aucun contenu de lead ne fuit tant que le détail est fermé', async () => {
    const html = await renderPanel([leadFixture({ id: 'abc' })])

    assert.ok(
      !html.includes('admin-waitlist-detail-message'),
      'no lead content may be rendered while the detail is closed'
    )
  })

  test('le menu de statut reste dans le panneau, pas dans le détail', () => {
    const panelSource = readPanel()
    const detailSource = fs.readFileSync(
      path.join(appRoot, 'components/organisms/AdminWaitlistLeadDetail.vue'),
      'utf-8'
    )

    assert.match(panelSource, /actionsFor\(lead\)/, 'the row keeps the status menu')
    assert.ok(
      !detailSource.includes('computeActionsForStatus'),
      'UX-DR-WA5: the detail must not offer a second status mutation surface'
    )
    assert.ok(
      !detailSource.includes('updateStatus'),
      'UX-DR-WA5: the detail must not mutate anything'
    )
  })
})

/**
 * Un compteur qu'aucun chemin n'atteint reste à zéro quelle que soit la
 * violation qu'il est censé détecter : l'assertion « 0 appel réseau » passerait
 * verte même si le panneau fetchaient trois fois. Ces deux tests prouvent que le
 * compteur **fonctionne**, avant que ces assertions aient un sens.
 */
describe('WA.1 — le compteur réseau est atteignable avant d’affirmer zéro', () => {
  test('fetchInitial incrémente bien le compteur', async () => {
    const sink = { listCalls: 0 }
    const store = buildPanelStore([leadFixture()], sink)

    await store.fetchInitial()

    assert.equal(sink.listCalls, 1, 'the sink must be reachable, otherwise 0 proves nothing')
  })

  test('les trois autres chemins réseau atteignent le même compteur', async () => {
    const sink = { listCalls: 0 }
    const store = buildPanelStore([leadFixture()], sink)

    store.applyFilters({ status: 'pending' })
    store.resetFilters()
    await store.loadMore()

    assert.equal(
      sink.listCalls,
      3,
      'every path reaching service.list must be wired to the sink, or a violation goes unseen'
    )
  })
})

/**
 * Les états vide / erreur / chargement ne rendent ni ligne ni carte — donc
 * aucun déclencheur. C'est précisément là que le markup ajouté par WA.1
 * (`data-detail-trigger`, `tabindex`, `role="button"`, `cursor-pointer`) ne
 * doit surtout pas apparaître : une zone activable sans liste n'a aucun
 * détail à ouvrir.
 */
describe('WA.1 — Panneau rendu : aucun déclencheur hors liste', () => {
  const states: Array<[string, Partial<PanelStoreState>]> = [
    ['vide', { isEmpty: true }],
    ['erreur', { error: 'Boom' }],
    ['chargement initial', { loading: true }]
  ]

  for (const [label, state] of states) {
    test(`état « ${label} » : aucun déclencheur de détail`, async () => {
      const html = await renderPanel([leadFixture({ id: 'abc' })], undefined, state)

      assert.ok(
        !html.includes('data-detail-trigger'),
        `the ${label} state must not render a detail trigger`
      )
      assert.ok(
        !html.includes('tabindex="0"'),
        `the ${label} state must not render a focusable trigger`
      )
      assert.ok(
        !html.includes('role="button"'),
        `the ${label} state must not render a role="button" trigger`
      )
    })
  }
})

/**
 * Ronde 3 : ces deux fonctions pures vivaient dans le `<script setup>` du
 * panneau, donc n'étaient couvertes que par des assertions de source — inverser
 * leur corps laissait la suite verte. Extraites dans `admin-waitlist-helpers.ts`
 * pour être **exécutées**.
 */
describe('WA.1 — helpers de la zone déclencheuse (exécutés, ronde 3)', () => {
  function fakeTrigger(tagName: string): HTMLElement {
    return { tagName } as unknown as HTMLElement
  }

  function fakeRoot(elements: HTMLElement[], selectors: string[] = []): ParentNode {
    return {
      querySelectorAll: (selector: string) => {
        selectors.push(selector)
        return elements
      }
    } as unknown as ParentNode
  }

  describe('shouldIgnoreClickForSelection', () => {
    test('aucune sélection : le clic ouvre le détail', () => {
      assert.equal(shouldIgnoreClickForSelection(''), false)
    })

    test('sélection non vide : le clic est ignoré', () => {
      assert.equal(shouldIgnoreClickForSelection('emilie.durand@example.fr'), true)
    })
  })

  describe('resolveTriggers', () => {
    test('le déclencheur qui a reçu l’événement passe en premier', () => {
      const row = fakeTrigger('TR')
      const card = fakeTrigger('DIV')

      assert.deepEqual(
        resolveTriggers(fakeRoot([row, card]), 'abc', card),
        [card, row],
        'the fired element leads; the counterpart of the same lead follows'
      )
    })

    test('sans élément déclencheur : les deux rendus sont rendus dans l’ordre du DOM', () => {
      const row = fakeTrigger('TR')
      const card = fakeTrigger('DIV')

      assert.deepEqual(resolveTriggers(fakeRoot([row, card]), 'abc', null), [row, card])
    })

    test('racine absente : liste vide, aucun plantage', () => {
      assert.deepEqual(resolveTriggers(null, 'abc', null), [])
      assert.deepEqual(resolveTriggers(undefined, 'abc', null), [])
    })

    test('le déclencheur hors des correspondances est conservé en tête', () => {
      const row = fakeTrigger('TR')
      const other = fakeTrigger('DIV')

      assert.deepEqual(resolveTriggers(fakeRoot([row]), 'abc', other), [other, row])
    })

    test('pas de doublon quand le déclencheur est aussi une correspondance', () => {
      const row = fakeTrigger('TR')

      assert.deepEqual(resolveTriggers(fakeRoot([row]), 'abc', row), [row])
    })

    /**
     * Ronde 4 : les premiers tests laissaient `fakeRoot` ignorer son argument,
     * donc retirer `${leadId}` du sélecteur restait vert. Le sélecteur est la
     * partie qui décide *quels* rendus sont candidats : on l'épingle.
     */
    test('interroge le sélecteur de la demande, pas un attribut nu', () => {
      const selectors: string[] = []
      const row = fakeTrigger('TR')
      const card = fakeTrigger('DIV')

      resolveTriggers(fakeRoot([row, card], selectors), 'abc', null)

      assert.deepEqual(
        selectors,
        ['[data-detail-trigger="abc"]'],
        'the query must be scoped to the lead id'
      )
    })

    test('un rendu d’une autre demande n’est jamais retenu', () => {
      // Le leurre porte le même attribut mais pas le même id : il ne doit pas
      // entrer dans les candidats de restitution du focus. Le faux `root`
      // simule le filtrage du DOM, donc retirer `${leadId}` fait apparaître le
      // leurre et tomber l'assertion.
      const own = fakeTrigger('TR')
      const decoy = fakeTrigger('DIV')
      const root = {
        querySelectorAll: (selector: string) => (selector.includes('"abc"') ? [own] : [own, decoy])
      } as unknown as ParentNode

      assert.deepEqual(
        resolveTriggers(root, 'abc', null),
        [own],
        'another lead must never become a focus target'
      )
    })
  })
})

describe('0-33 — Admin Waitlist Panel — action matrix (AC-6)', () => {
  test('pending → 3 actions: contacted, onboarded, declined (verbatim)', () => {
    const actions = computeActionsForStatus('pending')
    assert.equal(actions.length, 3)
    assert.deepEqual(
      actions.map(a => a.label),
      ['Marquer contacté', 'Marquer onboardé', 'Décliner']
    )
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['contacted', 'onboarded', 'declined']
    )
  })

  test('contacted → 3 actions: onboarded, pending (rollback), declined', () => {
    const actions = computeActionsForStatus('contacted')
    assert.equal(actions.length, 3)
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['onboarded', 'pending', 'declined']
    )
    assert.equal(actions[1].label, 'Repasser en attente')
  })

  test('onboarded → 2 actions: contacted (rollback), declined', () => {
    const actions = computeActionsForStatus('onboarded')
    assert.equal(actions.length, 2)
    assert.deepEqual(
      actions.map(a => a.nextStatus),
      ['contacted', 'declined']
    )
    assert.equal(actions[0].label, 'Repasser en contacté')
  })

  test('declined → only 1 action: pending (revive)', () => {
    const actions = computeActionsForStatus('declined')
    assert.equal(actions.length, 1)
    assert.equal(actions[0].nextStatus, 'pending')
    assert.equal(actions[0].label, 'Repasser en attente')
  })

  test('statusBadgeClasses returns distinct color tokens per status', () => {
    const seen = new Set([
      statusBadgeClasses('pending'),
      statusBadgeClasses('contacted'),
      statusBadgeClasses('onboarded'),
      statusBadgeClasses('declined')
    ])
    assert.equal(seen.size, 4, 'each status must have a distinct badge color')
  })
})

describe('0-33 — Admin Waitlist Panel — optimistic reconciliation (AC-6)', () => {
  test('reconcileLead replaces the lead matching id and preserves order', () => {
    type LeadShape = { id: string, status: 'pending' | 'contacted' }
    const list: LeadShape[] = [
      { id: 'a', status: 'pending' },
      { id: 'b', status: 'pending' },
      { id: 'c', status: 'pending' }
    ]
    const updated: LeadShape = { id: 'b', status: 'contacted' }
    const next = reconcileLead(list, updated)
    assert.equal(next.length, 3)
    assert.equal(next[1].status, 'contacted')
    assert.equal(next[0].status, 'pending')
    assert.equal(next[2].status, 'pending')
    assert.notEqual(next, list, 'must return a new array (no mutation)')
  })

  test('reconcileLead is a no-op when id is not present', () => {
    type LeadShape = { id: string, status: 'pending' | 'contacted' }
    const list: LeadShape[] = [{ id: 'a', status: 'pending' }]
    const next = reconcileLead(list, { id: 'b', status: 'contacted' } as LeadShape)
    assert.equal(next.length, 1)
    assert.equal(next[0].status, 'pending')
  })
})

describe('0-33 — Panel source wiring (AC-6, A31 wording verbatim)', () => {
  test('toast on success uses the wording "Statut mis à jour" verbatim (A31)', () => {
    const source = readPanel()
    assert.ok(
      /title:\s*'Statut mis à jour'/.test(source),
      'Success toast title MUST be the AC wording verbatim — any paraphrase regresses A31'
    )
  })

  test('toast on failure uses the wording "Impossible de mettre à jour le statut" verbatim', () => {
    const source = readPanel()
    assert.ok(
      /title:\s*'Impossible de mettre à jour le statut'/.test(source),
      'Failure toast title MUST be the AC wording verbatim'
    )
  })

  test('panel uses computeActionsForStatus helper (DRY across panel + tests)', () => {
    const source = readPanel()
    assert.match(
      source,
      /computeActionsForStatus\(lead\.status\)/,
      'panel must build actions from the shared helper'
    )
  })

  test('panel renders DsEmptyState when isEmpty (AC-6 empty state)', () => {
    const source = readPanel()
    assert.match(source, /AtomsDsEmptyState[\s\S]*?icon="i-lucide-list"/)
    assert.match(source, /v-else-if="isEmpty"/)
  })

  test('panel renders DsErrorState with @retry → fetchInitial (AC-6 error state)', () => {
    const source = readPanel()
    assert.match(source, /AtomsDsErrorState/)
    assert.match(source, /@retry="fetchInitial"/)
  })

  test('"Charger plus" button is wired to loadMore (AC-6 pagination)', () => {
    const source = readPanel()
    assert.match(source, /@click="loadMore"/)
    assert.ok(source.includes('Charger plus'))
  })

  test('Codex F6 — status pills use filterPillClasses() helper (no inline classes)', () => {
    const source = readPanel()
    assert.match(source, /filterPillClasses\(statusFilter === opt\.value/)
    // The previous inline pill className must be gone.
    const removedPillClass
      = 'border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-elevated)] text-[color:var(--color-brand-secondary)] hover:border-[color:var(--color-brand-primary)] hover:text-[color:var(--color-brand-primary)]'
    assert.ok(
      !source.includes(removedPillClass),
      'Status pill inline class strings must be removed in favor of filterPillClasses()'
    )
  })

  test('Codex F6 — specialty filter is a <USelect> (not a native <select>)', () => {
    const source = readPanel()
    assert.match(source, /<USelect[\s\S]*?id="specialtyFilter"/)
    assert.ok(
      !/<select\s+id="specialtyFilter"/.test(source),
      'Native <select> must be replaced by USelect'
    )
  })

  test('Codex F5 — error toast is sticky (duration: 0)', () => {
    const source = readPanel()
    // Confirm the error toast carries `duration: 0` (no auto-close).
    const errorToastBlock = source.match(/title:\s*'Impossible de mettre à jour le statut',[\s\S]*?\}\)/)
    assert.ok(errorToastBlock, 'Error toast block must exist')
    assert.match(errorToastBlock![0], /duration:\s*0/)
  })

  test('desktop table keeps the AC column wording "Nom complet"', () => {
    const source = readPanel()
    assert.ok(source.includes('Nom complet'))
  })
})

describe('0-33 — tools.vue slot wiring (AC-8)', () => {
  test('slot #waitlist renders <OrganismsAdminWaitlistPanel /> (no placeholder)', () => {
    const source = readToolsPage()
    assert.match(source, /<template #waitlist>[\s\S]*?<OrganismsAdminWaitlistPanel \/>/)
  })

  test('previous placeholder "Cette section sera bientôt disponible" is removed', () => {
    const source = readToolsPage()
    assert.ok(
      !source.includes('Cette section sera bientôt disponible'),
      'AC-8: the placeholder copy must be removed from tools.vue'
    )
  })

  test('UTabs parent retains :unmount-on-hide="false" (Convention DS4)', () => {
    const source = readToolsPage()
    assert.match(source, /:unmount-on-hide="false"/)
  })
})
