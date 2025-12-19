<script setup lang="ts">
import { getPasswordCriteria } from '../../features/auth/password/password-policy'

const props = defineProps<{
  id: string
  password: string
}>()

const criteria = computed(() => getPasswordCriteria(props.password))

type Item = {
  key: keyof typeof criteria.value
  label: string
}

const items = computed<Item[]>(() => [
  { key: 'minLength', label: '10 caractères minimum' },
  { key: 'hasLetter', label: '1 lettre (a-z, A-Z)' },
  { key: 'hasDigit', label: '1 chiffre (0-9)' },
  { key: 'hasSpecial', label: '1 caractère spécial (ex: !, @, #)' },
  { key: 'notCommon', label: 'Évitez un mot de passe trop commun' }
])
</script>

<template>
  <ul
    :id="id"
    class="grid gap-2 text-sm text-[color:var(--color-brand-secondary)]"
  >
    <li
      v-for="item in items"
      :key="item.key"
      class="flex items-start gap-2"
    >
      <span class="mt-0.5 inline-flex h-4 w-4 shrink-0 items-center justify-center">
        <svg
          v-if="criteria[item.key]"
          viewBox="0 0 24 24"
          class="h-4 w-4 text-[color:var(--color-success)]"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
          aria-hidden="true"
        >
          <path d="m20 6-11 11-5-5" />
        </svg>
        <span
          v-else
          aria-hidden="true"
          class="h-2.5 w-2.5 rounded-full bg-[color:var(--color-brand-subtle)]"
        />
      </span>

      <span :class="criteria[item.key] ? 'font-semibold text-[color:var(--color-success)]' : ''">
        {{ item.label }}
      </span>
    </li>
  </ul>
</template>
