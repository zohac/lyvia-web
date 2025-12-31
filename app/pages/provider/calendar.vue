<script setup lang="ts">
import SystemAlert from '../../components/atoms/SystemAlert.vue'
import { useProviderCalendar } from '../../features/calendar/useProviderCalendar'

definePageMeta({
  layout: 'provider',
  middleware: 'auth-provider',
  pageTitle: 'Calendrier'
})

const noticeMessage = ref<string | null>(null)

const calendar = await useProviderCalendar()

function onCreateAppointment() {
  noticeMessage.value = 'La création manuelle de rendez-vous arrive dans le prochain ticket (Feature L).'
}

async function onRetry() {
  noticeMessage.value = null
  await calendar.refresh({ revalidate: true })
}
const isEmpty = computed(() => calendar.sortedAppointments.value.length === 0 && !calendar.pending.value && !calendar.errorMessage.value)
</script>

<template>
  <div class="grid gap-10">
    <section class="relative flex flex-col items-start justify-between gap-6 pl-6 md:flex-row md:items-end">
      <div class="absolute left-0 top-2 h-[90%] w-1.5 rounded-full bg-gradient-to-b from-[color:var(--color-brand-solid)] via-[rgba(212,184,160,0.35)] to-transparent opacity-70" />

      <div class="grid gap-2">
        <h1 class="font-serif text-4xl italic leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] md:text-5xl">
          Calendrier
        </h1>
        <p class="text-lg font-medium text-[color:var(--color-brand-secondary)]">
          Pilotez votre semaine, retrouvez vos rendez-vous, et créez des créneaux manuels.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="calendar.pending.value"
          @click="onRetry"
        >
          <Icon
            name="lucide:refresh-ccw"
            size="18"
            aria-hidden="true"
          />
          Actualiser
        </button>

        <button
          type="button"
          class="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-[color:var(--color-accent-main)] px-5 text-sm font-bold text-[color:var(--color-accent-contrast)] shadow-floating transition-base hover:bg-[color:var(--color-accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
          :disabled="calendar.pending.value"
          @click="onCreateAppointment"
        >
          <Icon
            name="lucide:plus"
            size="18"
            aria-hidden="true"
          />
          Créer un RDV
        </button>
      </div>
    </section>

    <SystemAlert
      v-if="noticeMessage"
      variant="info"
      :description="noticeMessage"
    />

    <SystemAlert
      v-if="calendar.errorMessage.value"
      variant="error"
      title="Erreur"
      :description="calendar.errorMessage.value"
    />

    <div
      v-if="calendar.pending.value && !calendar.data.value"
      class="grid gap-6 rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
      role="status"
      aria-live="polite"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Chargement…
      </p>
      <div class="mt-2 grid gap-4 md:grid-cols-2">
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.45)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.30)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.35)]" />
        <div class="h-24 rounded-blob-d bg-[rgba(231,229,228,0.25)]" />
      </div>
    </div>

    <div
      v-else-if="isEmpty"
      class="rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Cette semaine
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        Aucun RDV sur cette période. (Fuseau : {{ calendar.timeZone.value }})
      </p>

      <div class="mt-6 rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]">
        La vue calendrier complète (semaine/jour/mois + CRUD) arrive avec la Feature L.
      </div>
    </div>

    <div
      v-else
      class="rounded-blob-b border border-white/60 bg-white/70 p-8 shadow-soft backdrop-blur"
    >
      <p class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
        Cette semaine
      </p>
      <p class="mt-2 text-sm text-[color:var(--color-brand-secondary)]">
        {{ calendar.sortedAppointments.value.length }} rendez-vous chargés. (Fuseau : {{ calendar.timeZone.value }})
      </p>

      <div class="mt-6 rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]">
        La grille calendrier sera intégrée sur les prochains tickets Feature L (L12+). Ce bloc valide la data layer (L11).
      </div>
    </div>
  </div>
</template>
