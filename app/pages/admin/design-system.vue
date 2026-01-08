<template>
  <div class="min-h-screen bg-[color:var(--color-surface-page)] p-8">
    <div class="max-w-7xl mx-auto space-y-12">
      <!-- Header -->
      <header class="text-center mb-12">
        <h1 class="font-serif text-5xl font-bold text-[color:var(--color-brand-primary)] mb-4">
          Kaora Design System
        </h1>
        <p class="text-lg text-[color:var(--color-brand-secondary)] mb-2">
          Validation Nuxt UI v4 — Organic Luxury Theme
        </p>
        <p class="text-sm text-[color:var(--color-brand-muted)]">
          Documentation complète des composants Button avec toutes les variantes et couleurs
        </p>
      </header>

      <!-- Color Matrix: ALL Variants × ALL Colors -->
      <section class="space-y-8">
        <div class="space-y-2">
          <h2 class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">
            Matrice Complète — Boutons
          </h2>
          <p class="text-[color:var(--color-brand-secondary)]">
            6 variantes × 6 couleurs = 36 combinaisons
          </p>
        </div>

        <!-- Primary Color -->
        <ColorVariantSection
          color="primary"
          title="Primary (Stone-900)"
          description="CTA principaux — stone-900 (#1c1917)"
        />

        <!-- Secondary Color -->
        <ColorVariantSection
          color="secondary"
          title="Secondary (Kaora-700)"
          description="Accents de marque — kaora-700 (#7a6251)"
        />

        <!-- Neutral Color -->
        <ColorVariantSection
          color="neutral"
          title="Neutral (Stone)"
          description="Actions neutres — stone palette"
        />

        <!-- Success Color -->
        <ColorVariantSection
          color="success"
          title="Success (Sage Green)"
          description="États positifs — sage green (#b5c0a3)"
        />

        <!-- Warning Color -->
        <ColorVariantSection
          color="warning"
          title="Warning (Amber)"
          description="Alertes — amber tone"
        />

        <!-- Error Color -->
        <ColorVariantSection
          color="error"
          title="Error (Red)"
          description="Erreurs/danger — dark red (#b60010)"
        />

        <!-- Infos Color -->
        <ColorVariantSection
          color="info"
          title="Infos (Blue)"
          description="Infos — blue tone"
        />
      </section>

      <!-- Size Variations -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">
            Tailles de Boutons
          </h2>
          <p class="text-[color:var(--color-brand-secondary)]">
            5 tailles disponibles (xs → xl)
          </p>
        </div>

        <div class="p-8 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
          <div class="flex flex-wrap gap-4 items-center justify-center">
            <UButton color="primary" size="xs">
              Extra Small
            </UButton>
            <UButton color="primary" size="sm">
              Small
            </UButton>
            <UButton color="primary" size="md">
              Medium (défaut)
            </UButton>
            <UButton color="primary" size="lg">
              Large
            </UButton>
            <UButton color="primary" size="xl">
              Extra Large
            </UButton>
          </div>
        </div>
      </section>

      <!-- States (Disabled, Loading) -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">
            États des Boutons
          </h2>
          <p class="text-[color:var(--color-brand-secondary)]">
            Disabled, Loading, Icons
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- Disabled -->
          <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
            <h3 class="font-bold text-[color:var(--color-brand-primary)] mb-4">
              Désactivé (Disabled)
            </h3>
            <div class="space-y-3">
              <UButton color="primary" disabled block>
                Primary Disabled
              </UButton>
              <UButton color="secondary" variant="outline" disabled block>
                Secondary Disabled
              </UButton>
              <UButton color="neutral" variant="soft" disabled block>
                Neutral Disabled
              </UButton>
            </div>
          </div>

          <!-- With Icons -->
          <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
            <h3 class="font-bold text-[color:var(--color-brand-primary)] mb-4">
              Avec Icônes
            </h3>
            <div class="space-y-3">
              <UButton color="primary" block>
                <template #leading>
                  <Icon name="lucide:check" />
                </template>
                Leading Icon
              </UButton>
              <UButton color="secondary" variant="outline" block>
                Trailing Icon
                <template #trailing>
                  <Icon name="lucide:arrow-right" />
                </template>
              </UButton>
              <UButton color="success" variant="soft" block>
                <template #leading>
                  <Icon name="lucide:star" />
                </template>
                Both Icons
                <template #trailing>
                  <Icon name="lucide:chevron-down" />
                </template>
              </UButton>
            </div>
          </div>
        </div>
      </section>

      <!-- Technical Validation -->
      <section class="space-y-6">
        <div class="space-y-2">
          <h2 class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">
            Validation Technique
          </h2>
          <p class="text-[color:var(--color-brand-secondary)]">
            Variables CSS et valeurs calculées
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <!-- CSS Variables -->
          <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
            <h3 class="font-bold text-[color:var(--color-brand-primary)] mb-4">
              Variables CSS
            </h3>
            <div class="font-mono text-xs space-y-2">
              <CssVarDisplay var-name="--ui-primary" label="Primary" />
              <CssVarDisplay var-name="--ui-color-secondary-700" label="Secondary-700" />
              <CssVarDisplay var-name="--color-brand-accent" label="Brand Accent" />
              <CssVarDisplay var-name="--color-accent-main" label="Accent Main" />
            </div>
          </div>

          <!-- Expected Values -->
          <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
            <h3 class="font-bold text-[color:var(--color-brand-primary)] mb-4">
              Valeurs Attendues
            </h3>
            <ul class="space-y-2 text-sm">
              <li class="flex items-start gap-2">
                <span class="text-green-600">✅</span>
                <span class="text-[color:var(--color-brand-secondary)]">
                  Primary = stone-900 (#1c1917)
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-600">✅</span>
                <span class="text-[color:var(--color-brand-secondary)]">
                  Secondary = kaora-700 (#7a6251)
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-600">✅</span>
                <span class="text-[color:var(--color-brand-secondary)]">
                  Texte blanc sur primary solid
                </span>
              </li>
              <li class="flex items-start gap-2">
                <span class="text-green-600">✅</span>
                <span class="text-[color:var(--color-brand-secondary)]">
                  Font-weight: 700 (bold)
                </span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      <!-- Footer -->
      <footer class="text-center pt-8 border-t border-[color:var(--color-border-soft)]">
        <p class="text-sm text-[color:var(--color-brand-muted)]">
          Kaora Design System — Organic Luxury Theme
        </p>
        <p class="text-xs text-[color:var(--color-brand-muted)] mt-2">
          Documentation: docs/03_uiux/kaora/COLOR_SYSTEM.md
        </p>
      </footer>
    </div>
  </div>
</template>

<script setup lang="ts">
/**
 * Kaora Design System — Complete Button Validation Page
 *
 * Displays all button variants (solid, outline, soft, subtle, ghost, link)
 * for all semantic colors (primary, secondary, neutral, success, warning, error).
 *
 * @architecture Clean Architecture — Presentation Layer
 * @author Remy Chopoya
 */

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Design System'
})
</script>

<style scoped>
/* Organic Luxury styling for design system page */
.rounded-\[var\(--radius-lg\)\] {
  border-radius: var(--radius-lg);
}
</style>
