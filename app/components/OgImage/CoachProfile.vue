<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: '1200px',
      height: '630px',
      background: 'linear-gradient(135deg, #f5f0eb 0%, #e8ddd4 60%, #5b4b6e 100%)',
      padding: '60px',
      fontFamily: 'sans-serif'
    }"
  >
    <div :style="{ display: 'flex', flexDirection: 'column' }">
      <div
        :style="{
          fontSize: '64px',
          fontWeight: '700',
          color: '#2d2d2d',
          lineHeight: '1.1'
        }"
      >
        {{ displayName }}
      </div>
      <div
        :style="{
          fontSize: '32px',
          color: '#5b4b6e',
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
          color: '#5b4b6e'
        }"
      >
        {{ isPlatform ? 'Keova' : '' }}
      </div>
      <div
        :style="{
          fontSize: '22px',
          color: '#888'
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
