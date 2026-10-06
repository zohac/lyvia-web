/**
 * Harness de rendu SFC réel pour `node --test`.
 *
 * Pourquoi ce fichier existe (action de rétro E-11) : le dépôt tourne sur
 * `node --test` + `tsc -p tsconfig.tests.json`, sans `vitest`,
 * `@vue/test-utils` ni `jsdom` — absents du lockfile. Les tests de composants
 * étaient donc des assertions de source texte, ce qui ne prouve rien : une
 * assertion de regex passe sur du markup mort. `LB2-11` est resté ouvert six
 * semaines pour cette raison.
 *
 * Ce harness compile le vrai SFC à la compilation (`@vue/compiler-sfc`), rend son
 * HTML (`@vue/server-renderer`) et renvoie la chaîne. Aucune dépendance de
 * production ajoutée : `vue`, `@vue/compiler-sfc` et `@vue/server-renderer`
 * étaient déjà là pour le build Nuxt ; ils sont désormais **déclarés** en
 * `devDependencies` pour ne plus dépendre du `shamefully-hoist=true` du
 * `.npmrc`. Aucun framework de test n'est ajouté (`vitest`,
 * `@vue/test-utils`, `jsdom` restent absents du lockfile).
 *
 * Le harness **échoue bruyamment**. Sans cela il avale les erreurs et renvoie
 * `"<!---->"` — un `setup` qui lève, un auto-import non stubé ou une erreur de
 * syntaxe de template se réduisent tous au même HTML vide, et toute assertion
 * négative passe alors au vert sans rien prouver. Trois verrous :
 * `compileTemplate().errors` est relancé, `errorHandler` et `warnHandler` de
 * l'app relancent, et un rendu sans aucun élément est une erreur.
 *
 * Quatre obstacles, et leur contournement :
 *
 * 1. `tsc` ne réécrit ni les alias `~/` ni `#shared/` dans le JS émis. Le
 *    `require` shim ci-dessous les résout vers `<repo>/app` et `<repo>/shared`.
 * 2. Les composants Nuxt sont des auto-imports : `USlideover` n'existe pas au
 *    runtime du test. Ils sont enregistrés globalement sur l'app SSR via
 *    `app.component(name, stub)`, ce que fait `resolveComponent()`.
 * 3. Les composables Nuxt (`useToast`…) sont des variables libres : elles
 *    sont injectées comme paramètres de la fonction qui exécute le module.
 * 4. **Deux instances du même module.** Un test qui importe
 *    `app/features/admin/admin-waitlist-helpers` obtient la copie compilée par
 *    `tsc` dans `.tmp/test-dist`. Le SFC, lui, atteint le même module par
 *    `~/features/admin/admin-waitlist-helpers`, que `loadSourceModule`
 *    retranspile à la volée. Les deux chemins ne partagent donc **aucun état** :
 *    une constante, une mémoïsation ou un cache au niveau module serait testé
 *    sur une instance et rendu depuis l'autre, et `options.mocks` ne peut pas
 *    relier les deux — il ne s'applique qu'aux modules importés *par le SFC*.
 *    Sans état au niveau module (donc aujourd'hui : que des fonctions pures),
 *    l'écart est invisible. Le jour où un de ces modules en porte un, il faut
 *    soit le tester à travers le SFC, soit l'extraire d'un module purement
 *    exécuté par le harnais des deux côtés.
 *
 * Ce qui n'est PAS rendu, par construction : `<style>` (sans effet sur le HTML),
 * `onMounted`, les `ref` de template (toujours `null` sous `renderToString`) et
 * tout ce qui exige un navigateur (le chrome de `USlideover` reste couvert par
 * le gate navigateur A-35, pas par ce harness). Un `watch` sur l'état d'un
 * composant ne s'exécute donc jamais : c'est pourquoi les comportements de ces
 * chemins doivent être prouvés par l'invocation directe du handler capturé, pas
 * par le rendu.
 */
import * as fs from 'node:fs'
import * as path from 'node:path'

import { createRequire } from 'node:module'

import * as sfcCompiler from '@vue/compiler-sfc'
import { renderToString } from '@vue/server-renderer'
import * as ts from 'typescript'
import * as Vue from 'vue'

/** Résolution de paquets npm depuis le répertoire de travail du test. */
const nodeRequire = createRequire(path.join(process.cwd(), 'noop.js'))

const REPO_ROOT = process.cwd()

/** Stub de composant Nuxt rendu dans le HTML sous `data-sfc-stub="<name>"`. */
export type ComponentStub = Record<string, unknown>

export interface RenderSfcOptions {
  /** Props passées au composant racine rendu. */
  props?: Record<string, unknown>
  /**
   * Composants Nuxt enregistrés globalement (auto-imports). Un stub qui rend ses
   * slots suffit pour la plupart des assertions ; `data-sfc-stub` permet de
   * retrouver l'emplacement du composant dans le HTML.
   */
  stubs?: Record<string, ComponentStub>
  /**
   * Modules remplacés par un mock, indexés par le specifier écrit dans le
   * source (`'~/features/admin/use-admin-waitlist'`) ou par le chemin absolu
   * résolu. Voir `admin-waitlist-detail.test.ts`.
   */
  mocks?: Record<string, unknown>
  /**
   * Composables Nuxt injectés dans le scope du `<script setup>` (`useToast`…).
   * Ce ne sont pas des paramètres du composant : le code compilé les lit comme
   * des variables libres, il faut donc les fournir à l'exécution du module.
   */
  globals?: Record<string, unknown>
  /**
   * Accepte un rendu sans aucun élément. Par défaut `renderSfc` lève : un
   * rendu vide est presque toujours un `setup` qui a échoué, un auto-import
   * non stubé ou une erreur de template — trois cas qui, non interceptés,
   * font passer au vert toute assertion négative.
   */
  allowEmpty?: boolean
}

const transpileOptions: ts.CompilerOptions = {
  module: ts.ModuleKind.CommonJS,
  target: ts.ScriptTarget.ES2021,
  esModuleInterop: true,
  sourceMap: false
}

/**
 * Nuxt/Vite remplace `import.meta` à la compilation ; `tsc` ne le fait pas, et
 * l'exécuter hors module est une `SyntaxError`. On le rebaptise avant
 * transpilation, puis on fournit la valeur au moment de l'exécution du module.
 * `server: true` car le rendu se fait en SSR, comme le vrai Nuxt.
 */
const IMPORT_META_PLACEHOLDER = '__renderSfcImportMeta__'
const importMetaValue = { server: true, client: false }

function transpile(code: string): string {
  const withoutImportMeta = code.replace(/\bimport\.meta\b/g, IMPORT_META_PLACEHOLDER)
  return ts.transpileModule(withoutImportMeta, { compilerOptions: transpileOptions }).outputText
}

/** Résout un specifier vers un chemin de fichier du dépôt, ou `null`. */
function resolveRepoFile(specifier: string, fromDir: string): string | null {
  if (specifier.startsWith('~/')) {
    return resolveWithExtension(path.join(REPO_ROOT, 'app', specifier.slice(2)))
  }
  if (specifier.startsWith('#shared/')) {
    return resolveWithExtension(path.join(REPO_ROOT, 'shared', specifier.slice('#shared/'.length)))
  }
  if (specifier.startsWith('.')) {
    return resolveWithExtension(path.resolve(fromDir, specifier))
  }
  return null
}

function resolveWithExtension(basePath: string): string | null {
  const candidates = [
    `${basePath}.ts`,
    `${basePath}.js`,
    `${basePath}.mjs`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.js')
  ]
  return candidates.find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile()) ?? null
}

interface ModuleScope {
  require(specifier: string): unknown
  cache: Map<string, unknown>
}

function hasKey(record: Record<string, unknown>, key: string): boolean {
  return Object.prototype.hasOwnProperty.call(record, key)
}

/**
 * Charge un module TypeScript du dépôt à l'exécution. `tsc` ne compile que ce
 * que `tsconfig.tests.json` liste dans `include`, donc un composant peut
 * importer un fichier qui n'existe pas dans `.tmp/test-dist` : on transpile
 * alors la source à la volée plutôt que de l'exiger.
 */
function loadSourceModule(filePath: string, mocks: Record<string, unknown>, cache: Map<string, unknown>): unknown {
  const cached = cache.get(filePath)
  if (cached !== undefined) return cached

  const source = fs.readFileSync(filePath, 'utf-8')
  const moduleRecord = { exports: {} as Record<string, unknown> }
  const scope = createScope(path.dirname(filePath), mocks, cache)
  const factory = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    IMPORT_META_PLACEHOLDER,
    transpile(source)
  )
  factory(
    moduleRecord.exports,
    scope.require,
    moduleRecord,
    filePath,
    path.dirname(filePath),
    importMetaValue
  )
  cache.set(filePath, moduleRecord.exports)
  return moduleRecord.exports
}

function createScope(fromDir: string, mocks: Record<string, unknown>, cache: Map<string, unknown>): ModuleScope {
  function scopeRequire(specifier: string): unknown {
    if (hasKey(mocks, specifier)) return mocks[specifier]

    const resolved = resolveRepoFile(specifier, fromDir)
    if (resolved === null) {
      // Paquet npm : `vue` et assimilés. Le SFC compilé n'utilise que `vue`.
      return nodeRequire(specifier)
    }
    if (hasKey(mocks, resolved)) return mocks[resolved]
    return loadSourceModule(resolved, mocks, cache)
  }

  return { require: scopeRequire, cache }
}

/**
 * Compile un SFC en composant Vue exécutable.
 *
 * Le script et le template sont transpilés séparément puis concaténés : le
 * premier exporte `default`, le second déclare une fonction `render` libre. Le
 * rendu de la fonction libre est accroché au composant, et l'objet global `Vue`
 * que `compileTemplate` attend est fourni comme paramètre de la fonction
 * d'exécution du module.
 */
function compileSfc(filePath: string, mocks: Record<string, unknown>, cache: Map<string, unknown>): Vue.Component {
  const source = fs.readFileSync(filePath, 'utf-8')
  const { descriptor, errors } = sfcCompiler.parse(source, { filename: filePath })
  if (errors.length > 0) {
    throw new Error(`SFC parse failed for ${filePath}: ${errors.map(e => e.message).join('; ')}`)
  }
  if (!descriptor.scriptSetup && !descriptor.script) {
    throw new Error(`${filePath} has no <script setup> block`)
  }

  const id = `sfc-${path.basename(filePath)}`
  const scope = createScope(path.dirname(filePath), mocks, cache)

  const script = sfcCompiler.compileScript(descriptor, {
    id,
    babelParserPlugins: ['typescript']
  })

  let renderSource = ''
  if (descriptor.template) {
    const template = sfcCompiler.compileTemplate({
      source: descriptor.template.content,
      filename: filePath,
      id,
      compilerOptions: { mode: 'function', bindingMetadata: script.bindings }
    })
    // Sans ce contrôle, une erreur de syntaxe de template émet du code
    // partiel : le rendu « réussit » et ne couvre qu'une partie du template.
    if (template.errors.length > 0) {
      throw new Error(
        `SFC template compile failed for ${filePath}: `
        + template.errors.map(e => (typeof e === 'string' ? e : e.message)).join('; ')
      )
    }
    renderSource = template.code
  } else {
    throw new Error(`${filePath} has no <template> block — nothing to assert on`)
  }

  const combined = [
    transpile(script.content),
    'const __sfc__ = module.exports.default || module.exports;',
    'const __render__ = (function () {',
    transpile(renderSource),
    'return render;',
    '})();',
    '__sfc__.render = __render__;',
    'module.exports = __sfc__;'
  ].join('\n')

  const moduleRecord = { exports: {} as Record<string, unknown> }
  const globalNames = Object.keys(scopeGlobals)
  const factory = new Function(
    'exports',
    'require',
    'module',
    '__filename',
    '__dirname',
    'Vue',
    IMPORT_META_PLACEHOLDER,
    ...globalNames,
    combined
  )
  factory(
    moduleRecord.exports,
    scope.require,
    moduleRecord,
    filePath,
    path.dirname(filePath),
    Vue,
    importMetaValue,
    ...globalNames.map(name => (scopeGlobals as Record<string, unknown>)[name])
  )
  return moduleRecord.exports as Vue.Component
}

/**
 * Variables libres Nuxt attendues par les `<script setup>` des composants
 * (`useToast`…). Le code compilé les lit comme des globales, pas comme des
 * paramètres du composant : il faut donc les fournir à l'exécution du module.
 * Le jeu est réinitialisé autour de chaque rendu pour que deux tests ne se
 * contaminent pas.
 */
const scopeGlobals: Record<string, unknown> = {}

function clearGlobals(): void {
  for (const name of Object.keys(scopeGlobals)) Reflect.deleteProperty(scopeGlobals, name)
}

/** `true` si le HTML contient au moins un élément (hors commentaires). */
function containsElement(html: string): boolean {
  return /<[a-zA-Z]/.test(html.replace(/<!--[\s\S]*?-->/g, ''))
}

/** Rend le SFC et renvoie le HTML produit. Lève si le rendu a échoué. */
export async function renderSfc(sfcPath: string, options: RenderSfcOptions = {}): Promise<string> {
  const absolutePath = path.isAbsolute(sfcPath) ? sfcPath : path.join(REPO_ROOT, sfcPath)
  const mocks = options.mocks ?? {}
  const cache = new Map<string, unknown>()

  const previousGlobals = { ...scopeGlobals }
  clearGlobals()
  Object.assign(scopeGlobals, options.globals ?? {})

  try {
    const component = compileSfc(absolutePath, mocks, cache)
    const app = Vue.createSSRApp(Vue.defineComponent({
      render: () => Vue.h(component, options.props ?? {})
    }))
    for (const [name, stub] of Object.entries(options.stubs ?? {})) {
      app.component(name, stub as Vue.Component)
    }

    // Un `setup` qui lève devient sinon un `[Vue warn]` non fatal et un rendu
    // vide : c'est exactement le mode de panne qui fait passer au vert des
    // assertions incapables d'échouer.
    const failures: string[] = []
    app.config.errorHandler = (error, _instance, info) => {
      failures.push(`error in ${info}: ${error instanceof Error ? (error.stack ?? error.message) : String(error)}`)
    }
    app.config.warnHandler = (message, _instance, trace) => {
      failures.push(`[Vue warn] ${message}${trace}`)
    }

    const html = await renderToString(app)
    if (failures.length > 0) {
      throw new Error(
        `renderSfc(${sfcPath}) failed:\n- ${failures.join('\n- ')}\n`
        + 'Stub the missing component (options.stubs) or inject the missing composable (options.globals).'
      )
    }
    if (!options.allowEmpty && !containsElement(html)) {
      throw new Error(
        `renderSfc(${sfcPath}) produced no element: ${JSON.stringify(html)}. `
        + 'Pass { allowEmpty: true } only for a component that legitimately renders nothing.'
      )
    }
    return html
  } finally {
    clearGlobals()
    Object.assign(scopeGlobals, previousGlobals)
  }
}
