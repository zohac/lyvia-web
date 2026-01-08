<template>
  <div class="grid gap-12">
    <header class="grid gap-3">
      <ULink
        to="/"
        aria-label="Retour à l’accueil"
        class="mb-12 inline-flex w-fit items-center justify-center"
      >
        <img
          src="/images/kaora-logo.png"
          alt="Kaora"
          class="h-10 w-auto"
          decoding="async"
        >
      </ULink>

      <h1 class="font-serif text-4xl font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)]">
        Bienvenue dans votre <span class="italic text-[color:var(--color-brand-accent)]">espace</span>
      </h1>
      <p class="text-base text-[color:var(--color-brand-secondary)]">
        Connectez-vous pour accéder à Kaora.
      </p>
    </header>

    <SystemAlert
      v-if="resetSuccess"
      variant="success"
      description="Votre mot de passe a été mis à jour. Vous pouvez vous connecter."
    />
    <SystemAlert
      v-if="error"
      variant="error"
      :description="error"
    />

    <form
      class="grid gap-6"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        v-slot="slotProps"
        label="Adresse e-mail"
        :required="true"
      >
        <input
          ref="emailInputRef"
          v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="username"
          :disabled="isSubmitting"
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-white px-4 text-lg text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-muted)] shadow-soft transition-[border-color,box-shadow,transform] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[rgba(231,229,228,0.9)] focus:border-[color:var(--color-brand-solid)] focus:ring-[rgba(212,184,160,0.35)]'
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
        :elevated="true"
      >
        <template #label-aside>
          <ULink
            to="/forgot-password"
            class="text-xs font-bold text-[color:var(--color-brand-muted)] hover:text-[color:var(--color-brand-primary)]"
          >
            Mot de passe oublié
          </ULink>
        </template>
      </PasswordInput>

      <UButton
        color="primary"
        size="xl"
        type="submit"
        label="Se connecter"
        loading-label="Connexion en cours…"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="w-full justify-center"
      />
    </form>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

const auth = useAuth()
const route = useRoute()

const form = reactive({
  email: '',
  password: ''
})

const error = ref<string | null>(null)
const isSubmitting = ref(false)
const emailInputRef = ref<HTMLInputElement | null>(null)

const resetSuccess = computed(() => route.query.reset === 'success')

const canSubmit = computed(() => {
  if (isSubmitting.value) return false
  return form.email.trim().length > 0 && form.password.length > 0
})

watch(
  () => [form.email, form.password],
  () => {
    if (error.value) error.value = null
  }
)

onMounted(() => {
  if (import.meta.server) return

  const canFocus = window.matchMedia?.('(pointer: fine)').matches ?? false
  if (canFocus) emailInputRef.value?.focus()
})

async function onSubmit() {
  error.value = null
  isSubmitting.value = true

  try {
    const redirectPath
      = typeof route.query.redirect === 'string' ? route.query.redirect : undefined

    await auth.login({
      email: form.email,
      password: form.password,
      redirectPath
    })
  } catch {
    error.value
      = auth.lastError.value || 'Une erreur est survenue. Veuillez réessayer.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
