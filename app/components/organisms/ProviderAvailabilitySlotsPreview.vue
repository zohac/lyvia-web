<script setup lang="ts">
import type { AvailabilityAppointmentType } from '../../features/availability/api/availability.contract'
import type { SlotDayGroup } from '../../features/slots/domain/slots'
import SystemAlert from '../atoms/SystemAlert.vue'

const props = defineProps<{
  type: AvailabilityAppointmentType
  periodDays: 7 | 30
  timezone: string
  pending: boolean
  error: string | null
  groups: SlotDayGroup[]
}>()

const emit = defineEmits<{
  (event: 'update:type', value: AvailabilityAppointmentType): void
  (event: 'update:periodDays', value: 7 | 30): void
  (event: 'refresh'): void
}>()

function formatTime(iso: string): string {
  const date = new Date(iso)
  return new Intl.DateTimeFormat('fr-FR', {
    timeZone: props.timezone,
    timeStyle: 'short'
  }).format(date)
}
</script>

<template>
  <div class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-white/75 p-6 shadow-soft backdrop-blur">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div class="grid gap-2">
        <h2 class="font-serif text-2xl italic text-[color:var(--color-brand-primary)]">
          Aperçu des créneaux
        </h2>
        <p class="text-sm text-[color:var(--color-brand-secondary)]">
          Vérifiez les créneaux générés (affichage : {{ timezone }}).
        </p>
      </div>

      <button
        type="button"
        class="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-white px-4 text-sm font-bold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)] transition-base hover:shadow-floating disabled:cursor-not-allowed disabled:opacity-60"
        :disabled="pending"
        @click="emit('refresh')"
      >
        <Icon
          name="lucide:refresh-ccw"
          size="16"
          aria-hidden="true"
        />
        Actualiser
      </button>
    </div>

    <div class="mt-6 grid gap-4">
      <div class="grid gap-4 sm:grid-cols-2">
        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
            Type
          </label>
          <select
            class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
            :disabled="pending"
            :value="type"
            @change="emit('update:type', ($event.target as HTMLSelectElement).value as AvailabilityAppointmentType)"
          >
            <option value="discovery">
              Discovery
            </option>
            <option value="consultation">
              Consultation
            </option>
          </select>
        </div>

        <div class="grid gap-2">
          <label class="text-xs font-bold uppercase tracking-[0.22em] text-[color:var(--color-brand-muted)]">
            Période
          </label>
          <select
            class="h-11 rounded-full border border-white/60 bg-white/70 px-4 text-sm font-semibold text-[color:var(--color-brand-primary)] shadow-soft transition-base focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
            :disabled="pending"
            :value="String(periodDays)"
            @change="emit('update:periodDays', Number(($event.target as HTMLSelectElement).value) as 7 | 30)"
          >
            <option value="7">
              7 jours
            </option>
            <option value="30">
              30 jours
            </option>
          </select>
        </div>
      </div>

      <SystemAlert
        v-if="error"
        variant="error"
        title="Aperçu indisponible"
        :description="error"
      />

      <div
        v-if="pending"
        class="grid gap-3"
      >
        <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.55)]" />
        <div class="h-16 rounded-blob-a bg-[rgba(231,229,228,0.35)]" />
      </div>

      <div
        v-else-if="groups.length === 0"
        class="rounded-blob-d border border-[rgba(231,229,228,0.8)] bg-[color:var(--color-surface-highlight)] p-6 text-sm text-[color:var(--color-brand-secondary)]"
      >
        Aucun créneau généré.
      </div>

      <div
        v-else
        class="grid gap-4"
      >
        <section
          v-for="group in groups"
          :key="group.key"
          class="rounded-blob-d border border-white/60 bg-white/60 p-5 shadow-soft"
        >
          <div class="flex items-center justify-between gap-3">
            <p class="font-semibold text-[color:var(--color-brand-primary)]">
              {{ group.label }}
            </p>
            <span class="rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]">
              {{ group.slots.length }}
            </span>
          </div>

          <div class="mt-4 flex flex-wrap gap-2">
            <span
              v-for="slot in group.slots.slice(0, 12)"
              :key="slot.startAt"
              class="inline-flex items-center gap-2 rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-[color:var(--color-brand-primary)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)]"
            >
              <Icon
                name="lucide:clock"
                size="14"
                aria-hidden="true"
              />
              {{ formatTime(slot.startAt) }}
            </span>
            <span
              v-if="group.slots.length > 12"
              class="inline-flex items-center rounded-full bg-[rgba(212,184,160,0.20)] px-3 py-1 text-xs font-bold text-[color:var(--color-brand-primary)]"
            >
              +{{ group.slots.length - 12 }}
            </span>
          </div>
        </section>
      </div>
    </div>
  </div>
</template>
