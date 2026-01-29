# lyvia-web

Frontend Nuxt 4 pour la plateforme Kaora (coaching).

## Prérequis

- Node.js 20+
- pnpm 9+
- Docker (pour le développement avec l'API)

## Installation

```bash
pnpm install
cp .env.example .env  # puis remplir les valeurs
```

## Développement

```bash
# Avec Docker (recommandé, depuis la racine du monorepo)
docker compose up -d --build web

# Sans Docker (API doit tourner séparément)
pnpm dev
```

## Variables d'environnement

Copier `.env.example` vers `.env` et configurer les variables.

### Variables publiques (exposées au navigateur)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NUXT_PUBLIC_API_BASE_URL` | URL de base API côté client (relative, proxifiée par Nitro) | `/api` |
| `NUXT_PUBLIC_PLATFORM_DOMAIN` | Domaine plateforme pour la résolution de tenant. Les requêtes depuis ce domaine affichent la landing marketing. Les autres domaines sont traités comme sites coach en marque blanche. | `kaora.app` |
| `NUXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe pour Stripe.js/Elements | `pk_test_xxx` |
| `NUXT_PUBLIC_SENTRY_DSN` | DSN Sentry pour le tracking d'erreurs (optionnel) | `https://xxx@sentry.io/xxx` |

### Variables serveur (Nitro uniquement)

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NUXT_API_BASE_URL` | URL upstream de l'API (utilisée par le proxy Nitro) | `http://api:3001` |

### Configuration par environnement

| Environnement | `NUXT_API_BASE_URL` | `NUXT_PUBLIC_PLATFORM_DOMAIN` |
|---------------|---------------------|-------------------------------|
| Docker local | `http://api:3001` | `kaora.app` |
| Staging (Vercel) | `https://kaora-api.osc-fr1.scalingo.io` | `lyvia-web.vercel.app` |
| Production | `https://api.kaora.app` | `kaora.app` |

## Design System — "Velvet Wisdom"

- Tokens & styles globaux : `app/assets/css/main.css`
- Mapping couleurs Nuxt UI (`primary`/`neutral`) : `app.config.ts`
- Chargement des polices (Manrope / Fraunces) : `nuxt.config.ts`

## Scripts

```bash
pnpm dev          # Serveur de développement
pnpm build        # Build production
pnpm preview      # Preview du build
pnpm lint         # Lint avec ESLint
pnpm typecheck    # Vérification TypeScript
pnpm test:unit    # Tests unitaires
pnpm contract:check  # Validation contrat OpenAPI
```

## Architecture

```
app/
├── assets/css/       # Tokens CSS, design system
├── components/       # Composants (atoms, molecules, organisms, templates)
├── features/         # Logique métier par domaine
├── layouts/          # Layouts Nuxt
├── pages/            # Routes (file-based routing)
├── plugins/          # Plugins Nuxt
└── services/api/     # Client API (apiFetch)
server/
└── api/              # Routes proxy Nitro
```
