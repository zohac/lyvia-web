import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { parse } from 'yaml'
import ts from 'typescript'

/**
 * Contrat croisé du formulaire d'accès : `openapi.yaml` (source de vérité
 * du contrat API) ↔ champs réellement relayés par le web.
 *
 * POURQUOI ICI ET PAS DANS `test:unit` : le fichier `openapi.yaml` n'est pas
 * disponible dans le job de tests de la CI (checkout partiel, et absent pour
 * Dependabot). Un test qui l'exigeait y échouerait — ou, pire, serait `skip`
 * en silence, ce qui laisse la divergence invisible. Le contrôle vit donc
 * dans le stage de contrat, qui est correctement approvisionné.
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
    'contract:check: waitlist — contrat API introuvable '
    + `(cherché dans : ${contractCandidates.join(', ')}). `
    + 'Le contrôle croisé ne peut pas être silencieusement ignoré.'
  )
  process.exitCode = 1
} else {
  try {
    const document = parse(contract.source)
    const schema = document.components?.schemas?.RegisterWaitlistDto
    assert.ok(schema?.properties, 'RegisterWaitlistDto absent du contrat API')
    assert.ok(Array.isArray(schema.required), 'RegisterWaitlistDto sans liste `required`')

    // Les champs réellement relayés sont lus dans le module partagé, pas recopiés :
    // une constante dupliquée dans ce script ne prouverait rien.
    const source = await readFile(path.join(root, 'shared/utils/waitlist-submission.ts'), 'utf8')
    const { outputText } = ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2021 }
    })
    const { WAITLIST_SUBMIT_FIELDS, pickWaitlistValues } = await import(
      `data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`
    )

    const contractFields = Object.keys(schema.properties).sort()
    const relayedFields = [...WAITLIST_SUBMIT_FIELDS].sort()
    assert.deepEqual(
      contractFields,
      relayedFields,
      `Divergence RegisterWaitlistDto (${contractFields.join(', ')}) `
      + `/ champs relayés (${relayedFields.join(', ')})`
    )

    // Le champ leurre existe dans le contrat, il est optionnel (une soumission
    // humaine qui l'omet ne doit pas être rejetée en 422) et il est un string.
    assert.equal(schema.properties.website.type, 'string')
    assert.ok(!schema.required.includes('website'), 'Le leurre doit rester optionnel')

    // Le leurre est relayé… et jamais restitué.
    assert.equal(pickWaitlistValues({ website: 'test' }).website, 'test')
    assert.equal('website' in pickWaitlistValues({ website: 'test' }, { replay: true }), false)

    console.log('contract:check: waitlist OK')
  } catch (error) {
    console.error(`contract:check: waitlist — ${error.message}`)
    process.exitCode = 1
  }
}
