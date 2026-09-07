<script setup lang="ts">
/**
 * Medical disclaimer component for coach pages.
 * Displays a clear disclaimer about the nature of coaching services.
 */
</script>

<template>
  <div class="bg-amber-50 border-l-4 border-amber-500 p-4 my-6">
    <div class="flex items-start">
      <UIcon
        name="i-lucide-alert-triangle"
        class="size-5 text-amber-600 mt-0.5 flex-shrink-0"
      />
      <div class="ml-3">
        <p class="text-sm font-medium text-amber-800">
          Déclaration déontologique
        </p>
        <p class="text-sm text-amber-700 mt-1">
          <span class="font-semibold">L'accompagnement proposé ne se substitue pas à un avis médical.</span>
          Les résultats varient selon chaque situation individuelle et les conseils fournis ne constituent pas un diagnostic médical.
        </p>
        <p class="text-xs text-amber-600 mt-2">
          Ce service est destiné à l'accompagnement et au bien-être. Veuillez consulter un professionnel de santé pour toute question médicale.
        </p>
      </div>
    </div>
  </div>
</template>
