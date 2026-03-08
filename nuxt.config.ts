/* eslint-disable nuxt/nuxt-config-keys-order */
// https://nuxt.com/docs/api/configuration/nuxt-config
declare const process: { env: Record<string, string | undefined> }

export default defineNuxtConfig({
  modules: [
    '@nuxt/eslint',
    '@nuxt/ui',
    '@nuxtjs/seo'
  ],

  site: {
    url: process.env.NUXT_PUBLIC_SITE_URL || 'https://kaora.fr',
    name: 'Kaora'
  },

  ogImage: { enabled: false },
  schemaOrg: { enabled: false },
  linkChecker: { enabled: false },
  robots: { enabled: false },

  // Kaora Design System: Disable color mode entirely (light only)
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
      // Platform domain for tenant resolution (e.g., 'kaora.app').
      // Requests from this domain (or subdomains) show the marketing landing page.
      // Other domains are treated as white-label coach sites.
      platformDomain: process.env.NUXT_PUBLIC_PLATFORM_DOMAIN || 'kaora.app'
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
    '/coach/**': {
      headers: { 'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=3600' }
    },
    '/legal/**': {
      prerender: true,
      headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=86400' }
    },
    '/client/**': { ssr: false },
    '/provider/**': { ssr: false },
    '/admin/**': { ssr: false }
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
