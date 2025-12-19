import fs from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'

function fail(message) {
  process.stderr.write(`contract:check: ${message}\n`)
  process.exitCode = 1
}

function assertIncludes(haystack, needle, message) {
  if (!haystack.includes(needle)) {
    fail(message)
  }
}

function assertMatches(haystack, pattern, message) {
  if (!pattern.test(haystack)) {
    fail(message)
  }
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const webRoot = path.resolve(__dirname, '..')
const apiOpenApiPath = path.resolve(webRoot, '..', 'lyvia-api', 'openapi.yaml')
const frontAuthContractPath = path.resolve(
  webRoot,
  'app',
  'features',
  'auth',
  'api',
  'auth.contract.ts'
)
const frontApiErrorPath = path.resolve(webRoot, 'app', 'services', 'api', 'api-error.ts')
const backAuthErrorsPath = path.resolve(
  webRoot,
  '..',
  'lyvia-api',
  'src',
  'features',
  'auth',
  'domain',
  'errors.ts'
)

const [openapiYaml, authContractTs, apiErrorTs, backAuthErrorsTs]
  = await Promise.all([
    fs.readFile(apiOpenApiPath, 'utf8'),
    fs.readFile(frontAuthContractPath, 'utf8'),
    fs.readFile(frontApiErrorPath, 'utf8'),
    fs.readFile(backAuthErrorsPath, 'utf8')
  ])

const requiredPaths = [
  '/auth/login:',
  '/auth/refresh:',
  '/auth/logout:',
  '/auth/me:',
  '/auth/forgot-password:',
  '/auth/reset-password:'
]

for (const endpoint of requiredPaths) {
  assertIncludes(openapiYaml, endpoint, `missing endpoint in openapi.yaml: ${endpoint}`)
}

assertIncludes(
  openapiYaml,
  'ErrorResponseDto:',
  'missing ErrorResponseDto schema in openapi.yaml'
)
assertIncludes(
  openapiYaml,
  'ResetPasswordResponseDto:',
  'missing ResetPasswordResponseDto schema in openapi.yaml'
)
assertIncludes(
  openapiYaml,
  'sessionsRevoked:',
  'ResetPasswordResponseDto must contain sessionsRevoked in openapi.yaml'
)

assertMatches(
  authContractTs,
  /export type ResetPasswordResponse\s*=\s*\{[\s\S]*sessionsRevoked:\s*boolean[\s\S]*\}/m,
  'front ResetPasswordResponse must include sessionsRevoked: boolean'
)

assertMatches(
  authContractTs,
  /export type LoginResponse\s*=\s*\{[\s\S]*accessToken:\s*string[\s\S]*expiresInSeconds:\s*number[\s\S]*user:\s*AuthUser[\s\S]*redirect:\s*\{\s*path:\s*string\s*\}[\s\S]*\}/m,
  'front LoginResponse must include accessToken, expiresInSeconds, user, redirect.path'
)

assertMatches(
  authContractTs,
  /export type ForgotPasswordResponse\s*=\s*\{[\s\S]*accepted:\s*boolean[\s\S]*resetToken\?:\s*string[\s\S]*expiresAt\?:\s*string[\s\S]*\}/m,
  'front ForgotPasswordResponse must include accepted and optional resetToken/expiresAt'
)

const backendAuthCodes = Array.from(
  new Set(
    Array.from(backAuthErrorsTs.matchAll(/:\s*'([A-Z0-9_]+)'\s*,/g)).map(
      match => match[1]
    )
  )
)

if (backendAuthCodes.length === 0) {
  fail('unable to extract AuthErrorCode values from backend errors.ts')
} else {
  for (const code of backendAuthCodes) {
    assertIncludes(
      apiErrorTs,
      `'${code}'`,
      `front api-error.ts must reference backend auth error code: ${code}`
    )
  }
}

if (process.exitCode === 1) {
  process.stderr.write(
    `Files checked:\n- ${apiOpenApiPath}\n- ${frontAuthContractPath}\n- ${frontApiErrorPath}\n- ${backAuthErrorsPath}\n`
  )
}
