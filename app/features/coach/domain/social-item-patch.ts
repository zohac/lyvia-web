/**
 * CPD.4 — contrat partagé des éditeurs sociaux (témoignages, FAQ).
 *
 * Même raison d'être que `list-item-patch.ts` (CPD.3) : les deux cartes
 * émettent la même forme de modification et la page l'applique avec la même
 * règle. Avant extraction, la page appliquait `patch` par
 * `(item as Record<string, unknown>)[patch.field] = patch.value` : une faute de
 * frappe sur `field` compilait et était avalée en silence, et le cast défaisait
 * le typage de `TestimonialItem`/`FaqItem` (revue CPD.4).
 *
 * `age` est le seul champ optionnel : vider le champ produit `undefined`, jamais
 * `null` — la règle est celle de `list-item-patch.ts`, et `TestimonialItem.age`
 * est déclaré `number | undefined`.
 */
import type { TestimonialItem } from '~/features/account/api/provider-account.contract'
import type { FaqItem } from '~/features/seo/api/public-provider-profile.contract'

interface TestimonialPatchValues {
  quote: string
  firstName: string
  age: number | undefined
  location: string
  rating: number
  result: string
}

export type TestimonialPatch = {
  [K in keyof TestimonialPatchValues]: { index: number, field: K, value: TestimonialPatchValues[K] }
}[keyof TestimonialPatchValues]

export type FaqPatch = { index: number, field: 'label' | 'content', value: string }

/**
 * Applique un patch à une entrée de témoignage. Le `switch` rend une faute de
 * frappe sur `field` impossible à compiler (elle était silencieuse avant).
 */
export function applyTestimonialPatch(item: TestimonialItem, patch: TestimonialPatch): void {
  switch (patch.field) {
    case 'quote':
      item.quote = patch.value
      return
    case 'firstName':
      item.firstName = patch.value
      return
    case 'age':
      item.age = patch.value
      return
    case 'location':
      item.location = patch.value
      return
    case 'rating':
      item.rating = patch.value
      return
    case 'result':
      item.result = patch.value
      return
    default: {
      const exhaustive: never = patch
      void exhaustive
    }
  }
}

/**
 * Applique un patch à l'entrée d'index `patch.index`. Un index hors bornes est
 * un no-op silencieux : une carte peut émettre après une suppression.
 */
export function applyTestimonialPatchAt(items: TestimonialItem[], patch: TestimonialPatch): void {
  const item = items[patch.index]
  if (item) applyTestimonialPatch(item, patch)
}

export function applyFaqPatch(item: FaqItem, patch: FaqPatch): void {
  switch (patch.field) {
    case 'label':
      item.label = patch.value
      return
    case 'content':
      item.content = patch.value
      return
    default: {
      const exhaustive: never = patch.field
      void exhaustive
    }
  }
}

export function applyFaqPatchAt(items: FaqItem[], patch: FaqPatch): void {
  const item = items[patch.index]
  if (item) applyFaqPatch(item, patch)
}
