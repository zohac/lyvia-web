/**
 * Derive the `tags.tenant` value for a Sentry event from the browser host.
 *
 * The tenant tag carries the **domain** (`keova.fr`, `sophiejouan.fr`), never
 * an identity. A forged or malformed `Host` must collapse to `unknown` so that
 * it cannot explode tag cardinality or leak a slug/provider/user.
 */
export const UNKNOWN_TENANT = 'unknown'

const HOSTNAME_RE
  = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}$/i

export function resolveTenantTag(host: string | null | undefined): string {
  if (typeof host !== 'string' || host.trim() === '') return UNKNOWN_TENANT
  const hostname = (host.split(':')[0] ?? '').trim().toLowerCase()
  if (hostname === '' || !HOSTNAME_RE.test(hostname)) return UNKNOWN_TENANT
  return hostname
}
