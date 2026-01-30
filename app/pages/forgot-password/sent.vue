<template>
  <div
    class="grid gap-10"
    role="status"
    aria-live="polite"
    aria-atomic="true"
  >
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
          Kaora
        </span>
      </ULink>

      <div class="space-y-2 pt-4 text-center">
        <h1
          ref="titleRef"
          tabindex="-1"
          class="font-serif text-4xl leading-tight text-[#221d28]"
        >
          E-mail
          <span class="bg-gradient-to-r from-[#4a8b6e] to-[#3d7a5c] bg-clip-text text-transparent">envoyé</span>
        </h1>
        <p class="text-[#857d8c]">
          Vérifiez votre boîte de réception pour continuer.
        </p>
      </div>
    </header>

    <!-- Success visual -->
    <div class="flex flex-col items-center gap-6">
      <!-- Animated checkmark -->
      <div class="relative">
        <div class="absolute inset-0 animate-ping rounded-full bg-[#4a8b6e]/20" />
        <div class="relative grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#4a8b6e] to-[#3d7a5c] shadow-lg">
          <UIcon
            name="i-lucide-mail-check"
            class="size-10 text-white"
          />
        </div>
      </div>

      <!-- Email display card -->
      <div class="w-full max-w-sm space-y-3">
        <p class="text-center text-sm font-medium text-[#857d8c]">
          E-mail envoyé à
        </p>
        <div class="flex items-center justify-center gap-3 rounded-2xl border border-[#ebe7ef] bg-white px-5 py-4 shadow-sm">
          <UIcon
            name="i-lucide-at-sign"
            class="size-5 shrink-0 text-[#9685ab]"
          />
          <span class="truncate font-mono text-sm font-semibold text-[#221d28]">
            {{ email || '—' }}
          </span>
        </div>
      </div>
    </div>

    <!-- Info box -->
    <div class="rounded-2xl border border-[#d4956a]/20 bg-[#d4956a]/5 p-4">
      <div class="flex gap-3">
        <div class="grid size-10 shrink-0 place-items-center rounded-xl bg-[#d4956a]/15">
          <UIcon
            name="i-lucide-info"
            class="size-5 text-[#d4956a]"
          />
        </div>
        <div class="space-y-1">
          <p class="text-sm font-semibold text-[#221d28]">
            Conseils
          </p>
          <ul class="space-y-1 text-sm text-[#4a4255]">
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-clock"
                class="mt-0.5 size-4 shrink-0 text-[#9685ab]"
              />
              <span>Le lien expire dans <strong>1 heure</strong></span>
            </li>
            <li class="flex items-start gap-2">
              <UIcon
                name="i-lucide-folder"
                class="mt-0.5 size-4 shrink-0 text-[#9685ab]"
              />
              <span>Pensez à vérifier votre dossier <strong>Spam</strong></span>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Actions -->
    <div class="grid gap-4">
      <UButton
        to="/login"
        size="xl"
        class="w-full justify-center rounded-xl bg-gradient-to-r from-[#5b4b6e] to-[#4d3f5c] py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
      >
        <template #leading>
          <UIcon
            name="i-lucide-log-in"
            class="size-5"
          />
        </template>
        Retour à la connexion
      </UButton>

      <div class="text-center">
        <ULink
          to="/"
          class="group inline-flex items-center gap-2 text-sm font-semibold text-[#857d8c] transition-colors hover:text-[#5b4b6e]"
        >
          <UIcon
            name="i-lucide-home"
            class="size-4"
          />
          Revenir à l'accueil
        </ULink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: 'auth',
  middleware: 'guest-only'
})

const emailState = useState<string | null>('forgot-password.email', () => null)
const email = computed(() => emailState.value ?? '')

const titleRef = ref<HTMLElement | null>(null)

onMounted(() => {
  if (import.meta.server) return
  titleRef.value?.focus()
})
</script>

<style scoped>
@keyframes ping {
  75%, 100% {
    transform: scale(2);
    opacity: 0;
  }
}

.animate-ping {
  animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;
}
</style>
