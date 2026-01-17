// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Ignore lyvia-api checkout in CI (different eslint rules)
    ignores: ['lyvia-api/**']
  }
)
