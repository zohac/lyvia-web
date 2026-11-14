import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import ts from 'typescript'

/**
 * Contrat croisé du filtre par type des business logs (em-2b) : `openapi.yaml`
 * ↔ types relayés par le web (`app/features/admin/domain/business-log-event-types.ts`).
 *
 * POURQUOI CE CONTRÔLE EXISTE : depuis em-2b, la taxonomie des familles est
 * servie par l'API et le panneau n'en tient plus de copie. Une divergence sur
 * les noms de champs (`families`, `prefixes`, `prefixLimit`) ou sur la forme
 * de `prefixes` (tableau de chaînes, pas un objet libre) casse l'écran sans
 * qu'aucun test unitaire ne le voie — le web lit une réponse qu'il ne
 * construit pas.
 *
 * POURQUOI ICI ET PAS DANS `test:unit` : `openapi.yaml` n'est pas disponible
 * dans le job de tests de la CI (checkout partiel). Ce contrôle vit dans le
 * stage de contrat, correctement approvisionné, et n'a pas de `skip`.
 */

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

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
      return { source }
    } catch {
      // Emplacement absent : on essaie le suivant.
    }
  }
  return null
}

/** Champs déclarés par chaque `type X = { … }` du module web. */
async function readWebContractTypes() {
  const source = await readFile(
    path.join(root, 'app/features/admin/domain/business-log-event-types.ts'),
    'utf8'
  )
  const file = ts.createSourceFile(
    'business-log-event-types.ts',
    source,
    ts.ScriptTarget.ES2021,
    true
  )
  const types = new Map()

  for (const statement of file.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) continue
    if (!ts.isTypeLiteralNode(statement.type)) continue
    const fields = []
    for (const member of statement.type.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue
      fields.push(member.name.getText(file))
    }
    types.set(statement.name.text, fields.sort())
  }

  return types
}

function schemaFields(document, name) {
  const schema = document.components?.schemas?.[name]
  assert.ok(schema?.properties, `schéma ${name} absent du contrat API`)
  return Object.keys(schema.properties).sort()
}

function assertFieldsMatch(webTypes, document, webType, schemaName) {
  const webFields = webTypes.get(webType)
  assert.ok(webFields, `type web ${webType} absent de business-log-event-types.ts`)
  assert.deepEqual(
    webFields,
    schemaFields(document, schemaName),
    `Divergence de champs entre ${webType} (web) et ${schemaName} (API)`
  )
}

const contract = await findContract()
if (!contract) {
  console.error(
    'contract:check: business-log-families — contrat API introuvable '
    + `(cherché dans : ${contractCandidates.join(', ')}). `
    + 'Le contrôle croisé ne peut pas être silencieusement ignoré.'
  )
  process.exitCode = 1
} else {
  try {
    const document = parse(contract.source)
    const webTypes = await readWebContractTypes()

    const route = document.paths?.['/admin/logs/event-families']?.get
    assert.ok(route, 'GET /admin/logs/event-families absent du contrat API')
    assert.ok(route.security?.length || document.security, 'la route doit être authentifiée')

    assertFieldsMatch(
      webTypes,
      document,
      'BusinessLogEventFamily',
      'AdminBusinessLogEventFamilyResponseDto'
    )
    assertFieldsMatch(
      webTypes,
      document,
      'ExcludedBusinessLogEventFamily',
      'ExcludedBusinessLogEventFamilyResponseDto'
    )
    assertFieldsMatch(
      webTypes,
      document,
      'BusinessLogEventFamiliesResponse',
      'AdminBusinessLogEventFamiliesResponseDto'
    )

    const family = document.components.schemas.AdminBusinessLogEventFamilyResponseDto.properties
    assert.equal(family.prefixes?.type, 'array', '`prefixes` doit être un tableau')
    assert.equal(
      family.prefixes?.items?.type,
      'string',
      '`prefixes` doit être un tableau de chaînes, pas un objet libre'
    )

    const response = document.components.schemas.AdminBusinessLogEventFamiliesResponseDto.properties
    assert.equal(
      response.prefixLimit?.type,
      'number',
      '`prefixLimit` doit être un nombre'
    )
    assert.deepEqual(
      response.families?.items?.$ref,
      '#/components/schemas/AdminBusinessLogEventFamilyResponseDto',
      '`families` doit référencer le schéma de famille'
    )
    assert.deepEqual(
      response.excluded?.items?.$ref,
      '#/components/schemas/ExcludedBusinessLogEventFamilyResponseDto',
      '`excluded` doit référencer le schéma d’exclusion'
    )

    console.log('contract:check: business-log-families OK')
  } catch (error) {
    console.error(`contract:check: business-log-families — ${error.message}`)
    process.exitCode = 1
  }
}
