import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import ts from 'typescript'

/**
 * Contrat croisé des contenus provider : `openapi.yaml` (source de vérité du
 * contrat API) ↔ requêtes réellement émises par le web.
 *
 * POURQUOI ICI ET PAS DANS `test:unit` : `openapi.yaml` n'est pas disponible
 * dans le job de tests de la CI (checkout partiel, absent pour Dependabot). Un
 * test qui l'exigerait échouerait — ou, pire, serait `skip` en silence, ce qui
 * laisse la divergence invisible. Le contrôle vit donc dans le stage de
 * contrat, correctement approvisionné.
 *
 * POURQUOI PAS DE SKIP : un contrat absent est un échec, pas une absence de
 * test. Le script sort en erreur si le contrat n'est pas trouvé.
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
 * Imports a TypeScript module of the web app from the script, so the routes and
 * vocabularies are read from the code under test instead of being recopied
 * here (a constant duplicated in this script would prove nothing).
 */
async function importTsModule(relativePath) {
  const source = await readFile(path.join(root, relativePath), 'utf8')
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 }
  })
  return import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
}

const contract = await findContract()

if (!contract) {
  console.error(
    'contract:check: contents — contrat API introuvable '
    + `(cherché dans : ${contractCandidates.join(', ')}). `
    + 'Le contrôle croisé ne peut pas être silencieusement ignoré.'
  )
  process.exitCode = 1
} else {
  try {
    const document = parse(contract.source)
    const paths = document.paths ?? {}

    const requests = await importTsModule('app/features/contents/api/provider-contents.request.ts')
    const options = await importTsModule('app/features/contents/domain/content-options.ts')

    // 1. Every call the web emits exists in the contract, with the same verb.
    const calls = [
      requests.buildListContentsCall({}),
      requests.buildGetContentCall('id'),
      requests.buildCreateContentCall({ title: 't', type: 'article' }),
      requests.buildUpdateContentCall('id', { title: 't' }),
      requests.buildPublishContentCall('id'),
      requests.buildUnpublishContentCall('id'),
      requests.buildDeleteContentCall('id')
    ]

    for (const call of calls) {
      const operationId = call.path.replace('/provider/content', '').replace(/^\/?/, '/')
      const openApiPath = call.path.replace('/id', '/{id}')
      const pathItem = paths[openApiPath]
      const verb = call.options.method.toLowerCase()

      assert.ok(pathItem, `Le web appelle ${call.path}, absent d'openapi.yaml`)
      assert.ok(
        pathItem[verb],
        `Le web appelle ${verb.toUpperCase()} ${call.path}, absent d'openapi.yaml (${operationId})`
      )
    }

    // 2. The filter vocabularies written on both sides agree.
    const listParameters = paths['/provider/content'].get.parameters ?? []
    const enumOf = (name) => {
      const parameter = listParameters.find(entry => entry.name === name)
      assert.ok(parameter, `Paramètre ${name} absent de GET /provider/content`)
      return parameter.schema?.enum ?? []
    }

    assert.deepEqual(
      [...options.CONTENT_TYPE_OPTIONS.map(option => option.value)].sort(),
      [...enumOf('type')].sort(),
      'Divergence du vocabulaire `type` entre openapi.yaml et content-options.ts'
    )
    assert.deepEqual(
      [...options.CONTENT_STATUS_FILTER_OPTIONS.map(option => option.value)].sort(),
      [...enumOf('status')].sort(),
      'Divergence du vocabulaire `status` entre openapi.yaml et content-options.ts'
    )

    const createType = document.components?.schemas?.CreateContentDto?.properties?.type?.enum ?? []
    assert.deepEqual(
      [...options.CONTENT_TYPE_OPTIONS.map(option => option.value)].sort(),
      [...createType].sort(),
      'Divergence du vocabulaire `type` entre CreateContentDto et content-options.ts'
    )

    const visibilityEnum = document.components?.schemas?.CreateContentDto?.properties?.visibility?.enum ?? []
    assert.deepEqual(
      [...options.CONTENT_VISIBILITY_OPTIONS.map(option => option.value)].sort(),
      [...visibilityEnum].sort(),
      'Divergence du vocabulaire `visibility` entre CreateContentDto et content-options.ts'
    )

    console.log('contract:check: contents — OK')
  } catch (error) {
    console.error(`contract:check: contents — ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
