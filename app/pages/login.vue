<template>
  <div class="grid gap-10">
    <!-- Brand mark -->
    <header class="grid gap-6">
      <ULink
        to="/"
        aria-label="Retour à l'accueil"
        class="group inline-flex w-fit items-center gap-3"
      >
        <div class="grid size-12 place-items-center rounded-2xl bg-gradient-to-br from-[#5b4b6e] to-[#4d3f5c] shadow-lg transition-transform duration-300 group-hover:scale-105">
          <span class="font-serif text-xl font-bold text-white">
            K
          </span>
        </div>
        <span class="font-serif text-2xl tracking-tight text-[#3d3250]">
          Keova
        </span>
      </ULink>

      <div class="space-y-2 pt-4">
        <h1 class="font-serif text-4xl leading-tight text-[#221d28]">
          Bon retour
          <span class="bg-gradient-to-r from-[#d4956a] to-[#c47a4a] bg-clip-text text-transparent">parmi nous</span>
        </h1>
        <p class="text-[#857d8c]">
          Connectez-vous pour retrouver votre espace.
        </p>
      </div>
    </header>

    <!-- Alerts -->
    <div
      v-if="resetSuccess || emailVerifiedSuccess || error"
      class="space-y-3"
    >
      <SystemAlert
        v-if="resetSuccess"
        variant="success"
        description="Votre mot de passe a été mis à jour. Vous pouvez vous connecter."
      />
      <SystemAlert
        v-if="emailVerifiedSuccess"
        variant="success"
        description="Votre adresse email a été vérifiée. Vous pouvez vous connecter avec votre nouvelle adresse."
      />
      <SystemAlert
        v-if="error"
        variant="error"
        :description="error"
      />
    </div>

    <!-- Form -->
    <form
      class="grid gap-5"
      novalidate
      @submit.prevent="onSubmit"
    >
      <FormControl
        id="email"
        v-slot="slotProps"
        label="Adresse e-mail"
        :required="true"
      >
        <UInput
          ref="emailInputRef"
          v-model="form.email"
          v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
          name="email"
          type="email"
          inputmode="email"
          autocomplete="username"
          placeholder="vous@exemple.com"
          :disabled="isSubmitting"
          size="xl"
          class="[&_input]:rounded-xl"
        />
      </FormControl>

      <FormControl
        id="password"
        label="Mot de passe"
        :required="true"
      >
        <template #label-aside>
          <ULink
            to="/forgot-password"
            class="text-xs font-semibold text-[#9685ab] transition-colors hover:text-[#5b4b6e]"
          >
            Oublié ?
          </ULink>
        </template>
        <template #default="slotProps">
          <UInput
            v-model="form.password"
            v-bind="slotProps?.inputAttrs ?? { id: 'password' }"
            name="password"
            :type="showPassword ? 'text' : 'password'"
            autocomplete="current-password"
            placeholder="••••••••"
            :disabled="isSubmitting"
            :ui="{ trailing: 'pe-1' }"
            size="xl"
            class="[&_input]:rounded-xl"
          >
            <template #trailing>
              <UButton
                color="neutral"
                variant="link"
                size="sm"
                :icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
                :aria-label="showPassword ? 'Masquer' : 'Afficher'"
                :aria-pressed="showPassword"
                aria-controls="password"
                class="pointer-events-auto"
                @click="showPassword = !showPassword"
              />
            </template>
          </UInput>
        </template>
      </FormControl>

      <UButton
        type="submit"
        size="xl"
        :loading="isSubmitting"
        :disabled="!canSubmit"
        class="mt-2 w-full justify-center rounded-xl bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl disabled:opacity-50"
      >
        <span v-if="!isSubmitting">Se connecter</span>
        <span v-else>Connexion...</span>
      </UButton>
    </form>

    <!-- TODO v1: Ajouter inscription provider ("Créer un espace pro") -->
  </div>
</template>

<script setup lang="ts">
import FormControl from '../components/molecules/FormControl.vue'
import SystemAlert from '../components/atoms/SystemAlert.vue'

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
const showPassword = ref(false)
const emailInputRef = ref<{ inputRef: { el: HTMLInputElement } } | null>(null)

const resetSuccess = computed(() => route.query.reset === 'success')
const emailVerifiedSuccess = computed(() => route.query['email-verified'] === 'success')

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
  if (canFocus) emailInputRef.value?.inputRef?.el?.focus()
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
