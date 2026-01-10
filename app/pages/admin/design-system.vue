<template>
  <div class="min-h-screen bg-[color:var(--color-surface-page)]">
    <!-- Hero Header -->
    <header class="relative overflow-hidden border-b border-[rgba(212,184,160,0.2)]">
      <!-- Decorative gradient blob -->
      <div class="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-gradient-to-br from-[color:var(--color-kaora-100)] via-[color:var(--color-kaora-50)] to-transparent opacity-60 blur-[100px]" />
      <div class="pointer-events-none absolute -left-20 bottom-0 h-64 w-64 rounded-full bg-gradient-to-tr from-[color:var(--color-stone-100)] to-transparent opacity-40 blur-[80px]" />

      <div class="relative mx-auto max-w-7xl px-6 py-12 lg:px-8">
        <div class="flex items-end justify-between gap-8">
          <div class="space-y-4">
            <div class="flex items-center gap-3">
              <span class="inline-flex items-center gap-2 rounded-full bg-[rgba(212,184,160,0.15)] px-3 py-1 text-xs font-bold uppercase tracking-[0.2em] text-[color:var(--color-brand-accent)]">
                <span class="h-1.5 w-1.5 rounded-full bg-[color:var(--color-brand-accent)]" />
                Kaora DS
              </span>
              <span class="text-xs text-[color:var(--color-brand-muted)]">
                v1.0 • Nuxt UI 4
              </span>
            </div>
            <h1 class="font-serif text-5xl font-bold leading-[0.95] text-[color:var(--color-brand-primary)] lg:text-6xl">
              Design<br>
              <span class="italic text-[color:var(--color-brand-accent)]">System</span>
            </h1>
            <p class="max-w-md text-base text-[color:var(--color-brand-secondary)]">
              Documentation interactive des composants Kaora.
              Organic Luxury Theme pour Nuxt UI v4.
            </p>
          </div>

          <!-- Quick stats -->
          <div class="hidden gap-6 lg:flex">
            <div class="text-right">
              <p class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">8</p>
              <p class="text-xs uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">Composants</p>
            </div>
            <div class="h-12 w-px bg-[rgba(212,184,160,0.3)]" />
            <div class="text-right">
              <p class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">6</p>
              <p class="text-xs uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">Variantes</p>
            </div>
            <div class="h-12 w-px bg-[rgba(212,184,160,0.3)]" />
            <div class="text-right">
              <p class="font-serif text-3xl font-bold text-[color:var(--color-brand-primary)]">7</p>
              <p class="text-xs uppercase tracking-[0.15em] text-[color:var(--color-brand-muted)]">Couleurs</p>
            </div>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content with Tabs -->
    <div class="mx-auto max-w-7xl px-6 py-10 lg:px-8">
      <UTabs
        v-model="activeTab"
        :items="tabItems"
      >
        <!-- Button Tab -->
        <template #button>
          <div class="space-y-10">
            <SectionHeader
              title="Button"
              description="Composant principal d'interaction. 6 variantes × 7 couleurs = 42 combinaisons."
            />

            <!-- Color Matrix -->
            <div class="space-y-8">
              <ColorVariantSection
                v-for="color in buttonColors"
                :key="color.value"
                :color="color.value"
                :title="color.title"
                :description="color.description"
              />
            </div>

            <!-- Sizes -->
            <ComponentCard title="Tailles" description="5 tailles disponibles (xs → xl)">
              <div class="flex flex-wrap items-center justify-center gap-4">
                <UButton color="primary" size="xs">
                  Extra Small
                </UButton>
                <UButton color="primary" size="sm">
                  Small
                </UButton>
                <UButton color="primary" size="md">
                  Medium
                </UButton>
                <UButton color="primary" size="lg">
                  Large
                </UButton>
                <UButton color="primary" size="xl">
                  Extra Large
                </UButton>
              </div>
            </ComponentCard>

            <!-- States -->
            <div class="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="États Disabled" description="Contraste optimisé pour l'accessibilité">
                <div class="space-y-3">
                  <UButton color="primary" disabled block>
                    Primary Disabled
                  </UButton>
                  <UButton color="secondary" variant="outline" disabled block>
                    Secondary Disabled
                  </UButton>
                  <UButton color="neutral" variant="soft" disabled block>
                    Neutral Disabled
                  </UButton>
                </div>
              </ComponentCard>

              <ComponentCard title="Avec Icônes" description="Leading et trailing icons">
                <div class="space-y-3">
                  <UButton color="primary" block>
                    <template #leading>
                      <Icon name="lucide:check" />
                    </template>
                    Leading Icon
                  </UButton>
                  <UButton color="secondary" variant="outline" block>
                    Trailing Icon
                    <template #trailing>
                      <Icon name="lucide:arrow-right" />
                    </template>
                  </UButton>
                  <UButton color="success" variant="soft" block>
                    <template #leading>
                      <Icon name="lucide:star" />
                    </template>
                    Both Icons
                    <template #trailing>
                      <Icon name="lucide:chevron-down" />
                    </template>
                  </UButton>
                </div>
              </ComponentCard>
            </div>
          </div>
        </template>

        <!-- Input Tab -->
        <template #input>
          <div class="space-y-10">
            <SectionHeader
              title="Input"
              description="Champs de saisie avec validation et états visuels."
            />

            <div class="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Tailles" description="Différentes tailles d'input">
                <div class="space-y-4">
                  <UInput placeholder="Extra Small" size="xs" />
                  <UInput placeholder="Small" size="sm" />
                  <UInput placeholder="Medium (défaut)" size="md" />
                  <UInput placeholder="Large" size="lg" />
                  <UInput placeholder="Extra Large" size="xl" />
                </div>
              </ComponentCard>

              <ComponentCard title="Types" description="Email, password, search...">
                <div class="space-y-4">
                  <UInput type="email" placeholder="email@example.com" />
                  <UInput type="password" placeholder="Mot de passe" />
                  <UInput type="search" placeholder="Rechercher..." />
                  <UInput type="number" placeholder="0" />
                </div>
              </ComponentCard>
            </div>

            <div class="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Avec Icônes" description="Leading et trailing">
                <div class="space-y-4">
                  <UInput placeholder="Rechercher...">
                    <template #leading>
                      <Icon name="lucide:search" class="text-[color:var(--color-brand-muted)]" />
                    </template>
                  </UInput>
                  <UInput placeholder="Email">
                    <template #leading>
                      <Icon name="lucide:mail" class="text-[color:var(--color-brand-muted)]" />
                    </template>
                    <template #trailing>
                      <Icon name="lucide:check" class="text-[color:var(--color-success)]" />
                    </template>
                  </UInput>
                </div>
              </ComponentCard>

              <ComponentCard title="États" description="Disabled, loading...">
                <div class="space-y-4">
                  <UInput placeholder="Désactivé" disabled />
                  <UInput placeholder="Chargement..." loading />
                </div>
              </ComponentCard>
            </div>
          </div>
        </template>

        <!-- Select Tab -->
        <template #select>
          <div class="space-y-10">
            <SectionHeader
              title="Select"
              description="Menus déroulants pour la sélection d'options."
            />

            <div class="grid gap-6 lg:grid-cols-2">
              <ComponentCard title="Basique" description="Select simple">
                <div class="space-y-4">
                  <USelect
                    :items="[
                      { value: 'option1', label: 'Option 1' },
                      { value: 'option2', label: 'Option 2' },
                      { value: 'option3', label: 'Option 3' }
                    ]"
                    placeholder="Sélectionner..."
                  />
                </div>
              </ComponentCard>

              <ComponentCard title="Avec icônes" description="Options enrichies">
                <div class="space-y-4">
                  <USelect
                    :items="[
                      { value: 'user', label: 'Utilisateur', icon: 'i-lucide-user' },
                      { value: 'settings', label: 'Paramètres', icon: 'i-lucide-settings' },
                      { value: 'logout', label: 'Déconnexion', icon: 'i-lucide-log-out' }
                    ]"
                    placeholder="Choisir une action..."
                  />
                </div>
              </ComponentCard>
            </div>

            <ComponentCard title="Tailles" description="Différentes tailles disponibles">
              <div class="grid gap-4 sm:grid-cols-3">
                <USelect
                  :items="[{ value: '1', label: 'Small' }]"
                  size="sm"
                  placeholder="Small"
                />
                <USelect
                  :items="[{ value: '1', label: 'Medium' }]"
                  size="md"
                  placeholder="Medium"
                />
                <USelect
                  :items="[{ value: '1', label: 'Large' }]"
                  size="lg"
                  placeholder="Large"
                />
              </div>
            </ComponentCard>
          </div>
        </template>

        <!-- Badge Tab -->
        <template #badge>
          <div class="space-y-10">
            <SectionHeader
              title="Badge"
              description="Étiquettes pour statuts, catégories et notifications."
            />

            <ComponentCard title="Couleurs" description="Toutes les couleurs sémantiques">
              <div class="flex flex-wrap gap-3">
                <UBadge color="primary">
                  Primary
                </UBadge>
                <UBadge color="secondary">
                  Secondary
                </UBadge>
                <UBadge color="neutral">
                  Neutral
                </UBadge>
                <UBadge color="success">
                  Success
                </UBadge>
                <UBadge color="warning">
                  Warning
                </UBadge>
                <UBadge color="error">
                  Error
                </UBadge>
                <UBadge color="info">
                  Info
                </UBadge>
              </div>
            </ComponentCard>

            <ComponentCard title="Variantes" description="Solid, soft, subtle, outline">
              <div class="space-y-4">
                <div class="flex flex-wrap gap-3">
                  <UBadge color="primary" variant="solid">
                    Solid
                  </UBadge>
                  <UBadge color="primary" variant="soft">
                    Soft
                  </UBadge>
                  <UBadge color="primary" variant="subtle">
                    Subtle
                  </UBadge>
                  <UBadge color="primary" variant="outline">
                    Outline
                  </UBadge>
                </div>
                <div class="flex flex-wrap gap-3">
                  <UBadge color="success" variant="solid">
                    Solid
                  </UBadge>
                  <UBadge color="success" variant="soft">
                    Soft
                  </UBadge>
                  <UBadge color="success" variant="subtle">
                    Subtle
                  </UBadge>
                  <UBadge color="success" variant="outline">
                    Outline
                  </UBadge>
                </div>
              </div>
            </ComponentCard>

            <ComponentCard title="Tailles" description="sm, md, lg">
              <div class="flex flex-wrap items-center gap-3">
                <UBadge size="sm">
                  Small
                </UBadge>
                <UBadge size="md">
                  Medium
                </UBadge>
                <UBadge size="lg">
                  Large
                </UBadge>
              </div>
            </ComponentCard>
          </div>
        </template>

        <!-- Alert Tab -->
        <template #alert>
          <div class="space-y-10">
            <SectionHeader
              title="Alert"
              description="Messages de notification et feedback utilisateur."
            />

            <div class="space-y-4">
              <UAlert
                color="info"
                title="Information"
                description="Ceci est un message d'information pour l'utilisateur."
                icon="i-lucide-info"
              />
              <UAlert
                color="success"
                title="Succès"
                description="L'opération a été effectuée avec succès."
                icon="i-lucide-check-circle"
              />
              <UAlert
                color="warning"
                title="Attention"
                description="Veuillez vérifier les informations saisies."
                icon="i-lucide-alert-triangle"
              />
              <UAlert
                color="error"
                title="Erreur"
                description="Une erreur s'est produite lors du traitement."
                icon="i-lucide-x-circle"
              />
            </div>

            <ComponentCard title="Variantes" description="Solid, soft, subtle, outline">
              <div class="space-y-4">
                <UAlert
                  color="primary"
                  variant="solid"
                  title="Solid"
                  description="Variante solid avec fond plein."
                />
                <UAlert
                  color="primary"
                  variant="soft"
                  title="Soft"
                  description="Variante soft avec fond léger."
                />
                <UAlert
                  color="primary"
                  variant="subtle"
                  title="Subtle"
                  description="Variante subtle très discrète."
                />
                <UAlert
                  color="primary"
                  variant="outline"
                  title="Outline"
                  description="Variante outline avec bordure."
                />
              </div>
            </ComponentCard>
          </div>
        </template>

        <!-- Card Tab -->
        <template #card>
          <div class="space-y-10">
            <SectionHeader
              title="Card"
              description="3 familles de cards : Organic (80%), Glass (premium), Ops (dense). + modifier Ink pour CTA."
            />

            <!-- ORGANIC CARDS -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Organic Cards
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Cards standard — contenu principal (80% du produit)
              </p>

              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Organic Cozy -->
                <UCard variant="organic" class="rounded-blob-b">
                  <template #header>
                    <div>
                      <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
                        Liste des appels
                      </h4>
                      <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                        Panneau principal (filtres + recherche).
                      </p>
                    </div>
                  </template>
                  <div class="flex flex-wrap gap-2">
                    <UBadge variant="soft" color="neutral" size="sm">Période</UBadge>
                    <UBadge variant="soft" color="neutral" size="sm">Recherche</UBadge>
                    <UBadge variant="soft" color="neutral" size="sm">Fuseau</UBadge>
                  </div>
                </UCard>

                <!-- Organic KPI -->
                <UCard variant="organic" class="rounded-blob-a">
                  <template #header>
                    <div>
                      <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
                        KPI — Aujourd'hui
                      </h4>
                      <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                        Mini tuile dashboard (sans glass).
                      </p>
                    </div>
                  </template>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-xs font-bold uppercase tracking-[0.15em] text-[color:var(--color-brand-accent)]">Aujourd'hui</p>
                      <p class="font-serif text-4xl font-bold italic text-[color:var(--color-brand-primary)]">0</p>
                      <p class="text-sm text-[color:var(--color-brand-muted)]">appel(s) planifié(s)</p>
                    </div>
                    <div class="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--color-brand-solid)]">
                      <Icon name="lucide:sun" size="24" class="text-[color:var(--color-brand-accent)]" />
                    </div>
                  </div>
                </UCard>
              </div>

              <!-- Organic Interactive + Ink CTA -->
              <div class="grid gap-6 lg:grid-cols-2">
                <!-- Organic Interactive with corner-blob feel -->
                <UCard variant="organic" :interactive="true" class="rounded-blob-b">
                  <template #header>
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
                          Session Details
                        </h4>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                          Card interactive avec hover shadow + micro-lift.
                        </p>
                      </div>
                      <UButton variant="ghost" size="sm">Modifier</UButton>
                    </div>
                  </template>
                  <div class="space-y-3">
                    <div class="flex flex-wrap gap-2">
                      <UBadge variant="soft" color="neutral" size="sm">Demain</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">10:00–11:00</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">Visio</UBadge>
                    </div>
                    <p class="text-sm text-[color:var(--color-brand-muted)]">
                      Hover = shadow-floating + translateY(-1px).
                    </p>
                  </div>
                </UCard>

                <!-- Ink CTA Card -->
                <UCard variant="ink" :interactive="true" class="rounded-blob-b">
                  <template #header>
                    <div class="flex items-start justify-between gap-4">
                      <div>
                        <p class="text-xs font-bold uppercase tracking-[0.15em] text-white/70">Your Next Action</p>
                        <h4 class="mt-1 font-semibold text-white">
                          Réserver la prochaine session
                        </h4>
                        <p class="mt-1 text-sm text-white/70">
                          CTA card "ink" : rare, assumée, 1 max par écran.
                        </p>
                      </div>
                      <div class="flex h-10 w-10 items-center justify-center rounded-full bg-white/15">
                        <Icon name="lucide:sparkles" size="20" class="text-white" />
                      </div>
                    </div>
                  </template>
                  <template #footer>
                    <UButton color="secondary" size="sm">Réserver</UButton>
                  </template>
                </UCard>
              </div>
            </div>

            <!-- GLASS CARDS -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Glass Cards
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Sidebars / panels premium — à utiliser avec parcimonie
              </p>

              <!-- Panel wrap for glass demo -->
              <div class="rounded-blob-b bg-gradient-to-br from-[color:var(--color-kaora-100)] via-[color:var(--color-stone-100)] to-[color:var(--color-kaora-50)] p-8">
                <div class="grid gap-6 lg:grid-cols-2">
                  <!-- Glass Sidebar -->
                  <UCard variant="glass" class="rounded-blob-b">
                    <template #header>
                      <div>
                        <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
                          Calendrier
                        </h4>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                          Panneau latéral (blur + fond translucide).
                        </p>
                      </div>
                    </template>
                    <div class="space-y-4">
                      <!-- Nested organic card -->
                      <UCard variant="organic" density="compact" class="rounded-blob-c">
                        <template #header>
                          <div>
                            <h5 class="font-semibold text-[color:var(--color-brand-primary)]">janvier 2026</h5>
                            <p class="text-xs text-[color:var(--color-brand-muted)]">Mock calendrier</p>
                          </div>
                        </template>
                      </UCard>

                      <!-- Interactive nested card -->
                      <UCard variant="organic" density="compact" :interactive="true" class="rounded-blob-a">
                        <template #header>
                          <div class="flex items-center justify-between">
                            <div>
                              <h5 class="font-semibold text-[color:var(--color-brand-primary)]">Prochains appels</h5>
                              <p class="text-xs text-[color:var(--color-brand-muted)]">Aucun appel planifié</p>
                            </div>
                            <Icon name="lucide:arrow-right" size="18" class="text-[color:var(--color-brand-muted)]" />
                          </div>
                        </template>
                      </UCard>
                    </div>
                  </UCard>

                  <!-- Glass Interactive -->
                  <UCard variant="glass" :interactive="true" class="rounded-blob-d">
                    <template #header>
                      <div>
                        <h4 class="font-semibold text-[color:var(--color-brand-primary)]">
                          Panel "Glass" interactif
                        </h4>
                        <p class="mt-1 text-sm text-[color:var(--color-brand-muted)]">
                          Hover = floating shadow + micro lift.
                        </p>
                      </div>
                    </template>
                    <p class="text-sm text-[color:var(--color-brand-secondary)]">
                      Utilise ce style pour des modules "riches" (dashboard, navigation secondaire).
                      Le glass doit rester une intention — pas partout.
                    </p>
                  </UCard>
                </div>
              </div>
            </div>

            <!-- OPS CARDS -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Ops Cards
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Items denses (RDV / logs / listes). Rail gauche = statut.
              </p>

              <div class="space-y-3">
                <!-- Ops Brand Rail - Planifié -->
                <UCard variant="ops" density="tight" :interactive="true" :rail="true" rail-color="brand" class="rounded-blob-d">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-[color:var(--color-brand-primary)]">simon test</p>
                      <p class="text-sm text-[color:var(--color-brand-muted)]">31 déc. 2025, 09:30</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <UBadge variant="soft" color="primary" size="sm">Planifié</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">Lead</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">09:30</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">15 min</UBadge>
                    </div>
                  </div>
                </UCard>

                <!-- Ops Success Rail - Terminé -->
                <UCard variant="ops" density="tight" :rail="true" rail-color="success" class="rounded-blob-d">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-[color:var(--color-brand-primary)]">simon test</p>
                      <p class="text-sm text-[color:var(--color-brand-muted)]">9 janv. 2026, 09:30</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <UBadge variant="soft" color="success" size="sm">Terminé</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">Active</UBadge>
                    </div>
                  </div>
                </UCard>

                <!-- Ops Warning Rail -->
                <UCard variant="ops" density="tight" :rail="true" rail-color="warning" class="rounded-blob-d">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-[color:var(--color-brand-primary)]">marie dupont</p>
                      <p class="text-sm text-[color:var(--color-brand-muted)]">10 janv. 2026, 14:00</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <UBadge variant="soft" color="warning" size="sm">En attente</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">Lead</UBadge>
                    </div>
                  </div>
                </UCard>

                <!-- Ops Error Rail - Annulé (disabled) -->
                <UCard variant="ops" density="tight" :disabled="true" :rail="true" rail-color="error" class="rounded-blob-d">
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="font-semibold text-[color:var(--color-brand-primary)]">smoke test</p>
                      <p class="text-sm text-[color:var(--color-brand-muted)]">29 déc. 2025, 10:00</p>
                    </div>
                    <div class="flex flex-wrap gap-2">
                      <UBadge variant="soft" color="error" size="sm">Annulé</UBadge>
                      <UBadge variant="soft" color="neutral" size="sm">—</UBadge>
                    </div>
                  </div>
                </UCard>
              </div>
            </div>

            <!-- DENSITIES -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Densités
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                3 niveaux de padding : cozy (défaut), compact, tight
              </p>

              <div class="grid gap-6 lg:grid-cols-3">
                <UCard variant="organic" density="cozy" class="rounded-blob-b">
                  <template #header>
                    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">Cozy (défaut)</h4>
                  </template>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    Padding px-6 py-5 — panels principaux, sections.
                  </p>
                </UCard>

                <UCard variant="organic" density="compact" class="rounded-blob-b">
                  <template #header>
                    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">Compact</h4>
                  </template>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    Padding px-5 py-4 — cards imbriquées.
                  </p>
                </UCard>

                <UCard variant="organic" density="tight" class="rounded-blob-b">
                  <template #header>
                    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">Tight</h4>
                  </template>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    Padding px-4 py-3 — items ops, listes.
                  </p>
                </UCard>
              </div>
            </div>

            <!-- SHAPES (Rounded Blobs) -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Shapes (Organic Radii)
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                4 variantes de radius non-uniformes pour un feel organique
              </p>

              <div class="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                <UCard variant="organic" density="compact" class="rounded-blob-a">
                  <div class="text-center">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">Blob A</p>
                    <p class="text-xs text-[color:var(--color-brand-muted)]">Héros / premium</p>
                  </div>
                </UCard>

                <UCard variant="organic" density="compact" class="rounded-blob-b">
                  <div class="text-center">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">Blob B</p>
                    <p class="text-xs text-[color:var(--color-brand-muted)]">Sidebars / panneaux</p>
                  </div>
                </UCard>

                <UCard variant="organic" density="compact" class="rounded-blob-c">
                  <div class="text-center">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">Blob C</p>
                    <p class="text-xs text-[color:var(--color-brand-muted)]">Petites cards / tuiles</p>
                  </div>
                </UCard>

                <UCard variant="organic" density="compact" class="rounded-blob-d">
                  <div class="text-center">
                    <p class="font-semibold text-[color:var(--color-brand-primary)]">Blob D</p>
                    <p class="text-xs text-[color:var(--color-brand-muted)]">Items de liste (ops)</p>
                  </div>
                </UCard>
              </div>
            </div>

            <!-- STATES -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                États
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Interactive (hover/active/focus) et Disabled
              </p>

              <div class="grid gap-6 lg:grid-cols-2">
                <UCard variant="organic" :interactive="true" class="rounded-blob-b">
                  <template #header>
                    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">Interactive</h4>
                  </template>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    Hover → shadow-floating + micro-lift (-1px).
                    Active → scale(0.99).
                    Focus-visible → outline brand.
                  </p>
                </UCard>

                <UCard variant="organic" :disabled="true" class="rounded-blob-b">
                  <template #header>
                    <h4 class="font-semibold text-[color:var(--color-brand-primary)]">Disabled</h4>
                  </template>
                  <p class="text-sm text-[color:var(--color-brand-muted)]">
                    Opacity 55% + cursor not-allowed + pointer-events none.
                  </p>
                </UCard>
              </div>
            </div>

            <!-- ALL RAIL COLORS -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Rail Colors (Ops)
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                border-l-4 coloré par statut — lecture rapide
              </p>

              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <UCard variant="ops" density="tight" :rail="true" rail-color="neutral" class="rounded-blob-d">
                  <p class="text-center text-sm font-semibold text-[color:var(--color-brand-primary)]">Neutral</p>
                </UCard>
                <UCard variant="ops" density="tight" :rail="true" rail-color="brand" class="rounded-blob-d">
                  <p class="text-center text-sm font-semibold text-[color:var(--color-brand-primary)]">Brand</p>
                </UCard>
                <UCard variant="ops" density="tight" :rail="true" rail-color="success" class="rounded-blob-d">
                  <p class="text-center text-sm font-semibold text-[color:var(--color-brand-primary)]">Success</p>
                </UCard>
                <UCard variant="ops" density="tight" :rail="true" rail-color="warning" class="rounded-blob-d">
                  <p class="text-center text-sm font-semibold text-[color:var(--color-brand-primary)]">Warning</p>
                </UCard>
                <UCard variant="ops" density="tight" :rail="true" rail-color="error" class="rounded-blob-d">
                  <p class="text-center text-sm font-semibold text-[color:var(--color-brand-primary)]">Error</p>
                </UCard>
              </div>
            </div>
          </div>
        </template>

        <!-- Tabs Tab -->
        <template #tabs>
          <div class="space-y-10">
            <SectionHeader
              title="Tabs / Segmented"
              description="Choix rapides, comparatifs et mutuellement exclusifs. 2 à 5 options max."
            />

            <!-- SEGMENTED — TABS (Navigation) -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Segmented — Tabs
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Use case : pages (Semaine / Mois / Liste), sections, filtres haut niveau
              </p>

              <div class="flex flex-wrap items-start gap-6">
                <!-- Standard pill -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Pill (défaut)</p>
                  <UTabs
                    :items="tabsNavItems"
                    variant="pill"
                    size="md"
                    default-value="semaine"
                  />
                </div>

                <!-- Avec badges -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Avec badges</p>
                  <UTabs
                    :items="tabsWithBadgeItems"
                    variant="pill"
                    size="md"
                    default-value="articles"
                  />
                </div>
              </div>
            </div>

            <!-- SEGMENTED — TOGGLE GROUP (Filtres) -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Segmented — Toggle Group
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Use case : filtres multi-états (ex: "Annulés", "Payés", "À venir")
              </p>

              <div class="flex flex-wrap items-start gap-6">
                <!-- Filter group -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Filtres consultations</p>
                  <UTabs
                    :items="tabsFilterItems"
                    variant="pill"
                    size="md"
                    default-value="upcoming"
                  />
                </div>

                <!-- Small size -->
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Small (compact)</p>
                  <UTabs
                    :items="tabsPaymentItems"
                    variant="pill"
                    size="sm"
                    default-value="paid"
                  />
                </div>
              </div>
            </div>

            <!-- SIZES -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Tailles
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                sm = toolbar / filters · md = default · lg = landing / hero filters
              </p>

              <div class="flex flex-wrap items-end gap-6">
                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Small (36px)</p>
                  <UTabs
                    :items="[{ label: 'sm', value: 'sm' }, { label: 'Option', value: 'opt1' }, { label: 'Option', value: 'opt2' }]"
                    variant="pill"
                    size="sm"
                    default-value="sm"
                  />
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Medium (40px)</p>
                  <UTabs
                    :items="[{ label: 'md', value: 'md' }, { label: 'Option', value: 'opt1' }, { label: 'Option', value: 'opt2' }]"
                    variant="pill"
                    size="md"
                    default-value="md"
                  />
                </div>

                <div class="space-y-2">
                  <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Large (48px)</p>
                  <UTabs
                    :items="[{ label: 'lg', value: 'lg' }, { label: 'Option', value: 'opt1' }, { label: 'Option', value: 'opt2' }]"
                    variant="pill"
                    size="lg"
                    default-value="lg"
                  />
                </div>
              </div>
            </div>

            <!-- ICON-ONLY -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Icon-only
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Use case : toolbar actions (view mode). Toujours avec aria-label.
              </p>

              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Modes d'affichage</p>
                <UTabs
                  :items="tabsViewItems"
                  variant="pill"
                  size="md"
                  default-value="grid"
                />
              </div>
            </div>

            <!-- FULL WIDTH (MOBILE) -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Full width (Mobile)
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Pattern mobile : segmented full width, items flex-1. Grandes cibles tactiles (Fitts' Law).
              </p>

              <div class="max-w-md space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Période</p>
                <UTabs
                  :items="tabsPeriodItems"
                  variant="pill"
                  size="md"
                  default-value="today"
                  :ui="{ list: 'flex w-full', trigger: 'flex-1' }"
                />
                <p class="text-xs text-[color:var(--color-brand-muted)]">
                  Chaque item = grande cible tactile. Aucun micro-texte cliquable.
                </p>
              </div>
            </div>

            <!-- LINK VARIANT -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Link variant
              </h3>
              <p class="text-sm text-[color:var(--color-brand-muted)]">
                Style underline classique pour navigation secondaire
              </p>

              <div class="space-y-2">
                <p class="text-xs font-semibold uppercase tracking-wider text-[color:var(--color-brand-muted)]">Navigation secondaire</p>
                <UTabs
                  :items="tabsNavItems"
                  variant="link"
                  size="md"
                  default-value="semaine"
                />
              </div>
            </div>

            <!-- VARIANTS COMPARISON -->
            <div class="space-y-6">
              <h3 class="font-serif text-xl font-bold italic text-[color:var(--color-brand-primary)]">
                Comparaison des variantes
              </h3>

              <div class="grid gap-6 lg:grid-cols-2">
                <ComponentCard title="Pill (défaut)" description="Container pill + shadow-card">
                  <UTabs
                    :items="tabsFilterItems"
                    variant="pill"
                    size="md"
                    default-value="upcoming"
                  />
                </ComponentCard>

                <ComponentCard title="Link" description="Underline classique">
                  <UTabs
                    :items="tabsFilterItems"
                    variant="link"
                    size="md"
                    default-value="upcoming"
                  />
                </ComponentCard>

                <ComponentCard title="Pill Small" description="Taille compacte pour toolbar">
                  <UTabs
                    :items="tabsFilterItems"
                    variant="pill"
                    size="sm"
                    default-value="upcoming"
                  />
                </ComponentCard>

                <ComponentCard title="Pill Large" description="Taille hero pour landing">
                  <UTabs
                    :items="tabsFilterItems"
                    variant="pill"
                    size="lg"
                    default-value="upcoming"
                  />
                </ComponentCard>
              </div>
            </div>

            <!-- USAGE RULES -->
            <ComponentCard title="Règles d'utilisation" description="Un Segmented change un état, il ne déclenche pas une action">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-[color:var(--color-success)]">✓ Utiliser Segmented quand</p>
                  <ul class="space-y-1 text-sm text-[color:var(--color-brand-secondary)]">
                    <li>• 2 à 5 options maximum</li>
                    <li>• Options comparables et exclusives</li>
                    <li>• Décision rapide, fréquente</li>
                    <li>• Semaine / Mois / Liste</li>
                    <li>• À venir / Annulées / Passées</li>
                  </ul>
                </div>
                <div class="space-y-2">
                  <p class="text-sm font-semibold text-[color:var(--color-error)]">✗ Ne PAS utiliser quand</p>
                  <ul class="space-y-1 text-sm text-[color:var(--color-brand-secondary)]">
                    <li>• Plus de 5 options</li>
                    <li>• Hiérarchie complexe</li>
                    <li>• Descriptions longues</li>
                    <li>• Actions destructives</li>
                    <li>→ Utiliser Dropdown / List</li>
                  </ul>
                </div>
              </div>
            </ComponentCard>
          </div>
        </template>

        <!-- Link Tab -->
        <template #link>
          <div class="space-y-10">
            <SectionHeader
              title="Link"
              description="Liens de navigation internes et externes."
            />

            <ComponentCard title="Styles" description="Différents styles de liens">
              <div class="space-y-4">
                <p class="text-[color:var(--color-brand-secondary)]">
                  Texte avec un
                  <ULink to="#">
                    lien par défaut
                  </ULink>
                  au milieu.
                </p>
                <p class="text-[color:var(--color-brand-secondary)]">
                  Lien avec
                  <ULink to="#" class="font-semibold">
                    style personnalisé
                  </ULink>
                  en gras.
                </p>
              </div>
            </ComponentCard>

            <ComponentCard title="Avec icônes" description="Liens enrichis">
              <div class="flex flex-wrap gap-4">
                <ULink to="#" class="inline-flex items-center gap-2">
                  <Icon name="lucide:external-link" size="16" />
                  Lien externe
                </ULink>
                <ULink to="#" class="inline-flex items-center gap-2">
                  <Icon name="lucide:download" size="16" />
                  Télécharger
                </ULink>
                <ULink to="#" class="inline-flex items-center gap-2">
                  Documentation
                  <Icon name="lucide:arrow-right" size="16" />
                </ULink>
              </div>
            </ComponentCard>
          </div>
        </template>

        <!-- Colors Tab -->
        <template #colors>
          <div class="space-y-10">
            <SectionHeader
              title="Colors"
              description="Palette de couleurs sémantiques du design system."
            />

            <div class="grid gap-6 lg:grid-cols-2">
              <!-- Brand Colors -->
              <ComponentCard title="Brand Colors" description="Couleurs de marque Kaora">
                <div class="space-y-3">
                  <ColorSwatch name="--color-brand-primary" label="Primary" hex="#1c1917" />
                  <ColorSwatch name="--color-brand-secondary" label="Secondary" hex="#57534e" />
                  <ColorSwatch name="--color-brand-accent" label="Accent" hex="#7a6251" />
                  <ColorSwatch name="--color-brand-muted" label="Muted" hex="#a8a29e" />
                </div>
              </ComponentCard>

              <!-- Semantic Colors -->
              <ComponentCard title="Semantic Colors" description="Couleurs fonctionnelles">
                <div class="space-y-3">
                  <ColorSwatch name="--color-success" label="Success" hex="#b5c0a3" />
                  <ColorSwatch name="--color-warning" label="Warning" hex="#d97706" />
                  <ColorSwatch name="--color-error" label="Error" hex="#b60010" />
                  <ColorSwatch name="--color-info" label="Info" hex="#0284c7" />
                </div>
              </ComponentCard>
            </div>

            <!-- Surface Colors -->
            <ComponentCard title="Surface Colors" description="Couleurs de fond et surfaces">
              <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div class="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-page)] p-4 text-center">
                  <p class="text-xs font-semibold text-[color:var(--color-brand-primary)]">Page</p>
                  <p class="text-[10px] text-[color:var(--color-brand-muted)]">--color-surface-page</p>
                </div>
                <div class="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-card)] p-4 text-center">
                  <p class="text-xs font-semibold text-[color:var(--color-brand-primary)]">Card</p>
                  <p class="text-[10px] text-[color:var(--color-brand-muted)]">--color-surface-card</p>
                </div>
                <div class="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-surface-highlight)] p-4 text-center">
                  <p class="text-xs font-semibold text-[color:var(--color-brand-primary)]">Highlight</p>
                  <p class="text-[10px] text-[color:var(--color-brand-muted)]">--color-surface-highlight</p>
                </div>
                <div class="rounded-lg border border-[color:var(--color-border-soft)] bg-[color:var(--color-brand-solid)] p-4 text-center">
                  <p class="text-xs font-semibold text-[color:var(--color-brand-primary)]">Solid</p>
                  <p class="text-[10px] text-[color:var(--color-brand-muted)]">--color-brand-solid</p>
                </div>
              </div>
            </ComponentCard>

            <!-- CSS Variables Reference -->
            <ComponentCard title="Variables CSS" description="Référence technique">
              <div class="grid gap-4 font-mono text-xs sm:grid-cols-2">
                <CssVarDisplay var-name="--ui-primary" label="UI Primary" />
                <CssVarDisplay var-name="--ui-color-secondary-700" label="Secondary-700" />
                <CssVarDisplay var-name="--color-accent-main" label="Accent Main" />
                <CssVarDisplay var-name="--color-accent-contrast" label="Accent Contrast" />
              </div>
            </ComponentCard>
          </div>
        </template>
      </UTabs>
    </div>

    <!-- Footer -->
    <footer class="border-t border-[rgba(212,184,160,0.2)] bg-[color:var(--color-surface-card)]">
      <div class="mx-auto max-w-7xl px-6 py-8 lg:px-8">
        <div class="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <p class="text-sm text-[color:var(--color-brand-muted)]">
            Kaora Design System — Organic Luxury Theme
          </p>
          <p class="text-xs text-[color:var(--color-brand-muted)]">
            docs/03_uiux/kaora/COLOR_SYSTEM.md
          </p>
        </div>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import type { TabsItem } from '@nuxt/ui'

/**
 * Kaora Design System — Complete Component Showcase
 *
 * Interactive documentation for all Kaora design system components.
 * Organized by component type with live examples and variants.
 *
 * @architecture Clean Architecture — Presentation Layer
 * @author Remy Chopoya
 */

definePageMeta({
  layout: 'admin',
  middleware: 'auth-admin',
  pageTitle: 'Design System'
})

const activeTab = ref('button')

const tabItems: TabsItem[] = [
  { label: 'Button', value: 'button', slot: 'button' as const },
  { label: 'Input', value: 'input', slot: 'input' as const },
  { label: 'Select', value: 'select', slot: 'select' as const },
  { label: 'Badge', value: 'badge', slot: 'badge' as const },
  { label: 'Alert', value: 'alert', slot: 'alert' as const },
  { label: 'Card', value: 'card', slot: 'card' as const },
  { label: 'Tabs', value: 'tabs', slot: 'tabs' as const },
  { label: 'Link', value: 'link', slot: 'link' as const },
  { label: 'Colors', value: 'colors', slot: 'colors' as const }
]

// Tabs demo items
const tabsNavItems = [
  { label: 'Semaine', value: 'semaine' },
  { label: 'Mois', value: 'mois' },
  { label: 'Liste', value: 'liste' }
]

const tabsFilterItems = [
  { label: 'À venir', value: 'upcoming' },
  { label: 'Annulées', value: 'cancelled' },
  { label: 'Passées', value: 'past' }
]

const tabsPaymentItems = [
  { label: 'Tous', value: 'all' },
  { label: 'Payés', value: 'paid' },
  { label: 'En attente', value: 'pending' }
]

const tabsPeriodItems = [
  { label: "Aujourd'hui", value: 'today' },
  { label: '7 jours', value: 'week' },
  { label: '30 jours', value: 'month' }
]

const tabsViewItems = [
  { label: 'Grille', value: 'grid', icon: 'i-lucide-layout-grid' },
  { label: 'Liste', value: 'list', icon: 'i-lucide-list' },
  { label: 'Calendrier', value: 'calendar', icon: 'i-lucide-calendar-days' }
]

const tabsWithBadgeItems = [
  { label: 'Articles', value: 'articles', badge: '12' },
  { label: 'Recettes', value: 'recipes', badge: '7' },
  { label: 'Actus', value: 'news' }
]

const buttonColors = [
  { value: 'primary', title: 'Primary (Stone-900)', description: 'CTA principaux — stone-900 (#1c1917)' },
  { value: 'secondary', title: 'Secondary (Kaora-700)', description: 'Accents de marque — kaora-700 (#7a6251)' },
  { value: 'neutral', title: 'Neutral (Stone)', description: 'Actions neutres — stone palette' },
  { value: 'success', title: 'Success (Sage Green)', description: 'États positifs — sage green (#b5c0a3)' },
  { value: 'warning', title: 'Warning (Amber)', description: 'Alertes — amber tone' },
  { value: 'error', title: 'Error (Red)', description: 'Erreurs/danger — dark red (#b60010)' },
  { value: 'info', title: 'Info (Blue)', description: 'Informations — blue tone' }
]
</script>
