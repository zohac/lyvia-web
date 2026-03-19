/* eslint-disable nuxt/nuxt-config-keys-order */
// https://nuxt.com/docs/api/configuration/nuxt-config
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxt/image',
    '@nuxtjs/seo'
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://keova.fr',
    name: 'Keova'
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
      allowedHosts: ['localhost', '127.0.0.1', '.test']
    }
  },

  app: {
    head: {
      meta: [
        { property: 'og:locale', content: 'fr_FR' },
        { property: 'og:site_name', content: 'Keova' },
        { property: 'og:image', content: `${process.env.NUXT_PUBLIC_SITE_URL || 'https://keova.fr'}/images/og-default.png` },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:type', content: 'image/png' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=Fraunces:ital,opsz,wght@0,9..144,400;0,9..144,600;0,9..144,700;1,9..144,400;1,9..144,600;1,9..144,700&display=swap'
        }
      ]
    }
  },

  css: ['~/assets/css/main.css'],

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
        'Permissions-Policy': 'camera=(), microphone=(), geolocation=()'
      }
    },
    // Home page is host-dependent (platform marketing vs white-label tenant),
    // so it must stay dynamic at runtime.
    '/': { prerender: false },
    // Auth pages: noindex (no SEO value, user-specific)
    '/login': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/reset-password': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/verify-email': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/forgot-password/**': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    // Generic discovery page without slug — noindex
    '/onboarding/discovery': { headers: { 'X-Robots-Tag': 'noindex,follow' } },
    '/coach/**': {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
    },
    // OG image generation route (Satori) — cache 1h, revalidate 24h (Story U1.3)
    '/__og_image__/**': {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' }
    },
    '/legal/**': {
      prerender: true,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' }
    },
    '/client/**': { ssr: false },
    '/provider/**': { ssr: false },
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
