<template>
  <AuthPageTemplate
    title="Connexion"
    subtitle="Accéder à votre espace"
  >
    <template #alert>
      <SystemAlert
        v-if="error"
        variant="error"
        description="Identifiants invalides. Vérifiez votre email et votre mot de passe."
      />
    </template>

    <form
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        label="Adresse e-mail"
        :required="true"
        v-slot="slotProps"
      >
        <input
          ref="emailInputRef"
          v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="username"
          :disabled="isSubmitting"
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
          "
          :value="form.email"
          @input="form.email = ($event.target as HTMLInputElement).value"
        >
      </FormControl>

      <PasswordInput
        id="password"
        v-model="form.password"
        label="Mot de passe"
        autocomplete="current-password"
        :required="true"
        :disabled="isSubmitting"
      />

      <PrimaryButton
        type="submit"
        label="Se connecter"
        loading-label="Connexion en cours…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
      />
    </form>

    <template #footer>
      <NuxtLink
        to="/forgot-password"
        class="font-semibold text-[color:var(--color-brand-secondary)] hover:underline"
      >
        Mot de passe oublié ?
      </NuxtLink>
    </template>
  </AuthPageTemplate>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth'
})

const config = useRuntimeConfig()

const form = reactive({
  email: '',
  password: ''
})

const accessToken = useCookie<string | null>('access_token')
const error = ref<string | null>(null)
const isSubmitting = ref(false)
const emailInputRef = ref<HTMLInputElement | null>(null)

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  return form.email.trim().length > 0 && form.password.length > 0
})

onMounted(() => {
  if (import.meta.server) return

  const canFocus = window.matchMedia?.('(pointer: fine)').matches ?? false
  if (canFocus) emailInputRef.value?.focus()
})

async function onSubmit() {
  error.value = null
  isSubmitting.value = true

  try {
    const response = await $fetch<{ accessToken: string }>(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: {
        email: form.email,
        password: form.password
      }
    })

    accessToken.value = response.accessToken
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  } finally {
    isSubmitting.value = false
  }
}
</script>
