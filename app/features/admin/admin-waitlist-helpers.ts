import type { AdminWaitlistLead, WaitlistStatus } from './api/admin-waitlist.contract'

export interface AdminWaitlistAction {
  label: string
  nextStatus: WaitlistStatus
  icon: string
}

/**
 * Matrix of allowed transitions per status (verbatim from story AC-6).
 * The label MUST match the AC wording — convention A31 ("Wording UI = AC verbatim").
 */
export function computeActionsForStatus(status: WaitlistStatus): AdminWaitlistAction[] {
  switch (status) {
    case 'pending':
      return [
        { label: 'Marquer contacté', nextStatus: 'contacted', icon: 'i-lucide-mail-check' },
        { label: 'Marquer onboardé', nextStatus: 'onboarded', icon: 'i-lucide-user-check' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'contacted':
      return [
        { label: 'Marquer onboardé', nextStatus: 'onboarded', icon: 'i-lucide-user-check' },
        { label: 'Repasser en attente', nextStatus: 'pending', icon: 'i-lucide-rotate-ccw' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'onboarded':
      return [
        { label: 'Repasser en contacté', nextStatus: 'contacted', icon: 'i-lucide-rotate-ccw' },
        { label: 'Décliner', nextStatus: 'declined', icon: 'i-lucide-x-circle' }
      ]
    case 'declined':
      return [
        { label: 'Repasser en attente', nextStatus: 'pending', icon: 'i-lucide-rotate-ccw' }
      ]
  }
}

/**
 * Nom affiché d'un lead.
 *
 * `lastName` est facultatif depuis LB.1 : on ne concatène que ce qui existe,
 * sinon les lecteurs d'écran annoncent « Actions pour Émilie null ». Partagé
 * entre le tableau et la vue de détail — deux copies de cette règle
 * divergeraient, et c'est exactement le cas que LB2-11 a laissé sans test.
 *
 * Le type est dérivé du contrat, pas recopié : un changement de nullabilité
 * côté API casserait ici, à la compilation, au lieu de produire un `undefined`
 * silencieux dans le tableau.
 */
export function fullName(lead: Pick<AdminWaitlistLead, 'firstName' | 'lastName'>): string {
  return lead.lastName ? `${lead.firstName} ${lead.lastName}` : lead.firstName
}

/**
 * Prend la main sur l'autofocus de reka-ui à l'**ouverture** d'un `USlideover`.
 *
 * Sans cela, reka-ui autofocuse le premier élément focusable du panneau — le
 * **bouton fermer** (UX-DR-WA2 veut le titre). On annule donc le défaut, puis
 * on pose le focus sur le titre.
 *
 * Ce helper ne couvre que l'ouverture. La **fermeture** passe par
 * `restoreFocusToTrigger`, qui répond à un problème différent : voir son
 * docblock.
 *
 * Pur et testable sans DOM : on ne touche pas `document` ici.
 *
 * @returns `true` si le focus a été posé, `false` si aucun titre n'était
 *   disponible — l'appelant peut alors laisser le comportement par défaut.
 */
export function focusSlideoverTitle(
  event: { preventDefault: () => void },
  heading: { focus: () => void } | null
): boolean {
  if (!heading) return false
  event.preventDefault()
  heading.focus()
  return true
}

/** Cet élément peut-il recevoir le focus là où il est ? */
function canReceiveFocus(element: HTMLElement): boolean {
  // `display:none` — par exemple la ligne desktop passée en `hidden` quand la
  // fenêtre franchit le point de rupture `md` — laisse `isConnected` vrai :
  // `.focus()` y devient un no-op silencieux et le focus finit sur `body`.
  return element.isConnected && element.offsetParent !== null
}

/**
 * Restitue le focus à la demande qui a ouvert le panneau (AC-2), à la fermeture.
 *
 * Le défaut de reka-ui mémorise `document.activeElement` au montage du
 * `DialogContent`. Or un clic sur la ligne ne la focus pas toujours — mesuré au
 * gate A-35 : `event.currentTarget` est bien le `<tr>` alors que
 * `document.activeElement` vaut encore `body`. Le focus partait donc dans le
 * vide à la fermeture. Le panneau mémorise le(s) déclencheur(s) et on refocuse
 * nous-mêmes, au moment exact où reka restituerait le sien.
 *
 * **Plusieurs candidats, par ordre de préférence.** Une même demande est rendue
 * deux fois — la ligne du tableau desktop (`hidden md:block`) et la carte mobile
 * (`md:hidden`). Après un redimensionnement franchissant `md`, celui qui a
 * déclenché l'ouverture est `display:none` : `isConnected` y reste vrai,
 * `.focus()` y devient un no-op silencieux et le focus finit sur `body`. Viser
 * le premier candidat focusable — donc l'autre rendu — est ce qui tient AC-2
 * (« pas sur le début du document ») sur ce chemin.
 *
 * Si **aucun** candidat n'est focusable — la demande a quitté la liste pendant
 * que le panneau était ouvert — on ne touche à rien et on rend la main à reka,
 * dont le repli est le début du document. C'est la seule issue restante, et elle
 * reste explicitement tracée (`deferred-work.md`, WA.1).
 *
 * @returns `true` si le focus a été rendu, `false` si le défaut de reka reste
 *   en place.
 */
export function restoreFocusToTrigger(
  event: { preventDefault: () => void },
  candidates: ReadonlyArray<HTMLElement | null>
): boolean {
  const target = candidates.find(candidate => candidate !== null && canReceiveFocus(candidate))
  if (!target) return false
  event.preventDefault()
  target.focus()
  return true
}

/**
 * Le clic qui termine une sélection par glissement émet quand même `click` :
 * sans ce garde, l'admin ne peut plus copier un email ou une date hors du
 * tableau, le panneau s'ouvre par-dessus sa sélection.
 *
 * Décision de portée : ce motif n'existe que pour le **glissement**. `Entrée` et
 * `Espace` ne changent pas la sélection — les appliquer là aussi rendait le
 * détail inatteignable au clavier dès qu'une sélection traînait ailleurs dans
 * le document (y compris dans un autre onglet `UTabs` maintenu en vie par
 * `:unmount-on-hide="false"`), sans aucun retour pour l'admin. La fonction
 * reçoit donc la sélection et décide : pure, testable dans les deux sens —
 * c'est ce que la ronde 3 a rendu vérifiable en l'extrayant du panneau, où elle
 * n'était couverte que par une assertion de source.
 *
 * Compromis assumé : surligner ailleurs puis cliquer une ligne sans avoir
 * désélectionné n'ouvre pas le détail. C'est le comportement standard des zones
 * activables entières, et le prix de l'option A.
 */
export function shouldIgnoreClickForSelection(selection: string): boolean {
  return selection !== ''
}

/**
 * Les deux rendus d'une même demande portent `data-detail-trigger="<id>"` :
 * la ligne du tableau desktop et la carte mobile. On les mémorise **tous les
 * deux**, celui qui a reçu l'événement d'abord : après un redimensionnement
 * franchissant `md`, le rendu déclenché devient `display:none` et `.focus()` y
 * est un no-op silencieux qui envoie le focus sur `body`. Sans l'autre
 * candidat, AC-2 (« pas sur le début du document ») ne tient pas.
 *
 * **Testable sans DOM réel** : la racine arrive en paramètre plutôt que d'être
 * lue depuis une ref de composant, donc la fonction s'exécute dans les tests au
 * lieu d'être seulement relue. Elle interroge bien le DOM via `root` — elle
 * n'est donc pas pure au sens strict, seul le filtrage/ordonnancement l'est.
 */
export function resolveTriggers(
  root: ParentNode | null | undefined,
  leadId: string,
  fired: HTMLElement | null
): HTMLElement[] {
  const matches = root?.querySelectorAll<HTMLElement>(`[data-detail-trigger="${leadId}"]`)
  const all = matches ? Array.from(matches) : []
  return fired ? [fired, ...all.filter(element => element !== fired)] : all
}

export function statusBadgeClasses(status: WaitlistStatus): string {
  switch (status) {
    case 'pending':
      return 'bg-amber-50 text-amber-800'
    case 'contacted':
      return 'bg-sky-50 text-sky-800'
    case 'onboarded':
      return 'bg-emerald-50 text-emerald-800'
    case 'declined':
      return 'bg-stone-100 text-stone-700'
  }
}

/**
 * Pure debounce scheduler factory. Returns `schedule(fn, ms)` which clears
 * previous timer and schedules a new one. Exposed so tests can inject a
 * fake timer.
 */
export function createDebouncer() {
  let timer: ReturnType<typeof setTimeout> | null = null
  return {
    schedule(fn: () => void, ms: number): void {
      if (timer) clearTimeout(timer)
      timer = setTimeout(() => {
        timer = null
        fn()
      }, ms)
    },
    cancel(): void {
      if (timer) {
        clearTimeout(timer)
        timer = null
      }
    },
    isPending(): boolean {
      return timer !== null
    }
  }
}

/**
 * Pure reconciliation: replaces the lead matching `id` in `list` with `updated`.
 * Returns a new array (no mutation).
 */
export function reconcileLead<T extends { id: string }>(list: T[], updated: T): T[] {
  return list.map(item => (item.id === updated.id ? updated : item))
}

/**
 * Pure optimistic patch — replaces only the changing status field on the
 * matching lead (preserves the rest of the snapshot, so the UI shows the
 * eventual badge immediately while the API call is in flight). Returns a
 * new array with the patched lead, untouched references otherwise.
 *
 * Codex F4 — the panel applies this BEFORE calling the API; on success it
 * reconciles via `reconcileLead()` with the server payload; on error it
 * restores the original snapshot via `restoreSnapshot()`.
 */
export function applyOptimisticStatus<
  T extends { id: string, status: string }
>(list: T[], id: string, nextStatus: T['status']): T[] {
  return list.map(item =>
    item.id === id ? ({ ...item, status: nextStatus } as T) : item
  )
}

/**
 * Pure restore: swaps the lead at `id` back to its `original` value (used
 * when the optimistic update must be rolled back on API failure).
 */
export function restoreSnapshot<T extends { id: string }>(
  list: T[],
  original: T
): T[] {
  return list.map(item => (item.id === original.id ? original : item))
}
