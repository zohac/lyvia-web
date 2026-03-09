// @ts-check
import withNuxt from './.nuxt/eslint.config.mjs'

export default withNuxt(
  {
    // Ignore lyvia-api checkout in CI (different eslint rules)
    ignores: ['lyvia-api/**']
  },
  {
    // Prevent import patterns that break Nitro/Rollup bundling
    // See: hotfix d165014 — relative imports to shared/ don't survive Rollup compilation
    files: ['app/**/*.{ts,vue}', 'server/**/*.ts'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          {
            group: ['~~/shared/*'],
            message: 'Use #shared/ alias instead of ~~/shared/ — ~~ breaks during Nitro bundling.'
          },
          {
            group: [
              '../shared/*',
              '../../shared/*',
              '../../../shared/*',
              '../../../../shared/*'
            ],
            message: 'Use #shared/ alias in app/ and server/. Relative imports to shared/ only in tests/.'
          }
        ]
      }]
    }
  }
)
