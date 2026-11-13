import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import ts from 'typescript'

/**
 * Contrat croisé de l'écran **Emails** de l'admin : `openapi.yaml` (source de
 * vérité du contrat API) ↔ types relayés par le web
 * (`app/features/admin/api/admin-emails.contract.ts`).
 *
 * POURQUOI CE CONTRÔLE EXISTE : ce contrat a été livré « verified against
 * OpenAPI spec » dans un commentaire, sans qu'aucun script ne le vérifie —
 * `contract:check` ne couvrait que l'auth, la waitlist et les motifs de
 * notification. Un champ ajouté côté API (ou renommé) laissait donc les deux
 * côtés diverger en silence, et l'écran affiche `undefined`.
 *
 * Le dépôt a déjà produit un `type: object` là où l'API envoyait une `string` :
 * la comparaison porte donc sur les **noms de champs** *et* sur la forme des
 * champs sensibles (`provider` doit porter son enum, pas un objet libre).
 *
 * POURQUOI ICI ET PAS DANS `test:unit` : `openapi.yaml` n'est pas disponible
 * dans le job de tests de la CI (checkout partiel, absent pour Dependabot). Le
 * contrôle vit dans le stage de contrat, correctement approvisionné. Il n'y a
 * pas de `skip` : un contrat absent est un échec.
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
      return { root: candidate, source }
    } catch {
      // Emplacement absent : on essaie le suivant.
    }
  }
  return null
}

/**
 * Champs déclarés par chaque `type X = { … }` du fichier de contrat web, plus
 * les unions de littéraux (`provider`, `status`) qui doivent rester alignées
 * sur les enums de l'API. Le fichier ne porte que des types : il n'est pas
 * importable, il se lit.
 */
async function readWebContractTypes() {
  const source = await readFile(
    path.join(root, 'app/features/admin/api/admin-emails.contract.ts'),
    'utf8'
  )
  const file = ts.createSourceFile('admin-emails.contract.ts', source, ts.ScriptTarget.ES2021, true)
  const types = new Map()
  const literals = new Map()
  const kinds = new Map()

  for (const statement of file.statements) {
    if (!ts.isTypeAliasDeclaration(statement)) continue
    if (!ts.isTypeLiteralNode(statement.type)) continue

    const fields = []
    for (const member of statement.type.members) {
      if (!ts.isPropertySignature(member) || !member.name) continue
      const name = member.name.getText(file)
      fields.push(name)
      if (member.type) {
        kinds.set(`${statement.name.text}.${name}`, webFieldKind(member.type))
      }

      // Union de littéraux chaîne uniquement : `'brevo' | 'mailtrap' | …`.
      if (member.type && ts.isUnionTypeNode(member.type)) {
        const values = member.type.types
          .filter(ts.isLiteralTypeNode)
          .map(literal => literal.literal)
          .filter(ts.isStringLiteral)
          .map(literal => literal.text)
        if (values.length > 0) {
          literals.set(`${statement.name.text}.${name}`, [...values].sort())
        }
      }
    }
    types.set(statement.name.text, fields.sort())
  }

  return { types, literals, kinds }
}

/** `true` pour le `null` d'une union (`string | null`). */
function isNullishTypeNode(node) {
  return node.kind === ts.SyntaxKind.NullKeyword
    || node.kind === ts.SyntaxKind.UndefinedKeyword
    || (ts.isLiteralTypeNode(node) && node.literal.kind === ts.SyntaxKind.NullKeyword)
}

/**
 * Forme **grossière** d'un champ web : `boolean`, `string`, `array`, ou `ref`
 * (un autre type du contrat).
 *
 * Pourquoi : le dépôt a déjà livré un `type: object` là où l'API envoyait une
 * chaîne, et un nom de champ identique ne dit rien de sa forme. Comparer la
 * forme des deux côtés attrape cette classe de divergence ; comparer les noms
 * seuls la laisse passer.
 */
function webFieldKind(node) {
  if (ts.isUnionTypeNode(node)) {
    const concrete = node.types.filter(type => !isNullishTypeNode(type))
    const kinds = new Set(concrete.map(type => webFieldKind(type)))
    // Une union de littéraux (`'tracked' | 'untracked'`) reste une chaîne côté
    // OpenAPI : c'est sa forme qui compte ici, pas son nombre de valeurs.
    return kinds.size === 1 ? [...kinds][0] : 'union'
  }
  if (ts.isTypeOperatorNode(node)) return webFieldKind(node.type)
  if (ts.isArrayTypeNode(node)) return 'array'
  if (ts.isTypeReferenceNode(node)) return 'ref'
  if (node.kind === ts.SyntaxKind.BooleanKeyword) return 'boolean'
  if (node.kind === ts.SyntaxKind.StringKeyword) return 'string'
  if (ts.isLiteralTypeNode(node)) return 'string'
  return 'other'
}

/** Même forme, côté schéma OpenAPI. */
function schemaFieldKind(property) {
  if (property.type === 'boolean') return 'boolean'
  if (property.type === 'string' || Array.isArray(property.enum)) return 'string'
  if (property.type === 'array') return 'array'
  if (property.$ref || property.allOf) return 'ref'
  return 'other'
}

function schemaFields(document, name) {
  const schema = document.components?.schemas?.[name]
  assert.ok(schema?.properties, `schéma ${name} absent du contrat API`)
  return Object.keys(schema.properties).sort()
}

function assertFieldsMatch(webTypes, webKinds, document, webType, schemaName) {
  const webFields = webTypes.get(webType)
  assert.ok(webFields, `type web ${webType} absent de admin-emails.contract.ts`)
  assert.deepEqual(
    webFields,
    schemaFields(document, schemaName),
    `Divergence de champs entre ${webType} (web) et ${schemaName} (API)`
  )

  // Puis la **forme** de chaque champ : un nom identique peut cacher un
  // `string` devenu `object` (défaut déjà livré dans ce dépôt).
  const properties = document.components.schemas[schemaName].properties
  for (const field of webFields) {
    assert.equal(
      webKinds.get(`${webType}.${field}`),
      schemaFieldKind(properties[field]),
      `Forme divergente pour ${webType}.${field} (web) vs ${schemaName}.${field} (API)`
    )
  }
}

const contract = await findContract()
if (!contract) {
  console.error(
    'contract:check: admin-emails — contrat API introuvable '
    + `(cherché dans : ${contractCandidates.join(', ')}). `
    + 'Le contrôle croisé ne peut pas être silencieusement ignoré.'
  )
  process.exitCode = 1
} else {
  try {
    const document = parse(contract.source)
    const { types: webTypes, literals: webLiterals, kinds: webKinds } = await readWebContractTypes()

    // Les trois routes de l'écran existent.
    const catalogue = document.paths?.['/admin/emails']?.get
    assert.ok(catalogue, 'GET /admin/emails absent du contrat API')
    assert.ok(document.paths?.['/admin/emails/activity']?.get, 'GET /admin/emails/activity absent du contrat API')
    assert.ok(document.paths?.['/admin/emails/test']?.post, 'POST /admin/emails/test absent du contrat API')

    // Champ par champ, dans les deux sens : un champ manquant d'un côté comme
    // une faute de frappe sont vus.
    assertFieldsMatch(webTypes, webKinds, document, 'EmailCatalogueEntry', 'AdminEmailCatalogueEntryResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'AdminEmailsActivity', 'AdminEmailsActivityResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'AdminEmailActivityItem', 'AdminEmailActivityItemResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'AdminEmailActivitySend', 'AdminEmailActivitySendResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'AdminEmailActivityFailure', 'AdminEmailActivityFailureResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'SendAdminTestEmailResult', 'SendAdminTestEmailResponseDto')
    assertFieldsMatch(webTypes, webKinds, document, 'SendAdminTestEmailInput', 'SendAdminTestEmailRequestDto')

    // Formes sensibles : un `type: object` là où l'API envoie une chaîne est le
    // défaut que ce dépôt a déjà produit une fois.
    const provider = document.components.schemas.AdminEmailsActivityResponseDto.properties.provider
    assert.equal(provider.type, 'string', '`provider` doit être une string, pas un objet libre')
    assert.deepEqual(
      [...(provider.enum ?? [])].sort(),
      ['brevo', 'console', 'mailtrap'],
      '`provider` doit porter exactement les trois fournisseurs'
    )
    // L'union du web doit valoir exactement l'enum de l'API : une union plus
    // large (`string`) laisserait passer un fournisseur inconnu dans les
    // branches de l'écran sans que rien ne le signale.
    assert.deepEqual(
      webLiterals.get('AdminEmailsActivity.provider'),
      [...provider.enum].sort(),
      'L’union `provider` du web diverge de l’enum de l’API'
    )

    const testStatus = document.components.schemas.SendAdminTestEmailResponseDto.properties.status
    assert.deepEqual(
      webLiterals.get('SendAdminTestEmailResult.status'),
      [...(testStatus.enum ?? [])].sort(),
      'L’union `status` du web diverge de l’enum de l’API'
    )

    const lastSend = document.components.schemas.AdminEmailActivityItemResponseDto.properties.lastSend
    assert.ok(lastSend, '`lastSend` absent du schéma d’activité')

    const sendSimulated = document.components.schemas.AdminEmailActivitySendResponseDto.properties.simulated
    assert.ok(sendSimulated, '`simulated` absent du dernier envoi : CAP-5 exige que la ligne le porte')
    assert.equal(sendSimulated.type, 'boolean', '`simulated` doit être un booléen')

    const testKind = document.components.schemas.SendAdminTestEmailRequestDto.properties.kind
    assert.equal(testKind.type, 'string', '`kind` doit être une string')
    assert.ok(
      Array.isArray(testKind.enum) && testKind.enum.length > 0,
      '`kind` doit porter l’enum des EmailKind'
    )

    // Aucune PII projetée par une réponse : le destinataire n'est jamais
    // renvoyé, même haché, par ces trois routes.
    for (const schemaName of [
      'AdminEmailsActivityResponseDto',
      'AdminEmailActivityItemResponseDto',
      'AdminEmailActivitySendResponseDto',
      'AdminEmailActivityFailureResponseDto',
      'SendAdminTestEmailResponseDto'
    ]) {
      const fields = schemaFields(document, schemaName)
      assert.ok(!fields.includes('recipient'), `\`recipient\` ne doit pas être projeté par ${schemaName}`)
      assert.ok(!fields.includes('toEmail'), `\`toEmail\` ne doit pas être projeté par ${schemaName}`)
    }

    console.log('contract:check: admin-emails OK')
  } catch (error) {
    console.error(`contract:check: admin-emails — ${error.message}`)
    process.exitCode = 1
  }
}
