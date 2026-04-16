<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '1200px',
      height: '630px',
      background: 'linear-gradient(135deg, var(--color-neutral-50) 0%, var(--color-neutral-200) 60%, var(--color-brand-primary) 100%)',
      padding: '60px',
      fontFamily: 'sans-serif'
    }"
  >
    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <div
        :style="{
          fontSize: '64px',
          fontWeight: '700',
          color: 'var(--color-text-primary)',
          lineHeight: '1.1'
        }"
      >
        {{ displayName }}
      </div>
      <div
        :style="{
          fontSize: '32px',
          color: 'var(--color-brand-primary)',
          marginTop: '20px',
          fontWeight: '500'
        }"
      >
        Spécialiste {{ speciality }}
      </div>
    </div>
    <div
      :style="{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'flex-end'
      }"
    >
      <div
        :style="{
          fontSize: '28px',
          fontWeight: '600',
          color: 'var(--color-brand-primary)'
        }"
      >
        {{ isPlatform ? 'Keova' : '' }}
      </div>
      <div
        :style="{
          fontSize: '22px',
          color: 'var(--color-text-muted)'
        }"
      >
        {{ domain }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  displayName: string
  speciality: string
  domain: string
  isPlatform: boolean
}>()
</script>
