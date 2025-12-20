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

const slots = defineSlots<{
  default: () => unknown
  'header-actions'?: () => unknown
}>()

const auth = useAuth()
const route = useRoute()

const isLoggingOut = ref(false)
const isMobileNavOpen = ref(false)

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

const contentWrapperClass =
  'flex min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--color-surface-page)]'

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
  <div class="flex h-screen bg-[color:var(--color-surface-page)]">
    <aside
      class="hidden h-screen w-[17.5rem] flex-shrink-0 border-r border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] lg:flex lg:flex-col"
      aria-label="Navigation"
    >
      <div class="p-10">
        <NuxtLink
          :to="brandTo"
          class="inline-flex items-center gap-3"
          :aria-label="brandLabel"
        >
          <AppLogo class="h-7 w-auto text-[color:var(--color-brand-primary)]" />
          <span class="text-sm font-semibold text-[color:var(--color-brand-secondary)]">
            {{ brandLabel }}
          </span>
        </NuxtLink>
      </div>

      <nav class="flex-1 px-4">
        <ul class="grid gap-2">
          <li
            v-for="item in navigation"
            :key="item.to"
          >
            <NuxtLink
              :to="item.to"
              class="group flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[1rem] font-medium transition-colors duration-150 ease-in-out"
              :class="
                isItemActive(item)
                  ? 'bg-[color:var(--color-surface-highlight)] font-bold text-[color:var(--color-brand-primary)]'
                  : 'text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-surface-highlight)]'
              "
              :aria-current="isItemActive(item) ? 'page' : undefined"
            >
              <span
                class="inline-flex h-5 w-5 items-center justify-center"
                aria-hidden="true"
              >
                <Icon
                  :name="item.icon"
                  size="20"
                  class="transition-colors duration-150 ease-in-out"
                  :class="
                    isItemActive(item)
                      ? 'text-[color:var(--color-accent-main)]'
                      : 'text-[color:var(--color-brand-secondary)]'
                  "
                />
              </span>
              <span class="min-w-0 truncate">
                {{ item.label }}
              </span>
            </NuxtLink>
          </li>
        </ul>
      </nav>

      <div class="mt-auto border-t border-[color:var(--color-brand-subtle)] p-6">
        <div class="flex items-center justify-between gap-3">
          <div class="flex min-w-0 items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--color-accent-main)] text-sm font-bold text-[color:var(--color-accent-contrast)]">
              {{ userInitials }}
            </div>
            <div class="min-w-0">
              <p class="truncate text-sm font-semibold text-[color:var(--color-brand-primary)]">
                {{ sidebarLabel }}
              </p>
              <p class="truncate text-xs text-[color:var(--color-brand-secondary)]">
                {{ userLabel }}
              </p>
            </div>
          </div>

          <button
            type="button"
            :disabled="isLoggingOut"
            class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-70"
            aria-label="Se déconnecter"
            @click="onLogout"
          >
            <Icon
              name="lucide:log-out"
              size="20"
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
    </aside>

    <div :class="contentWrapperClass">
      <header class="flex h-16 items-center justify-between border-b border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-4 sm:px-6">
        <div class="flex items-center gap-3">
          <button
            type="button"
            class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] lg:hidden"
            aria-label="Ouvrir le menu"
            @click="isMobileNavOpen = true"
          >
            <Icon
              name="lucide:menu"
              size="20"
              aria-hidden="true"
            />
          </button>

          <h1 class="hidden font-serif text-[1.5rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] lg:block">
            {{ pageTitle }}
          </h1>
        </div>

        <div
          v-if="slots['header-actions']"
          class="flex items-center gap-4"
        >
          <slot name="header-actions" />
        </div>
      </header>

      <main class="flex-1 overflow-y-auto p-6 lg:p-8">
        <h1 class="mb-6 font-serif text-[1.5rem] font-bold leading-[var(--leading-tight)] text-[color:var(--color-brand-primary)] lg:hidden">
          {{ pageTitle }}
        </h1>

        <slot />
      </main>
    </div>

    <Teleport to="body">
      <div
        v-if="isMobileNavOpen"
        class="fixed inset-0 z-50 lg:hidden"
        role="dialog"
        aria-modal="true"
        aria-label="Menu de navigation"
      >
        <button
          type="button"
          class="absolute inset-0 bg-[rgba(54,33,62,0.25)]"
          aria-label="Fermer le menu"
          @click="closeMobileNav"
        />

        <aside
          class="relative flex h-full w-[80%] max-w-[17.5rem] flex-col border-r border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)]"
        >
          <div class="flex items-center justify-between p-6">
            <NuxtLink
              :to="brandTo"
              class="inline-flex items-center gap-3"
              :aria-label="brandLabel"
              @click="closeMobileNav"
            >
              <AppLogo class="h-7 w-auto text-[color:var(--color-brand-primary)]" />
              <span class="text-sm font-semibold text-[color:var(--color-brand-secondary)]">
                {{ brandLabel }}
              </span>
            </NuxtLink>

            <button
              type="button"
              class="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)]"
              aria-label="Fermer"
              @click="closeMobileNav"
            >
              <Icon
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
                <NuxtLink
                  :to="item.to"
                  class="group flex items-center gap-3 rounded-[var(--radius-md)] px-4 py-3 text-[1rem] font-medium transition-colors duration-150 ease-in-out"
                  :class="
                    isItemActive(item)
                      ? 'bg-[color:var(--color-surface-highlight)] font-bold text-[color:var(--color-brand-primary)]'
                      : 'text-[color:var(--color-brand-secondary)] hover:bg-[color:var(--color-surface-highlight)]'
                  "
                  :aria-current="isItemActive(item) ? 'page' : undefined"
                >
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center"
                    aria-hidden="true"
                  >
                    <Icon
                      :name="item.icon"
                      size="20"
                      class="transition-colors duration-150 ease-in-out"
                      :class="
                        isItemActive(item)
                          ? 'text-[color:var(--color-accent-main)]'
                          : 'text-[color:var(--color-brand-secondary)]'
                      "
                    />
                  </span>
                  <span class="min-w-0 truncate">
                    {{ item.label }}
                  </span>
                </NuxtLink>
              </li>
            </ul>
          </nav>

          <div class="mt-auto border-t border-[color:var(--color-brand-subtle)] p-6">
            <button
              type="button"
              :disabled="isLoggingOut"
              class="inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[color:var(--color-brand-subtle)] bg-[color:var(--color-surface-card)] px-4 text-sm font-semibold text-[color:var(--color-brand-secondary)] transition-colors duration-150 ease-in-out hover:bg-[color:var(--color-surface-highlight)] disabled:cursor-not-allowed disabled:opacity-70"
              @click="onLogout"
            >
              <Icon
                name="lucide:log-out"
                size="20"
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
