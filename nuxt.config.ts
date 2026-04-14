/* eslint-disable nuxt/nuxt-config-keys-order */
// https://nuxt.com/docs/api/configuration/nuxt-config
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    ['@nuxt/fonts', {
      families: [
        { name: 'Manrope', preload: true },
        { name: 'Fraunces', preload: true }
      ]
    }],
    '@nuxtjs/seo',
    '@nuxtjs/critters'
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://keova.fr',
    name: 'Keova',
    defaultLocale: 'fr'
  },

  ogImage: {
    enabled: true,
    defaults: {
      width: 1200,
      height: 630
    }
  },
  schemaOrg: { enabled: true },
  linkChecker: { enabled: false },
  robots: { enabled: false },
  sitemap: {
    cacheMaxAgeSeconds: 3600,
    excludeAppSources: true,
    sources: ['/api/__sitemap__/urls'],
    xslColumns: [
      { label: 'URL', width: '65%' },
      { label: 'Last Modified', select: 'sitemap:lastmod', width: '20%' },
      { label: 'Priority', select: 'sitemap:priority', width: '15%' }
    ]
  },

  // Keova Design System: Disable color mode entirely (light only)
  ui: {
    colorMode: false
  },

  devtools: {
    enabled: process.env.NODE_ENV === 'development'
  },

  vite: {
    // Dev-only: allow accessing Nuxt via custom local domains (e.g. `*.test`)
    // without Vite host-check returning 403.
    server: {
      allowedHosts: ['localhost', '127.0.0.1', '.test', '.fr']
    }
  },

  app: {
    head: {
      htmlAttrs: { lang: 'fr' },
      meta: [
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:site_name', content: 'Keova' },
        { property: 'og:image', content: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://keova.fr'}/images/og-default.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' }
      ],
      // Google Fonts links removed — @nuxt/fonts handles self-hosting automatically
      link: []
    }
  },

  runtimeConfig: {
    // Server-only upstream for Nitro proxy `/api/**`.
    // Never fall back to the public runtime config (can be relative like `/api`).
    apiBase: process.env.NUXT_API_BASE_URL || 'http://localhost:3001',
    public: {
      apiBase: process.env.NUXT_PUBLIC_API_BASE_URL || '/api',
      // Platform domain for tenant resolution (e.g., 'keova.fr').
      // Requests from this domain (or subdomains) show the marketing landing page.
      // Other domains are treated as white-label coach sites.
      platformDomain: process.env.NUXT_PUBLIC_PLATFORM_DOMAIN || 'keova.fr',
      // B2B platform domain (e.g., 'keova.app'). When set, enables tri-modal
      // domain context: B2C (platformDomain) / B2B (this) / white-label.
      platformDomainB2B: process.env.NUXT_PUBLIC_PLATFORM_DOMAIN_B2B || ''
    }
  },

  routeRules: {
    '/**': {
      headers: {
        'Referrer-Policy': 'strict-origin-when-cross-origin',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
        'X-Powered-By': ''
        // Note: CSP Report-Only retiré (YC2.2 console cleanup) — la politique
        // Report-Only sans `report-uri`/`report-to` est purement informationnelle
        // (ne bloque rien, ne remonte rien) et génère un warning navigateur.
        // Quand un endpoint de reporting sera prêt (Sentry CSP reports ou
        // équivalent), réactiver via la propriété `reportTo` d'un header
        // `Content-Security-Policy` enforcing, pas Report-Only.
      }
    },
    // Static images: immutable cache (Y2.5 AC-3)
    '/images/**': {
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' }
    },
    // Home page is host-dependent (platform marketing vs white-label tenant),
    // so it must stay dynamic at runtime.
    '/': {
      prerender: false,
      headers: { 'Cache-Control': 's-maxage=60, stale-while-revalidate=300' }
    },
    // Auth pages: noindex (no SEO value, user-specific)
    '/login': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/reset-password': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/verify-email': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/forgot-password/**': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    // Note: /onboarding/discovery is indexable on white-label (coach booking page).
    // On platform, robots.txt already blocks it. No noindex routeRule needed.
    '/coach/**': {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
    },
    // OG image generation route (Satori) — cache 1h, revalidate 24h (Story U1.3)
    '/__og_image__/**': {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    },
    '/legal/**': {
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' }
    },
    '/client/payments': { redirect: { to: '/client/account?tab=paiements', statusCode: 301 } },
    '/client/settings': { redirect: { to: '/client/account?tab=preferences', statusCode: 301 } },
    '/client/content': { redirect: { to: '/client/dashboard', statusCode: 301 } },
    '/client/**': { ssr: false },
    '/provider/**': { ssr: false },
    '/admin/analytics': { redirect: { to: '/admin/tools?tab=analytics', statusCode: 301 } },
    '/admin/logs': { redirect: { to: '/admin/tools?tab=logs', statusCode: 301 } },
    '/admin/business-logs': { redirect: { to: '/admin/tools?tab=logs', statusCode: 301 } },
    '/admin/notification-logs': { redirect: { to: '/admin/tools?tab=notifications', statusCode: 301 } },
    '/admin/**': { ssr: false }
  },

  nitro: {
    // Force-inline unhead into the server bundle.
    // Without this, Nitro externalizes it to .output/server/node_modules/
    // which gets stripped by Scalingo's "Pruning devDependencies" step.
    externals: {
      inline: ['unhead']
    }
  },

  compatibilityDate: '2025-01-15',

  eslint: {
    config: {
      stylistic: {
        commaDangle: 'never',
        braceStyle: '1tbs'
      }
    }
  }
})
