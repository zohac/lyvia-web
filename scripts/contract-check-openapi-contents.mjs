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
    const shareRequests = await importTsModule('app/features/contents/api/content-shares.request.ts')
    const clientRequests = await importTsModule('app/features/contents/api/client-contents.request.ts')
    const platformRequests = await importTsModule('app/features/contents/api/platform-contents.request.ts')
    const options = await importTsModule('app/features/contents/domain/content-options.ts')

    // 1. Every call the web emits exists in the contract, with the same verb.
    //    The OpenAPI path is **derived from the path the builder emits** — a
    //    hardcoded expectation would assert itself instead of the web code
    //    (the first version of this check did exactly that, and a renamed
    //    route still printed "OK").
    const CONTENT_ID = 'contentIdValue'
    const CLIENT_ID = 'clientProfileIdValue'
    const SLUG = 'slugValue'
    const placeholders = { [CONTENT_ID]: '{id}', [CLIENT_ID]: '{clientProfileId}', [SLUG]: '{slug}' }

    function toOpenApiPath(callPath) {
      return callPath
        .split('/')
        .map(segment => placeholders[segment] ?? segment)
        .join('/')
    }

    const calls = [
      requests.buildListContentsCall({}),
      requests.buildGetContentCall(CONTENT_ID),
      requests.buildCreateContentCall({ title: 't', type: 'article' }),
      requests.buildUpdateContentCall(CONTENT_ID, { title: 't' }),
      requests.buildPublishContentCall(CONTENT_ID),
      requests.buildUnpublishContentCall(CONTENT_ID),
      requests.buildDeleteContentCall(CONTENT_ID),
      shareRequests.buildListContentSharesCall(CONTENT_ID),
      shareRequests.buildUnshareContentCall(CONTENT_ID, CLIENT_ID),
      // Story 5.7 — the client reading surface (GET /content, GET /content/{slug}).
      clientRequests.buildListClientContentsCall({}),
      clientRequests.buildGetClientContentCall(SLUG),
      // Story diffusion-8 — the practitioner Articles Keova screen
      // (list, approve, withdraw) reads and writes /provider/platform-content.
      platformRequests.buildListPlatformContentsCall({}),
      platformRequests.buildApprovePlatformContentCall(CONTENT_ID),
      platformRequests.buildWithdrawPlatformApprovalCall(CONTENT_ID),
      // diffusion-14 — the practitioner opens the article's document through an
      // authenticated route, so the button can never be a bare `<a href>`.
      platformRequests.buildDownloadPlatformContentDocumentCall(CONTENT_ID)
    ]

    for (const call of calls) {
      const operationId = call.path.replace('/provider/content', '').replace(/^\/?/, '/')
      const openApiPath = toOpenApiPath(call.path)
      const pathItem = paths[openApiPath]
      const verb = call.options.method.toLowerCase()

      assert.ok(pathItem, `Le web appelle ${call.path}, absent d'openapi.yaml`)
      assert.ok(
        pathItem[verb],
        `Le web appelle ${verb.toUpperCase()} ${call.path}, absent d'openapi.yaml (${operationId})`
      )
    }

    // 2. The sharing body the web sends only carries fields the contract
    //    accepts, and the response fields the screens read exist in the schema.
    const shareBodyProperties = Object.keys(
      document.components?.schemas?.ShareContentDto?.properties ?? {}
    )
    for (const body of [
      shareRequests.buildShareContentCall(CONTENT_ID, { clientProfileIds: ['client'] }).options.body
    ]) {
      for (const field of Object.keys(body)) {
        assert.ok(
          shareBodyProperties.includes(field),
          `Le web envoie \`${field}\` à POST /provider/content/{id}/share, absent de ShareContentDto (${shareBodyProperties.join(', ')})`
        )
      }
    }

    const shareResponseProperties = Object.keys(
      document.components?.schemas?.ShareContentResponseDto?.properties ?? {}
    )
    assert.ok(
      shareResponseProperties.includes('count'),
      'ShareContentResponseDto ne déclare pas `count`, que le web affiche dans le toast'
    )

    const shareItemProperties = Object.keys(
      document.components?.schemas?.ContentShareItemDto?.properties ?? {}
    )
    for (const field of ['clientProfileId', 'firstname', 'lastname', 'sharedAt']) {
      assert.ok(
        shareItemProperties.includes(field),
        `ContentShareItemDto ne déclare pas \`${field}\`, lu par la liste de partages`
      )
    }

    const unshareResponseProperties = Object.keys(
      document.components?.schemas?.UnshareContentResponseDto?.properties ?? {}
    )
    assert.ok(
      unshareResponseProperties.includes('clientProfileId'),
      'UnshareContentResponseDto ne déclare pas `clientProfileId`'
    )

    // 2b. Story 5.7 — every field the client list/detail pages read exists in
    //     the schema they read it from. The pages cannot fail on a renamed
    //     field (TypeScript only sees `contents.contract.ts`), so the contract
    //     is the only place the drift is catchable.
    const clientListItemProperties = Object.keys(
      document.components?.schemas?.ClientContentListItemResponseDto?.properties ?? {}
    )
    for (const field of [
      'id',
      'title',
      'type',
      'slug',
      'coverImageUrl',
      'publishedAt',
      'providerName',
      'providerSlug',
      'source',
      'document'
    ]) {
      assert.ok(
        clientListItemProperties.includes(field),
        `ClientContentListItemResponseDto ne déclare pas \`${field}\`, lu par la liste client`
      )
    }

    const clientDetailProperties = Object.keys(
      document.components?.schemas?.ClientContentDetailResponseDto?.properties ?? {}
    )
    for (const field of [
      'id',
      'title',
      'type',
      'slug',
      'body',
      'coverImageUrl',
      'publishedAt',
      'providerName',
      'providerSlug',
      'source',
      'document'
    ]) {
      assert.ok(
        clientDetailProperties.includes(field),
        `ClientContentDetailResponseDto ne déclare pas \`${field}\`, lu par la page de lecture client`
      )
    }

    const clientListProperties = Object.keys(
      document.components?.schemas?.ListClientContentsResponseDto?.properties ?? {}
    )
    for (const field of ['items', 'nextCursor']) {
      assert.ok(
        clientListProperties.includes(field),
        `ListClientContentsResponseDto ne déclare pas \`${field}\`, lu par la pagination client`
      )
    }

    const clientListParameters = paths['/content']?.get?.parameters ?? []
    const clientTypeEnum = clientListParameters.find(entry => entry.name === 'type')?.schema?.enum ?? []
    assert.deepEqual(
      [...options.CONTENT_TYPE_OPTIONS.map(option => option.value)].sort(),
      [...clientTypeEnum].sort(),
      'Divergence du vocabulaire `type` entre GET /content (openapi.yaml) et content-options.ts'
    )

    // 2c. Story diffusion-14 — the practitioner preview reads the article's
    //     cover, body and (AC4) its attached document. The fields come from
    //     `ProviderPlatformContentResponseDto`; the web screen only sees its own
    //     mirror, so this is where a dropped or renamed `document` is caught.
    const platformItemProperties = Object.keys(
      document.components?.schemas?.ProviderPlatformContentResponseDto?.properties ?? {}
    )
    for (const field of [
      'id',
      'title',
      'body',
      'coverImageUrl',
      'publishedAt',
      'approved',
      'document'
    ]) {
      assert.ok(
        platformItemProperties.includes(field),
        `ProviderPlatformContentResponseDto ne déclare pas \`${field}\`, lu par l'aperçu praticienne`
      )
    }

    const platformDocumentProperties = Object.keys(
      document.components?.schemas?.PlatformContentDocumentResponseDto?.properties ?? {}
    )
    for (const field of ['filename', 'sizeBytes']) {
      assert.ok(
        platformDocumentProperties.includes(field),
        `PlatformContentDocumentResponseDto ne déclare pas \`${field}\`, affiché par l'aperçu praticienne`
      )
    }

    // `document` is nullable on the item: the preview hides the whole block when
    // there is none, and a schema that made it required would describe a payload
    // the API does not send for a document-less article.
    assert.equal(
      document.components?.schemas?.ProviderPlatformContentResponseDto?.properties?.document?.nullable,
      true,
      '`document` de ProviderPlatformContentResponseDto n’est pas nullable : l’aperçu doit pouvoir masquer le bloc'
    )

    // 3. The filter vocabularies written on both sides agree.
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

    const audienceEnum = document.components?.schemas?.CreateContentDto?.properties?.audience?.enum ?? []
    assert.deepEqual(
      [...options.CONTENT_AUDIENCE_OPTIONS.map(option => option.value)].sort(),
      [...audienceEnum].sort(),
      'Divergence du vocabulaire `audience` entre CreateContentDto et content-options.ts'
    )

    // The list's Diffusion filter forwards every non-sentinel value verbatim as
    // `?audience=`. A sentinel such as `audience_all` would be sent as an enum
    // value the API refuses (422) — that is exactly how the filter broke once.
    assert.deepEqual(
      [...enumOf('audience')].sort(),
      [...audienceEnum].sort(),
      'Divergence du vocabulaire `audience` entre GET /provider/content et CreateContentDto'
    )
    for (const option of options.CONTENT_DIFFUSION_FILTER_OPTIONS) {
      if (option.value === 'any') continue
      assert.ok(
        audienceEnum.includes(option.value),
        `Le filtre de diffusion envoie « ${option.value} », absent de l'énumération audience de l'API`
      )
    }

    // 4. Story diffusion-13 — every field the web actually puts in a write body
    //    exists in the schema the ROUTE references, and `documentAssetId` is
    //    nullable there (the web sends `null` to create without a document and
    //    to detach one). Resolving the route's request body — not just a schema
    //    name — means a route repointed at another DTO fails here instead of
    //    shipping a field the server refuses. Comparing the built payload means
    //    the next field added to a builder cannot be missing from the DTO, the
    //    drift this repo has already paid for more than once.
    const payloads = await importTsModule('app/features/contents/domain/content-payload.ts')

    const requestSchema = (route, method, label) => {
      const operation = paths[route]?.[method]
      assert.ok(operation, `${label} absent d'openapi.yaml`)
      const ref = operation.requestBody?.content?.['application/json']?.schema?.$ref
      assert.ok(ref, `${label} ne déclare pas de corps JSON référencé`)
      const name = ref.split('/').pop()
      const schema = document.components?.schemas?.[name]
      assert.ok(schema, `${label} référence ${name}, absent de components.schemas`)
      return { name, schema }
    }

    const originalWithDocument = {
      title: 't',
      type: 'article',
      slug: 't',
      body: null,
      coverImageUrl: null,
      audience: 'all',
      document: { filename: 'programme.pdf', sizeBytes: 2048 }
    }

    const writeBodies = [
      ['POST /provider/content', '/provider/content', 'post',
        payloads.buildCreateContentPayload({
          title: 't',
          type: 'article',
          document: { assetId: 'asset-doc', filename: 'programme.pdf', sizeBytes: 2048 }
        })],
      ['PATCH /provider/content/{id}', '/provider/content/{id}', 'patch',
        payloads.buildUpdateContentPayload({ title: 't', type: 'article', document: null }, originalWithDocument)]
    ]

    for (const [label, route, method, body] of writeBodies) {
      const { name, schema } = requestSchema(route, method, label)
      const properties = schema.properties ?? {}

      for (const field of Object.keys(body)) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(properties, field),
          `${label} : le web envoie \`${field}\`, absent de ${name}`
        )
      }

      assert.ok(
        Object.prototype.hasOwnProperty.call(body, 'documentAssetId'),
        `${label} : le payload web ne porte pas \`documentAssetId\` (diffusion-13)`
      )
      assert.equal(
        properties.documentAssetId.nullable,
        true,
        `\`documentAssetId\` de ${name} n'est pas nullable : le web envoie null pour détacher`
      )
    }

    // 5. Story diffusion-10 — the admin article surface calls /admin/content.
    //    Those routes were not crossed by anything before, so a renamed admin
    //    route or a field dropped from Create/UpdatePlatformContentDto would
    //    ship silently (the web contract only sees its own mirror file).
    //    Only modules without runtime relative imports are imported here: the
    //    loader below cannot resolve `./content-form`, so the payloads are the
    //    exact literal bodies the admin form builders produce for those fields.
    const adminRequests = await importTsModule('app/features/contents/api/admin-contents.request.ts')
    const adminContract = await importTsModule('app/features/contents/api/admin-contents.contract.ts')

    const adminCreateBody = { title: 't', type: adminContract.ADMIN_CONTENT_TYPE, body: 'b' }
    const adminUpdateBody = {
      title: 't',
      body: 'b',
      coverImageUrl: 'https://cdn.example/cover.webp'
    }

    const adminCalls = [
      adminRequests.buildListAdminContentsCall({}),
      adminRequests.buildGetAdminContentCall(CONTENT_ID),
      adminRequests.buildCreateAdminContentCall(adminCreateBody),
      adminRequests.buildUpdateAdminContentCall(CONTENT_ID, adminUpdateBody),
      adminRequests.buildPublishAdminContentCall(CONTENT_ID),
      adminRequests.buildUnpublishAdminContentCall(CONTENT_ID),
      adminRequests.buildDeleteAdminContentCall(CONTENT_ID)
    ]

    for (const call of adminCalls) {
      const openApiPath = toOpenApiPath(call.path)
      const pathItem = paths[openApiPath]
      const verb = call.options.method.toLowerCase()

      assert.ok(pathItem, `Le web admin appelle ${call.path}, absent d'openapi.yaml`)
      assert.ok(
        pathItem[verb],
        `Le web admin appelle ${verb.toUpperCase()} ${call.path}, absent d'openapi.yaml`
      )
    }

    const adminWriteBodies = [
      ['POST /admin/content', '/admin/content', 'post', adminCreateBody],
      ['PATCH /admin/content/{id}', '/admin/content/{id}', 'patch', adminUpdateBody]
    ]

    for (const [label, route, method, body] of adminWriteBodies) {
      const { name, schema } = requestSchema(route, method, label)
      const properties = schema.properties ?? {}
      for (const field of Object.keys(body)) {
        assert.ok(
          Object.prototype.hasOwnProperty.call(properties, field),
          `${label} : le web admin envoie \`${field}\`, absent de ${name}`
        )
      }
    }

    // The type is fixed to `article` on the admin screens; the server rejects
    // anything else, so the two vocabularies must agree exactly.
    const adminTypeEnum
      = document.components?.schemas?.CreatePlatformContentDto?.properties?.type?.enum ?? []
    assert.deepEqual(
      [adminContract.ADMIN_CONTENT_TYPE],
      [...adminTypeEnum],
      'Divergence du type admin entre admin-contents.contract.ts et CreatePlatformContentDto'
    )

    const adminStatusParameters = paths['/admin/content']?.get?.parameters ?? []
    const adminStatusEnum
      = adminStatusParameters.find(entry => entry.name === 'status')?.schema?.enum ?? []
    assert.deepEqual(
      ['all', 'draft', 'published'],
      [...adminStatusEnum].sort(),
      'Divergence du filtre `status` admin entre les pastilles et GET /admin/content'
    )

    console.log('contract:check: contents — OK')
  } catch (error) {
    console.error(`contract:check: contents — ${error instanceof Error ? error.message : String(error)}`)
    process.exitCode = 1
  }
}
