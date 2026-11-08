/**
 * CPD.5 — contrats de patch des éditeurs de contenu (fit, encadré éducatif).
 *
 * Même raison d'être que `list-item-patch.ts` (CPD.3) et `social-item-patch.ts`
 * (CPD.4) : la carte émet une modification, la page l'applique. Tant que la
 * forme est `{ field: string, value: unknown }` et que l'application se fait par
 * `if / else if` dans le template, une faute de frappe sur `field` compile et
 * est avalée en silence — le `switch` exhaustif ci-dessous rend ce cas
 * impossible à écrire (le `never` le prouve à la compilation).
 */
import type { FitItem } from '~/features/seo/api/public-provider-profile.contract'

export type FitField = 'eyebrow' | 'title'

export interface FitFieldPatch {
  field: FitField
  value: string
}

export type FitItemPatch = {
  index: number
} & (
  | { field: 'type', value: FitItem['type'] }
  | { field: 'text', value: string }
)

export type InsightField = 'title' | 'content'

export interface InsightPatch {
  field: InsightField
  value: string
}

/**
 * Applique un patch à un critère « pour qui ». Le `switch` rend une faute de
 * frappe sur `field` impossible à compiler.
 */
export function applyFitItemPatch(item: FitItem, patch: FitItemPatch): void {
  switch (patch.field) {
    case 'type':
      item.type = patch.value
      return
    case 'text':
      item.text = patch.value
      return
    default: {
      const exhaustive: never = patch
      void exhaustive
    }
  }
}

/**
 * Applique un patch à l'encadré insight. `applyInsightPatch` ne crée pas
 * l'encadré : le store le fait naître avant d'appeler (même règle que
 * `setEducationalInsightTitle`).
 */
export function applyInsightPatch(box: { title?: string, content?: string }, patch: InsightPatch): void {
  switch (patch.field) {
    case 'title':
      box.title = patch.value
      return
    case 'content':
      box.content = patch.value
      return
    default: {
      // `InsightPatch` est une interface, pas une union discriminée : c'est le
      // champ qui se réduit à `never`, pas l'objet.
      const exhaustive: never = patch.field
      void exhaustive
    }
  }
}
