<script setup lang="ts">
import LegalFooterLinks from '../atoms/LegalFooterLinks.vue'
import { useCurrentUser } from '../../features/auth/useCurrentUser'

type NavItem = {
  label: string
  to: string
  icon: string
  match?: 'exact' | 'prefix'
  badge?: number | null
}

type NavGroup = {
  key: string
  label: string
  defaultOpen: boolean
  items: NavItem[]
}

type GroupedNavigation = {
  home: NavItem
  groups: NavGroup[]
}

const props = defineProps<{
  brandLabel: string
  brandTo: string
  navigation: GroupedNavigation
  sidebarLabel: string
}>()

const _slots = defineSlots<{
  'default': () => unknown
  'header-actions'?: () => unknown
}>()

const auth = useAuth()
const route = useRoute()
const currentUser = useCurrentUser()

const isLoggingOut = ref(false)
const isMobileNavOpen = ref(false)

const useKeovaLogoImage = computed(() => props.brandLabel === 'Keova')

// Collapsed state management with localStorage persistence
const STORAGE_KEY = 'keova-nav-collapsed'

function getInitialCollapsedState(): Record<string, boolean> {
  if (import.meta.server) return {}
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) return JSON.parse(stored)
  } catch {
    // Ignore parse errors
  }
  // Default: use defaultOpen from each group (inverted for collapsed state)
  return Object.fromEntries(
    props.navigation.groups.map(g => [g.key, !g.defaultOpen])
  )
}

const collapsedGroups = ref<Record<string, boolean>>(getInitialCollapsedState())

function toggleGroup(key: string) {
  collapsedGroups.value[key] = !collapsedGroups.value[key]
  if (import.meta.client) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(collapsedGroups.value))
    } catch {
      // Ignore storage errors
    }
  }
}

function isGroupOpen(key: string): boolean {
  return !collapsedGroups.value[key]
}

// Check if any item in a group is active (to auto-expand)
function isGroupActive(group: NavGroup): boolean {
  return group.items.some(item => isItemActive(item))
}

// Auto-expand group if it contains the active route
watch(
  () => route.path,
  () => {
    for (const group of props.navigation.groups) {
      if (isGroupActive(group) && collapsedGroups.value[group.key]) {
        collapsedGroups.value[group.key] = false
      }
    }
  },
  { immediate: true }
)

const pageTitle = computed(() => {
  const meta = route.meta as Record<string, unknown>
  return typeof meta.pageTitle === 'string' && meta.pageTitle.trim()
    ? meta.pageTitle
    : 'Tableau de bord'
})

// User display info from useCurrentUser composable
const userLabel = computed(() => currentUser.email.value || 'Utilisateur')
const userInitials = computed(() => currentUser.initials.value)
const userDisplayName = computed(() => currentUser.displayName.value)

const roleBadgeColor = computed(() => {
  const label = props.sidebarLabel.toLowerCase()
  if (label === 'admin') return 'error' as const
  if (label === 'provider' || label === 'coach') return 'primary' as const
  return 'neutral' as const
})

const userMenuItems = computed(() => [
  [
    {
      label: userDisplayName.value,
      icon: 'i-lucide-user',
      disabled: true,
      class: 'font-semibold'
    },
    {
      label: userLabel.value,
      icon: 'i-lucide-mail',
      disabled: true,
      class: 'text-[color:var(--color-text-muted)]'
    }
  ],
  [
    {
      label: 'Se déconnecter',
      icon: 'i-lucide-log-out',
      color: 'error' as const,
      disabled: isLoggingOut.value,
      onSelect: onLogout
    }
  ]
])

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
  <div class="flex h-[100svh] w-full bg-[color:var(--color-surface-page)] bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-[color:var(--color-crepuscule-50)]/55 via-[color:var(--color-surface-page)] to-[color:var(--color-surface-page)] selection:bg-[rgba(212,184,160,0.35)]">
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
          <template v-if="useKeovaLogoImage">
            <img
              src="/images/keova-logo.png"
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

      <nav class="flex-1 overflow-y-auto px-3 py-2">
        <!-- Home item (always visible) -->
        <ULink
          :to="navigation.home.to"
          class="group relative mb-6 flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200"
          :class="
            isItemActive(navigation.home)
              ? 'bg-[color:var(--color-brand-primary-dark)] text-white shadow-md hover:text-white focus-visible:text-white'
              : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-brand-primary-dark)]'
          "
          :aria-current="isItemActive(navigation.home) ? 'page' : undefined"
        >
          <span
            class="inline-flex h-5 w-5 items-center justify-center"
            aria-hidden="true"
          >
            <UIcon
              :name="navigation.home.icon"
              size="20"
              :class="isItemActive(navigation.home) ? 'text-white' : 'text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-text-secondary)]'"
            />
          </span>
          <span class="min-w-0 truncate text-sm">
            {{ navigation.home.label }}
          </span>
        </ULink>

        <!-- Collapsible groups -->
        <div
          v-for="group in navigation.groups"
          :key="group.key"
          class="mb-4"
        >
          <!-- Group header (collapsible trigger) — hidden if no label -->
          <button
            v-if="group.label"
            type="button"
            class="group mb-2 flex w-full items-center gap-2 px-3 py-1.5 text-left"
            :aria-expanded="isGroupOpen(group.key)"
            :aria-controls="`nav-group-${group.key}`"
            @click="toggleGroup(group.key)"
          >
            <UIcon
              name="lucide:chevron-right"
              size="12"
              class="text-[color:var(--color-brand-muted)] transition-transform duration-200"
              :class="{ 'rotate-90': isGroupOpen(group.key) }"
              aria-hidden="true"
            />
            <span class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)] transition-colors group-hover:text-[color:var(--color-text-secondary)]">
              {{ group.label }}
            </span>
          </button>

          <!-- Group items (collapsible content, or always visible if no label) -->
          <Transition
            enter-active-class="transition-all duration-200 ease-out"
            enter-from-class="opacity-0 -translate-y-1 max-h-0"
            enter-to-class="opacity-100 translate-y-0 max-h-96"
            leave-active-class="transition-all duration-150 ease-in"
            leave-from-class="opacity-100 translate-y-0 max-h-96"
            leave-to-class="opacity-0 -translate-y-1 max-h-0"
          >
            <ul
              v-show="!group.label || isGroupOpen(group.key)"
              :id="`nav-group-${group.key}`"
              class="grid gap-0.5 overflow-hidden"
            >
              <li
                v-for="item in group.items"
                :key="item.to"
              >
                <ULink
                  :to="item.to"
                  class="group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                  :class="
                    isItemActive(item)
                      ? 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand-primary-dark)]'
                      : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-page)] hover:text-[color:var(--color-text-secondary)]'
                  "
                  :aria-current="isItemActive(item) ? 'page' : undefined"
                >
                  <!-- Active indicator bar -->
                  <span
                    v-if="isItemActive(item)"
                    class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[color:var(--color-brand-primary-dark)]"
                    aria-hidden="true"
                  />
                  <span
                    class="inline-flex h-5 w-5 items-center justify-center"
                    aria-hidden="true"
                  >
                    <UIcon
                      :name="item.icon"
                      size="18"
                      :class="isItemActive(item) ? 'text-[color:var(--color-brand-primary-dark)]' : 'text-[color:var(--color-brand-muted)] group-hover:text-[color:var(--color-text-secondary)]'"
                    />
                  </span>
                  <span class="min-w-0 truncate">
                    {{ item.label }}
                  </span>
                  <UBadge
                    v-if="item.badge && item.badge > 0"
                    color="warning"
                    variant="solid"
                    size="xs"
                    class="ml-auto"
                  >
                    {{ item.badge }}
                  </UBadge>
                </ULink>
              </li>
            </ul>
          </Transition>
        </div>
      </nav>

      <!-- User Section -->
      <div class="mt-auto border-t border-[color:var(--color-brand-subtle)]/60 p-4">
        <UDropdownMenu
          :items="userMenuItems"
          :content="{ align: 'start', side: 'top', sideOffset: 8 }"
          :ui="{ content: 'w-64' }"
        >
          <button
            type="button"
            class="group flex w-full items-center gap-3 rounded-xl p-3 text-left transition-all hover:bg-[color:var(--color-surface-muted)]"
          >
            <!-- Avatar -->
            <div class="relative">
              <UAvatar
                :text="userInitials"
                size="lg"
                class="ring-2 ring-crepuscule-200 ring-offset-2 ring-offset-white"
                :ui="{ root: 'bg-crepuscule-100', fallback: 'text-crepuscule-700 font-semibold' }"
              />
              <!-- Online indicator -->
              <span class="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-[color:var(--color-success-500)]" />
            </div>

            <!-- User info -->
            <div class="min-w-0 flex-1">
              <div class="flex items-center gap-2">
                <p class="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                  {{ userDisplayName }}
                </p>
              </div>
              <p class="truncate text-xs text-[color:var(--color-text-muted)]">
                {{ userLabel }}
              </p>
            </div>

            <!-- Chevron -->
            <UIcon
              name="lucide:chevrons-up-down"
              class="h-4 w-4 shrink-0 text-[color:var(--color-brand-muted)] transition-colors group-hover:text-[color:var(--color-text-secondary)]"
            />
          </button>
        </UDropdownMenu>
      </div>
    </aside>

    <div class="flex min-w-0 flex-1 flex-col overflow-y-auto md:pl-72">
      <header class="sticky top-0 z-20 flex h-24 shrink-0 items-center justify-between border-b border-[rgba(231,229,228,0.6)] bg-[color:var(--color-surface-page)]/80 px-4 backdrop-blur-md sm:px-6 lg:px-12">
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
              Keova
            </span>
            <UIcon
              name="lucide:chevron-right"
              size="16"
              class="mx-3 opacity-40"
              aria-hidden="true"
            />
            <span class="border-b-2 border-[color:var(--color-brand-primary)] pb-1 text-[color:var(--color-brand-primary)]">
              {{ pageTitle }}
            </span>
          </div>

          <p class="text-sm font-semibold text-[color:var(--color-brand-primary)] md:hidden">
            {{ pageTitle }}
          </p>
        </div>

        <div class="flex items-center gap-3">
          <slot name="header-actions" />
        </div>
      </header>

      <main class="flex-1 p-6 md:p-8 lg:p-12">
        <div class="mx-auto w-full max-w-7xl">
          <slot />
        </div>
      </main>

      <footer class="border-t border-[rgba(231,229,228,0.5)] px-6 py-6 md:px-8 lg:px-12">
        <div class="mx-auto flex w-full max-w-7xl flex-col items-center gap-3 text-center">
          <LegalFooterLinks />
          <p class="text-xs text-[color:var(--color-brand-muted)]">
            © {{ new Date().getFullYear() }} Keova
          </p>
        </div>
      </footer>
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

              <template v-if="useKeovaLogoImage">
                <img
                  src="/images/keova-logo.png"
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

          <nav class="flex-1 overflow-y-auto px-3 py-2">
            <!-- Home item (always visible) -->
            <ULink
              :to="navigation.home.to"
              class="group relative mb-6 flex items-center gap-3 rounded-xl px-4 py-3 font-medium transition-all duration-200"
              :class="
                isItemActive(navigation.home)
                  ? 'bg-[color:var(--color-brand-primary-dark)] text-white shadow-md hover:text-white focus-visible:text-white'
                  : 'text-[color:var(--color-text-secondary)] hover:bg-[color:var(--color-surface-muted)] hover:text-[color:var(--color-brand-primary-dark)]'
              "
              :aria-current="isItemActive(navigation.home) ? 'page' : undefined"
            >
              <span
                class="inline-flex h-5 w-5 items-center justify-center"
                aria-hidden="true"
              >
                <UIcon
                  :name="navigation.home.icon"
                  size="20"
                  :class="isItemActive(navigation.home) ? 'text-white' : 'text-[color:var(--color-text-muted)] group-hover:text-[color:var(--color-text-secondary)]'"
                />
              </span>
              <span class="min-w-0 truncate text-sm">
                {{ navigation.home.label }}
              </span>
            </ULink>

            <!-- Collapsible groups (mobile) -->
            <div
              v-for="group in navigation.groups"
              :key="group.key"
              class="mb-4"
            >
              <!-- Group header — hidden if no label -->
              <button
                v-if="group.label"
                type="button"
                class="group mb-2 flex w-full items-center gap-2 px-3 py-1.5 text-left"
                :aria-expanded="isGroupOpen(group.key)"
                @click="toggleGroup(group.key)"
              >
                <UIcon
                  name="lucide:chevron-right"
                  size="12"
                  class="text-[color:var(--color-brand-muted)] transition-transform duration-200"
                  :class="{ 'rotate-90': isGroupOpen(group.key) }"
                  aria-hidden="true"
                />
                <span class="text-[11px] font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)] transition-colors group-hover:text-[color:var(--color-text-secondary)]">
                  {{ group.label }}
                </span>
              </button>

              <!-- Group items -->
              <ul
                v-show="!group.label || isGroupOpen(group.key)"
                class="grid gap-0.5"
              >
                <li
                  v-for="item in group.items"
                  :key="item.to"
                >
                  <ULink
                    :to="item.to"
                    class="group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200"
                    :class="
                      isItemActive(item)
                        ? 'bg-[color:var(--color-surface-muted)] text-[color:var(--color-brand-primary-dark)]'
                        : 'text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-page)] hover:text-[color:var(--color-text-secondary)]'
                    "
                    :aria-current="isItemActive(item) ? 'page' : undefined"
                  >
                    <!-- Active indicator bar -->
                    <span
                      v-if="isItemActive(item)"
                      class="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-full bg-[color:var(--color-brand-primary-dark)]"
                      aria-hidden="true"
                    />
                    <span
                      class="inline-flex h-5 w-5 items-center justify-center"
                      aria-hidden="true"
                    >
                      <UIcon
                        :name="item.icon"
                        size="18"
                        :class="isItemActive(item) ? 'text-[color:var(--color-brand-primary-dark)]' : 'text-[color:var(--color-brand-muted)] group-hover:text-[color:var(--color-text-secondary)]'"
                      />
                    </span>
                    <span class="min-w-0 truncate">
                      {{ item.label }}
                    </span>
                    <UBadge
                      v-if="item.badge && item.badge > 0"
                      color="warning"
                      variant="solid"
                      size="xs"
                      class="ml-auto"
                    >
                      {{ item.badge }}
                    </UBadge>
                  </ULink>
                </li>
              </ul>
            </div>
          </nav>

          <!-- User Section (Mobile) -->
          <div class="mt-auto border-t border-[color:var(--color-brand-subtle)]/60 p-4">
            <!-- User info card -->
            <div class="mb-3 flex items-center gap-3 rounded-xl bg-[color:var(--color-surface-page)] p-3">
              <UAvatar
                :text="userInitials"
                size="lg"
                class="ring-2 ring-crepuscule-200 ring-offset-2 ring-offset-stone-50"
                :ui="{ root: 'bg-crepuscule-100', fallback: 'text-crepuscule-700 font-semibold' }"
              />
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-2">
                  <p class="truncate text-sm font-semibold text-[color:var(--color-text-primary)]">
                    {{ userDisplayName }}
                  </p>
                  <UBadge
                    :color="roleBadgeColor"
                    variant="subtle"
                    size="xs"
                  >
                    {{ sidebarLabel }}
                  </UBadge>
                </div>
                <p class="truncate text-xs text-[color:var(--color-text-muted)]">
                  {{ userLabel }}
                </p>
              </div>
            </div>

            <!-- Logout button -->
            <UButton
              color="error"
              variant="soft"
              block
              :loading="isLoggingOut"
              leading-icon="i-lucide-log-out"
              @click="onLogout"
            >
              Se déconnecter
            </UButton>
          </div>
        </aside>
      </div>
    </Teleport>
  </div>
</template>
