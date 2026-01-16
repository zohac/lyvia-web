<script setup lang="ts">
type NavItem = {
  label: string
  to: string
  icon: string
  match?: 'exact' | 'prefix'
}

const props = defineProps<{
  brandLabel: string
  brandTo: string
  navigation: NavItem[]
  sidebarLabel: string
}>()

const _slots = defineSlots<{
  'default': () => unknown
  'header-actions'?: () => unknown
}>()

const auth = useAuth()
const route = useRoute()

const isLoggingOut = ref(false)
const isMobileNavOpen = ref(false)

const useKaoraLogoImage = computed(() => props.brandLabel === 'Kaora')

const pageTitle = computed(() => {
  const meta = route.meta as Record<string, unknown>
  return typeof meta.pageTitle === 'string' && meta.pageTitle.trim()
    ? meta.pageTitle
    : 'Tableau de bord'
})

const userLabel = computed(() => auth.user.value?.email ?? 'Utilisateur')

const userInitials = computed(() => {
  const email = auth.user.value?.email
  if (!email) return 'U'
  return email.slice(0, 1).toUpperCase()
})

function isItemActive(item: NavItem): boolean {
  if (item.match === 'prefix') return route.path.startsWith(item.to)
  return route.path === item.to
}

async function onLogout() {
  if (isLoggingOut.value) return
  isLoggingOut.value = true
  try {
    await auth.logout()
  } finally {
    isLoggingOut.value = false
    isMobileNavOpen.value = false
  }
}

function closeMobileNav() {
  isMobileNavOpen.value = false
}

watch(
  () => route.fullPath,
  () => {
    closeMobileNav()
  }
)
</script>

<template>
  <div class="flex h-[100svh] w-full bg-[color:var(--color-surface-page)] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[color:var(--color-kaora-50)]/55 via-[color:var(--color-surface-page)] to-[color:var(--color-surface-page)] selection:bg-[rgba(212,184,160,0.35)]">
    <aside
      class="fixed left-0 top-0 z-30 hidden h-full w-72 flex-col border-r border-[rgba(231,229,228,0.5)] bg-white/60 backdrop-blur-xl md:flex"
      aria-label="Navigation principale"
    >
      <div class="p-8">
        <ULink
          class="inline-flex items-center gap-3"
          :aria-label="brandLabel"
          :to="brandTo"
        >
          <template v-if="useKaoraLogoImage">
            <img
              src="/images/kaora-logo.png"
              alt=""
              class="h-7 w-auto opacity-95"
              aria-hidden="true"
              decoding="async"
            >
            <span class="sr-only">
              {{ brandLabel }}
            </span>
          </template>
          <span
            v-else
            class="font-serif text-2xl italic tracking-tight text-[color:var(--color-brand-primary)]"
          >
            {{ brandLabel }}
          </span>
        </ULink>
      </div>

      <nav class="flex-1 px-4">
        <ul class="grid gap-2">
          <li
            v-for="item in navigation"
            :key="item.to"
          >
            <ULink
              :to="item.to"
              class="group flex items-center gap-3 px-5 py-3.5 font-semibold tracking-wide text-[color:var(--color-brand-muted)] transition-base"
              :class="
                isItemActive(item)
                  ? 'rounded-r-full rounded-l-[var(--radius-organic)] bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-accent)] shadow-soft ring-1 ring-[rgba(231,229,228,0.8)]'
                  : 'rounded-[2rem] hover:bg-white/70 hover:text-[color:var(--color-brand-primary)]'
              "
              :aria-current="isItemActive(item) ? 'page' : undefined"
            >
              <span
                class="inline-flex h-6 w-6 items-center justify-center"
                aria-hidden="true"
              >
                <UIcon
                  :name="item.icon"
                  size="20"
                  class="transition-base"
                  :class="
                    isItemActive(item)
                      ? 'text-[color:var(--color-brand-accent)]'
                      : 'text-[color:var(--color-brand-muted)]'
                  "
                />
              </span>
              <span class="min-w-0 truncate">
                {{ item.label }}
              </span>
            </ULink>
          </li>
        </ul>
      </nav>

      <div class="mt-auto p-6">
        <div class="rounded-[2rem] bg-white/50 p-5 shadow-soft ring-1 ring-white backdrop-blur-md transition-base hover:bg-white/70">
          <div class="flex items-center justify-between gap-3">
            <div class="grid min-w-0 gap-0.5">
              <p class="text-[10px] font-bold uppercase tracking-[0.24em] text-[color:var(--color-brand-muted)]">
                Statut
              </p>
              <p class="font-serif text-sm italic text-[color:var(--color-brand-primary)]">
                {{ sidebarLabel }}
              </p>
              <p class="truncate text-xs text-[color:var(--color-brand-secondary)]">
                {{ userLabel }}
              </p>
            </div>

            <div class="flex items-center gap-3">
              <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-brand-solid)] text-sm font-bold text-[color:var(--color-brand-primary)]">
                {{ userInitials }}
              </div>

              <button
                type="button"
                :disabled="isLoggingOut"
                class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-base hover:bg-white disabled:cursor-not-allowed disabled:opacity-70"
                aria-label="Se déconnecter"
                @click="onLogout"
              >
                <UIcon
                  name="lucide:log-out"
                  size="20"
                  aria-hidden="true"
                />
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-hidden md:pl-72">
      <header class="sticky top-0 z-20 flex h-24 items-center justify-between border-b border-[rgba(231,229,228,0.6)] bg-[color:var(--color-surface-page)]/80 px-4 backdrop-blur-md sm:px-6 lg:px-12">
        <div class="flex items-center gap-4">
          <button
            type="button"
            class="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-primary)] transition-base hover:bg-white/70 md:hidden"
            aria-label="Ouvrir la navigation"
            @click="isMobileNavOpen = true"
          >
            <UIcon
              name="lucide:menu"
              size="20"
              aria-hidden="true"
            />
          </button>

          <div class="hidden items-center text-sm font-semibold text-[color:var(--color-brand-muted)] md:flex">
            <span class="cursor-default">
              Kaora
            </span>
            <UIcon
              name="lucide:chevron-right"
              size="16"
              class="mx-3 opacity-40"
              aria-hidden="true"
            />
            <span class="border-b-2 border-[color:var(--color-brand-solid)] pb-1 text-[color:var(--color-brand-primary)]">
              {{ pageTitle }}
            </span>
          </div>

          <p class="text-sm font-semibold text-[color:var(--color-brand-primary)] md:hidden">
            {{ pageTitle }}
          </p>
        </div>

        <div class="flex items-center gap-4">
          <div class="relative hidden md:block">
            <UIcon
              name="lucide:search"
              size="18"
              class="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[color:var(--color-brand-muted)]"
              aria-hidden="true"
            />
            <input
              type="search"
              placeholder="Rechercher..."
              class="h-11 w-72 rounded-full border border-white/60 bg-white/70 pl-12 pr-4 text-sm text-[color:var(--color-brand-primary)] shadow-soft transition-base placeholder:text-[color:var(--color-brand-muted)] focus:outline-none focus:ring-4 focus:ring-[rgba(212,184,160,0.35)]"
            >
          </div>

          <div class="flex items-center gap-2">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 shadow-soft ring-1 ring-white">
              <span class="text-sm font-bold text-[color:var(--color-brand-primary)]">
                {{ userInitials }}
              </span>
            </div>

            <slot name="header-actions" />
          </div>
        </div>
      </header>

      <main class="no-scrollbar flex-1 overflow-y-auto scroll-smooth p-6 md:p-8 lg:p-12">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="isMobileNavOpen"
        class="fixed inset-0 z-50 md:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation"
      >
        <button
          type="button"
          class="absolute inset-0 bg-[rgba(28,25,23,0.2)] backdrop-blur-[2px]"
          aria-label="Fermer la navigation"
          @click="closeMobileNav"
        />

        <aside
          class="relative flex h-full w-[85%] max-w-72 flex-col border-r border-[rgba(231,229,228,0.5)] bg-white/85 backdrop-blur-xl"
        >
          <div class="flex items-center justify-between p-6">
            <ULink
              :to="brandTo"
              class="inline-flex items-center gap-3"
              :aria-label="brandLabel"
              @click="closeMobileNav"
            >
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[color:var(--color-surface-page)] to-white text-[color:var(--color-brand-accent)] shadow-soft ring-1 ring-[rgba(231,229,228,0.7)]">
                <UIcon
                  name="lucide:sparkles"
                  size="20"
                  aria-hidden="true"
                />
              </div>

              <template v-if="useKaoraLogoImage">
                <img
                  src="/images/kaora-logo.png"
                  alt=""
                  class="h-7 w-auto opacity-95"
                  aria-hidden="true"
                  decoding="async"
                >
                <span class="sr-only">
                  {{ brandLabel }}
                </span>
              </template>
              <span
                v-else
                class="font-serif text-2xl italic tracking-tight text-[color:var(--color-brand-primary)]"
              >
                {{ brandLabel }}
              </span>
            </ULink>

            <button
              type="button"
              class="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-primary)] transition-base hover:bg-white/70"
              aria-label="Fermer"
              @click="closeMobileNav"
            >
              <UIcon
                name="lucide:x"
                size="20"
                aria-hidden="true"
              />
            </button>
          </div>

          <nav class="flex-1 px-4">
            <ul class="grid gap-2">
              <li
                v-for="item in navigation"
                :key="item.to"
              >
                <ULink
                  :to="item.to"
                  class="group flex items-center gap-3 px-5 py-3.5 text-sm font-semibold tracking-wide text-[color:var(--color-brand-muted)] transition-base"
                  :class="
                    isItemActive(item)
                      ? 'rounded-r-full rounded-l-[var(--radius-organic)] bg-[color:var(--color-surface-highlight)] text-[color:var(--color-brand-accent)] shadow-soft ring-1 ring-[rgba(231,229,228,0.8)]'
                      : 'rounded-[2rem] hover:bg-white/70 hover:text-[color:var(--color-brand-primary)]'
                  "
                  :aria-current="isItemActive(item) ? 'page' : undefined"
                >
                  <span
                    class="inline-flex h-6 w-6 items-center justify-center"
                    aria-hidden="true"
                  >
                    <UIcon
                      :name="item.icon"
                      size="20"
                      class="transition-base"
                      :class="
                        isItemActive(item)
                          ? 'text-[color:var(--color-brand-accent)]'
                          : 'text-[color:var(--color-brand-muted)]'
                      "
                    />
                  </span>
                  <span class="min-w-0 truncate">
                    {{ item.label }}
                  </span>
                </ULink>
              </li>
            </ul>
          </nav>

          <div class="mt-auto p-6">
            <button
              type="button"
              :disabled="isLoggingOut"
              class="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[color:var(--color-brand-primary)] px-4 py-3 text-sm font-bold text-white shadow-floating transition-base hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-70"
              @click="onLogout"
            >
              <UIcon
                name="lucide:log-out"
                size="18"
                aria-hidden="true"
              />
              Se déconnecter
            </button>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
