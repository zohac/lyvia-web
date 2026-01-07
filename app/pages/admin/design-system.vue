<template>
  <div class="min-h-screen bg-[color:var(--color-surface-page)] p-8">
    <div class="max-w-4xl mx-auto space-y-8">
      <!-- Header -->
      <div class="text-center mb-12">
        <h1 class="font-serif text-4xl font-bold text-[color:var(--color-brand-primary)] mb-2">
          Design System — Button Validation
        </h1>
        <p class="text-[color:var(--color-brand-secondary)]">
          Vérification de l'alignement Nuxt UI / Kaora Design System
        </p>
      </div>

      <!-- Primary CTA -->
      <section class="space-y-4">
        <h2 class="font-serif text-2xl font-bold text-[color:var(--color-brand-primary)]">
          Primary CTA
        </h2>
        <div class="flex flex-wrap gap-4 items-center p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
          <UButton color="primary" size="xs">
            Très petit CTA
          </UButton>
          <UButton color="primary" size="sm">
            Petit CTA
          </UButton>
          <UButton color="primary" size="md">
            CTA Moyen (défaut)
          </UButton>
          <UButton color="primary" size="lg">
            Grand CTA
          </UButton>
          <UButton color="primary" size="xl">
            Très Grand CTA
          </UButton>
          <UButton color="primary" size="md" disabled>
            CTA Désactivé
          </UButton>
        </div>
      </section>

      <!-- Neutral (should also be stone) -->
      <section class="space-y-4">
        <h2 class="font-serif text-2xl font-bold text-[color:var(--color-brand-primary)]">
          Neutral (Stone)
        </h2>
        <div class="flex flex-wrap gap-4 items-center p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
          <UButton color="neutral" variant="solid" size="md">
            Solid Neutral
          </UButton>
          <UButton color="neutral" variant="outline" size="md">
            Outline Neutral
          </UButton>
          <UButton color="neutral" variant="ghost" size="md">
            Ghost Neutral
          </UButton>
          <UButton color="neutral" variant="soft" size="md">
            Soft Neutral
          </UButton>
        </div>
      </section>

      <!-- Kaora Accent (links/highlights) -->
      <section class="space-y-4">
        <h2 class="font-serif text-2xl font-bold text-[color:var(--color-brand-primary)]">
          Accent Kaora (Liens/Highlights)
        </h2>
        <div class="flex flex-wrap gap-4 items-center p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
          <ULink href="#"  color="primary">
            Lien standard (Kaora)
          </ULink>
          <UButton color="primary" variant="outline" size="md">
            Outline Primary (Kaora border)
          </UButton>
          <UButton color="primary" variant="soft" size="md">
            Soft Primary (Kaora tint)
          </UButton>
        </div>
      </section>

      <!-- Semantic colors -->
      <section class="space-y-4">
        <h2 class="font-serif text-2xl font-bold text-[color:var(--color-brand-primary)]">
          Couleurs Sémantiques
        </h2>
        <div class="flex flex-wrap gap-4 items-center p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)]">
          <UButton color="success" size="md">
            Succès (Sage)
          </UButton>
          <UButton color="warning" size="md">
            Alerte (Amber)
          </UButton>
          <UButton color="error" size="md">
            Erreur (Red)
          </UButton>
        </div>
      </section>

      <!-- Technical validation -->
      <section class="space-y-4">
        <h2 class="font-serif text-2xl font-bold text-[color:var(--color-brand-primary)]">
          Validation Technique
        </h2>
        <div class="p-6 bg-white rounded-[var(--radius-lg)] border border-[color:var(--color-border-soft)] space-y-3">
          <div class="font-mono text-xs space-y-1">
            <p class="text-[color:var(--color-brand-secondary)]">
              <strong class="text-[color:var(--color-brand-primary)]">--ui-primary:</strong>
              <span class="ml-2 px-2 py-1 bg-[color:var(--color-surface-highlight)] rounded">
                {{ getComputedVar('--ui-primary') }}
              </span>
            </p>
            <p class="text-[color:var(--color-brand-secondary)]">
              <strong class="text-[color:var(--color-brand-primary)]">--color-accent-main:</strong>
              <span class="ml-2 px-2 py-1 bg-[color:var(--color-surface-highlight)] rounded">
                {{ getComputedVar('--color-accent-main') }}
              </span>
            </p>
            <p class="text-[color:var(--color-brand-secondary)]">
              <strong class="text-[color:var(--color-brand-primary)]">--color-brand-accent:</strong>
              <span class="ml-2 px-2 py-1 bg-[color:var(--color-surface-highlight)] rounded">
                {{ getComputedVar('--color-brand-accent') }}
              </span>
            </p>
          </div>

          <div class="pt-3 border-t border-[color:var(--color-border-soft)]">
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              ✅ <strong>Attendu:</strong> --ui-primary = --color-accent-main = #1c1917 (stone-900)
            </p>
            <p class="text-sm text-[color:var(--color-brand-secondary)]">
              ✅ <strong>Kaora accent:</strong> --color-brand-accent = #9c826b (kaora-600)
            </p>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Design System'
})
/**
 * Design System Button Validation Page
 *
 * Purpose: Validate that Nuxt UI primary buttons match Kaora design system spec.
 *
 * Expected behavior:
 * - Primary CTA buttons → stone-900 (#1c1917) background
 * - Links/accents → kaora-600 (#9c826b)
 *
 * @author Remy Chopoya
 */

/**
 * Retrieves computed CSS variable value from document root.
 * @param varName - CSS variable name (with -- prefix)
 */
function getComputedVar(varName: string): string {
  if (import.meta.client) {
    return getComputedStyle(document.documentElement).getPropertyValue(varName).trim()
  }
  return 'N/A (SSR)'
}
</script>
