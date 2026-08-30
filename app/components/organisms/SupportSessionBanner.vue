<script setup lang="ts">
import { useSupportSession } from '~/features/support-session/state/useSupportSession'
import {
  calculateSupportRemainingSeconds,
  formatSupportRemainingTime
} from '~/features/support-session/api/support-session.contract'

const support = useSupportSession()
const toast = useToast()

const returnConfirmOpen = ref(false)
const returnPending = ref(false)

const session = computed(() => support.supportSession.value)
const isEndingOrRestoring = computed(() => support.isEndingOrRestoring.value)

const remainingSeconds = ref(0)
let timerInterval: ReturnType<typeof setInterval> | null = null

function updateRemainingTime() {
  if (!session.value?.expiresAt) {
    remainingSeconds.value = 0
    return
  }
  remainingSeconds.value = calculateSupportRemainingSeconds(session.value.expiresAt)
}

onMounted(() => {
  updateRemainingTime()
  timerInterval = setInterval(updateRemainingTime, 1000)
})

onUnmounted(() => {
  if (timerInterval) clearInterval(timerInterval)
})

const formattedTime = computed(() => formatSupportRemainingTime(remainingSeconds.value))

function promptReturnToAdmin() {
  if (isEndingOrRestoring.value) return
  returnConfirmOpen.value = true
}

async function confirmReturnToAdmin() {
  if (returnPending.value || isEndingOrRestoring.value) return
  returnPending.value = true
  try {
    await support.end()
    returnConfirmOpen.value = false
  } catch (err: unknown) {
    toast.add({
      title: 'Erreur lors du retour à l\'administration',
      description: err instanceof Error ? err.message : 'Erreur inattendue',
      color: 'error'
    })
  } finally {
    returnPending.value = false
  }
}
</script>

<template>
  <div
    class="sticky top-0 z-40 flex flex-wrap items-center justify-between gap-3 border-b border-amber-300 bg-amber-50 px-4 py-2.5 text-xs text-amber-950 shadow-sm sm:px-6"
    role="region"
    aria-label="Mode assistance technique"
  >
    <div class="flex items-center gap-2 font-medium">
      <span class="inline-flex h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
      <span>
        Mode Assistance : Vous configurez l'espace de la provider
      </span>
      <span
        v-if="session?.phase === 'active'"
        class="inline-flex items-center rounded-md bg-amber-200/70 px-2 py-0.5 font-mono font-bold text-amber-900"
        aria-label="Temps restant"
      >
        <UIcon
          name="lucide:clock"
          size="12"
          class="mr-1 inline"
        />
        {{ formattedTime }}
      </span>
      <span
        v-else-if="session?.phase === 'ending' || session?.phase === 'restoring'"
        class="inline-flex items-center rounded-md bg-amber-300 px-2 py-0.5 font-semibold text-amber-950"
      >
        Restauration de la session admin en cours...
      </span>
    </div>

    <div>
      <UButton
        size="xs"
        color="neutral"
        variant="solid"
        icon="i-lucide-log-out"
        :disabled="isEndingOrRestoring"
        :loading="returnPending || isEndingOrRestoring"
        @click="promptReturnToAdmin"
      >
        Revenir à l’administration
      </UButton>
    </div>

    <!-- Return Confirmation Modal -->
    <UModal
      :open="returnConfirmOpen"
      @update:open="(v: boolean) => { returnConfirmOpen = v }"
    >
      <template #header>
        <div class="flex items-center gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 text-amber-700">
            <UIcon
              name="lucide:log-out"
              size="20"
            />
          </div>
          <div>
            <h3 class="text-lg font-semibold text-[color:var(--color-brand-primary)]">
              Quitter la session d'assistance
            </h3>
            <p class="text-xs text-[color:var(--color-brand-muted)]">
              Retour vers votre espace d'administration
            </p>
          </div>
        </div>
      </template>
      <template #body>
        <div class="space-y-3 text-sm text-[color:var(--color-text-secondary)]">
          <p>
            Voulez-vous mettre fin à cette session d'assistance technique ?
          </p>
          <ul class="list-disc pl-5 space-y-1 text-xs text-[color:var(--color-brand-muted)]">
            <li>Les changements déjà enregistrés sur cet espace restent acquis.</li>
            <li>Les formulaires en cours non enregistrés seront perdus.</li>
            <li>Votre identité d'administrateur sera immédiatement restaurée.</li>
          </ul>
        </div>
      </template>
      <template #footer>
        <div class="flex justify-end gap-3">
          <UButton
            variant="outline"
            color="neutral"
            :disabled="returnPending"
            @click="returnConfirmOpen = false"
          >
            Continuer la configuration
          </UButton>
          <UButton
            color="primary"
            :loading="returnPending"
            @click="confirmReturnToAdmin"
          >
            Confirmer le retour
          </UButton>
        </div>
      </template>
    </UModal>
  </div>
</template>
