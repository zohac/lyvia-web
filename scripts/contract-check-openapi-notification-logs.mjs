import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import ts from 'typescript'

/**
 * Contrat croisé des **motifs de notification** : `openapi.yaml` (source de
 * vérité du contrat API) ↔ vocabulaire des motifs côté web.
 *
 * POURQUOI CE CONTRÔLE EXISTE : le vocabulaire des motifs est **fermé**, et il
 * est écrit deux fois — l'enum de l'API (`NOTIFICATION_LOG_REASONS`) et celui
 * du web (`NOTIFICATION_LOG_REASON_VALUES`). Sans contrôle croisé, les deux
 * peuvent diverger :
 *
 * - un motif ajouté **côté web seulement** → l'API répond `422` → **tout** le
 *   panneau des notifications cesse de charger ;
 * - un motif ajouté **côté API seulement** → il n'est pas filtrable depuis le
 *   panneau, et le filtre « motif » du back-office reste muet pour lui.
 *
 * Aucun test unitaire ne peut le voir : le contrat n'est pas disponible dans
 * le job de tests de la CI.
 *
 * POURQUOI ICI ET PAS DANS `test:unit` : même raison que pour le contrôle
 * `waitlist` — le fichier `openapi.yaml` n'est pas disponible dans le job de
 * tests de la CI (checkout partiel, absent pour Dependabot). Le contrôle vit
 * donc dans le stage de contrat, qui est correctement approvisionné.
 *
 * POURQUOI PAS DE SKIP : un contrat absent est un échec, pas une absence de
 * test. Le script sort en erreur si le contrat n'est pas trouvé.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

/**
 * Emplacements possibles du contrat, dans l'ordre :
 * - `LYVIA_API_PATH` : variable posée par la CI et par le harnais local ;
 * - `<web>/lyvia-api` : disposition du checkout CI ;
 * - `/lyvia-api` : montage en lecture seule du conteneur web ;
 * - `<web>/../lyvia-api` : dépôt voisin d'un checkout local (bootstrap).
 */
const contractCandidates = [
  process.env.LYVIA_API_PATH,
  path.resolve(root, 'lyvia-api'),
  '/lyvia-api',
  path.resolve(root, '..', 'lyvia-api')
].filter(Boolean)

async function findContract() {
  for (const candidate of contractCandidates) {
    try {
      const source = await readFile(path.join(candidate, 'openapi.yaml'), 'utf8')
      return { root: candidate, source }
    } catch {
      // Emplacement absent : on essaie le suivant.
    }
  }
  return null
}

const contract = await findContract()
if (!contract) {
  console.error(
    'contract:check: notification-logs — contrat API introuvable '
    + `(cherché dans : ${contractCandidates.join(', ')}). `
    + 'Le contrôle croisé ne peut pas être silencieusement ignoré.'
  )
  process.exitCode = 1
} else {
  try {
    const document = parse(contract.source)

    const listOperation = document.paths?.['/admin/notification-logs']?.get
    assert.ok(listOperation, 'GET /admin/notification-logs absent du contrat API')

    const reasonParameter = (listOperation.parameters ?? []).find(
      parameter => parameter?.name === 'reason'
    )
    assert.ok(reasonParameter, 'le paramètre `reason` est absent du contrat API')
    const parameterEnum = reasonParameter.schema?.enum
    assert.ok(
      Array.isArray(parameterEnum) && parameterEnum.length > 0,
      'le paramètre `reason` ne porte pas d\'enum'
    )

    const listItem = document.components?.schemas?.AdminNotificationLogListItemDto
    assert.ok(listItem?.properties, 'AdminNotificationLogListItemDto absent du contrat API')
    const itemEnum = listItem.properties.reason?.enum
    assert.ok(
      Array.isArray(itemEnum) && itemEnum.length > 0,
      'le champ `reason` de l\'item de liste ne porte pas d\'enum'
    )

    // Les deux enums du contrat doivent être identiques : le filtre porte sur
    // le paramètre, la liste lit le champ.
    assert.deepEqual(
      [...itemEnum].sort(),
      [...parameterEnum].sort(),
      'Divergence entre l\'enum du paramètre `reason` et celui du champ `reason`'
    )

    // Le vocabulaire du web est lu dans le module, pas recopié : une constante
    // dupliquée dans ce script ne prouverait rien.
    const source = await readFile(
      path.join(root, 'app/features/admin/domain/admin-notification-log-filters.ts'),
      'utf8'
    )
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 }
    })
    const { NOTIFICATION_LOG_REASON_VALUES } = await import(
      `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
    )

    const webValues = [...NOTIFICATION_LOG_REASON_VALUES].sort()
    const contractValues = [...parameterEnum].sort()

    assert.deepEqual(
      webValues,
      contractValues,
      `Divergence du vocabulaire des motifs — `
      + `API (${contractValues.join(', ')}) / web (${webValues.join(', ')})`
    )

    console.log('contract:check: notification-logs OK')
  } catch (error) {
    console.error(`contract:check: notification-logs — ${error.message}`)
    process.exitCode = 1
  }
}
