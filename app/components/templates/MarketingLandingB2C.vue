<script setup lang="ts">
import type { FeaturedProvider } from '~/components/organisms/SpecialistCard.vue'
import SpecialistCard from '~/components/organisms/SpecialistCard.vue'
import NewsletterForm from '~/components/organisms/NewsletterForm.vue'

// OG image B2C — override global fallback (AC-9, AC-10)
useSeoMeta({
  ogImage: '/images/og-default-b2c.png'
})

// Hide the layout footer — B2C has its own footer
const hideLayoutFooter = useState('hide-layout-footer', () => false)
hideLayoutFooter.value = true
onUnmounted(() => {
  hideLayoutFooter.value = false
})

// --- Providers featured (SSR-compatible) ---
const { data: featuredData } = await useFetch<{ providers: FeaturedProvider[] }>('/api/public/providers/featured', {
  default: () => ({ providers: [] })
})
const providers = computed(() => featuredData.value?.providers ?? [])

// --- Symptômes teaser (hardcodés V1 — dynamiques quand Epic U2 arrive) ---
const symptoms = [
  { label: 'Bouffées de chaleur', icon: 'i-lucide-flame' },
  { label: 'Troubles du sommeil', icon: 'i-lucide-moon' },
  { label: 'Prise de poids', icon: 'i-lucide-scale' },
  { label: 'Fatigue', icon: 'i-lucide-battery-low' },
  { label: 'Anxiété', icon: 'i-lucide-cloud-rain' }
]

// --- Éducation blocs ---
const educationBlocs = [
  {
    title: 'Ce n\'est pas dans votre tête',
    text: '77 % des femmes ne font pas le lien entre leurs symptômes et la ménopause. Bouffées de chaleur, insomnie, fatigue, anxiété — ce sont des symptômes réels.',
    icon: 'i-lucide-brain',
    accent: 'from-[#d4956a]/20 to-[#e89560]/10'
  },
  {
    title: 'Un accompagnement sur mesure',
    text: 'Chaque femme vit la ménopause différemment. Un accompagnement personnalisé tient compte de votre quotidien, votre alimentation, votre stress.',
    icon: 'i-lucide-heart-handshake',
    accent: 'from-[#7a6b8e]/20 to-[#5b4b6e]/10'
  },
  {
    title: 'Des spécialistes vérifiées',
    text: 'Les spécialistes sur Keova sont des professionnelles du bien-être formées et vérifiées. Pas du coaching généraliste.',
    icon: 'i-lucide-shield-check',
    accent: 'from-[#d4956a]/20 to-[#e89560]/10'
  },
  {
    title: 'Au-delà du médical',
    text: 'L\'accompagnement ménopause complète le suivi médical. Alimentation, gestion du stress, sommeil, mouvement — les 4 piliers.',
    icon: 'i-lucide-leaf',
    accent: 'from-[#7a6b8e]/20 to-[#5b4b6e]/10'
  }
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#faf8f6]">
    <!-- ==================== AMBIENT MESH ==================== -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <div
        class="absolute -left-[20%] -top-[10%] h-[80vh] w-[80vh] rounded-full opacity-50 animate-pulse-slow"
        style="background: radial-gradient(circle at 30% 30%, rgba(212, 149, 106, 0.45), rgba(232, 149, 96, 0.12) 50%, transparent 70%); filter: blur(100px);"
      />
      <div
        class="absolute -bottom-[15%] -right-[15%] h-[70vh] w-[70vh] rounded-full opacity-40"
        style="background: radial-gradient(circle at 70% 70%, rgba(122, 107, 142, 0.4), rgba(91, 75, 110, 0.1) 50%, transparent 70%); filter: blur(100px);"
      />
      <div
        class="absolute left-1/2 top-1/4 h-[50vh] w-[70vh] -translate-x-1/2 rounded-full opacity-20"
        style="background: radial-gradient(ellipse, rgba(212, 149, 106, 0.25), transparent 70%); filter: blur(120px);"
      />
    </div>

    <!-- ==================== HERO ==================== -->
    <section class="relative px-4 pb-20 pt-28 sm:pb-32 sm:pt-40">
      <div class="mx-auto max-w-3xl text-center">
        <!-- Eyebrow -->
        <div class="mb-8 inline-flex items-center gap-2 rounded-full bg-[#d4956a]/10 px-4 py-2 text-sm font-medium text-[#c07d4e]">
          <span class="size-1.5 rounded-full bg-[#d4956a] animate-pulse" />
          Accompagnement ménopause
        </div>

        <h1 class="font-serif text-5xl leading-[1.1] tracking-tight text-[#3d3250] sm:text-6xl lg:text-7xl">
          Trouvez votre
          <span class="relative">
            <span class="relative z-10">spécialiste</span>
            <span
              class="absolute -bottom-1 left-0 -z-0 h-3 w-full rounded-full bg-[#d4956a]/25"
              aria-hidden="true"
            />
          </span>
          <br>
          ménopause
        </h1>

        <p class="mx-auto mt-8 max-w-xl text-lg leading-relaxed text-[#6b6177] sm:text-xl">
          Accompagnement personnalisé par des spécialistes vérifiées.
          <br class="hidden sm:block">
          Périménopause, ménopause : <strong class="font-semibold text-[#3d3250]">vous n'êtes pas seule.</strong>
        </p>

        <div class="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <button
            class="group relative overflow-hidden rounded-full bg-gradient-to-r from-[#5b4b6e] to-[#7a6b8e] px-8 py-4 text-base font-semibold text-white shadow-lg shadow-[#5b4b6e]/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#5b4b6e]/30"
            @click="scrollTo('specialistes')"
          >
            <span class="relative z-10 flex items-center gap-2">
              Découvrir nos spécialistes
              <UIcon
                name="i-lucide-arrow-down"
                class="size-5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </span>
          </button>
        </div>

        <!-- Social proof stat -->
        <div class="mt-14 flex items-center justify-center gap-3">
          <div class="flex -space-x-2">
            <div class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#d4956a] to-[#e89560] text-xs font-bold text-white ring-2 ring-[#faf8f6]">
              10
            </div>
            <div class="grid size-8 place-items-center rounded-full bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e] text-xs font-bold text-white ring-2 ring-[#faf8f6]">
              M
            </div>
          </div>
          <p class="text-sm text-[#857d8c]">
            Plus de 10 millions de femmes en France traversent la ménopause
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== ÉDUCATION ==================== -->
    <section
      id="education"
      class="relative px-4 py-20 sm:py-28"
    >
      <div class="mx-auto max-w-5xl">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-[#d4956a]">
            Comprendre
          </p>
          <h2 class="mt-3 font-serif text-3xl text-[#3d3250] sm:text-4xl lg:text-5xl">
            Pourquoi un accompagnement ?
          </h2>
          <p class="mt-4 text-[#857d8c]">
            La ménopause n'est pas une maladie. C'est une transition naturelle qui mérite un soutien adapté.
          </p>
        </div>

        <div class="mt-14 grid gap-5 sm:grid-cols-2">
          <div
            v-for="(bloc, i) in educationBlocs"
            :key="bloc.title"
            class="group relative overflow-hidden rounded-3xl border border-white/60 bg-white/80 p-7 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
          >
            <!-- Accent gradient corner -->
            <div
              :class="['absolute -right-8 -top-8 size-32 rounded-full bg-gradient-to-br opacity-60 transition-opacity duration-300 group-hover:opacity-100', bloc.accent]"
              aria-hidden="true"
            />
            <div class="relative">
              <div class="mb-5 grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3]">
                <UIcon
                  :name="bloc.icon"
                  class="size-7 text-[#5b4b6e]"
                />
              </div>
              <span class="mb-2 block text-xs font-bold uppercase tracking-wider text-[#d4956a]">
                {{ String(i + 1).padStart(2, '0') }}
              </span>
              <h3 class="font-serif text-xl text-[#3d3250] lg:text-2xl">
                {{ bloc.title }}
              </h3>
              <p class="mt-3 text-sm leading-relaxed text-[#6b6177]">
                {{ bloc.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SPÉCIALISTES ==================== -->
    <section
      id="specialistes"
      class="relative overflow-hidden px-4 py-20 sm:py-28"
    >
      <!-- Section background -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-[#f5f0fa]/30 to-white"
      />

      <div class="mx-auto max-w-5xl">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-[#d4956a]">
            Accompagnement
          </p>
          <h2 class="mt-3 font-serif text-3xl text-[#3d3250] sm:text-4xl lg:text-5xl">
            Nos spécialistes
          </h2>
          <p class="mt-4 text-[#857d8c]">
            Des professionnelles formées à l'accompagnement de la ménopause et de la périménopause.
          </p>
        </div>

        <!-- Grid de cartes -->
        <div
          v-if="providers.length"
          class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SpecialistCard
            v-for="p in providers"
            :key="p.slug"
            :provider="p"
          />
        </div>

        <!-- Empty state -->
        <div
          v-else
          class="mt-14 rounded-3xl border border-dashed border-[#d7cfdf] bg-white/50 px-8 py-16 text-center backdrop-blur-sm"
        >
          <div class="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-[#f5f0fa]">
            <UIcon
              name="i-lucide-users"
              class="size-8 text-[#7a6b8e]"
            />
          </div>
          <p class="font-serif text-xl text-[#3d3250]">
            Nos spécialistes arrivent bientôt
          </p>
          <p class="mt-2 text-sm text-[#857d8c]">
            Inscrivez-vous à la newsletter pour être prévenue.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== SYMPTÔMES ==================== -->
    <section
      id="symptomes"
      class="relative px-4 py-20 sm:py-28"
    >
      <div class="mx-auto max-w-4xl">
        <div class="mx-auto max-w-2xl text-center">
          <p class="text-sm font-medium uppercase tracking-widest text-[#d4956a]">
            Identifier
          </p>
          <h2 class="mt-3 font-serif text-3xl text-[#3d3250] sm:text-4xl lg:text-5xl">
            Symptômes courants
          </h2>
          <p class="mt-4 text-[#857d8c]">
            La ménopause se manifeste de nombreuses façons. Les reconnaître, c'est le premier pas.
          </p>
        </div>
        <div class="mt-12 flex flex-wrap justify-center gap-3">
          <div
            v-for="s in symptoms"
            :key="s.label"
            class="group flex items-center gap-3 rounded-2xl border border-white/60 bg-white/80 px-6 py-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md"
          >
            <div class="grid size-10 place-items-center rounded-xl bg-gradient-to-br from-[#d4956a]/15 to-[#e89560]/10">
              <UIcon
                :name="s.icon"
                class="size-5 text-[#d4956a]"
              />
            </div>
            <span class="text-sm font-semibold text-[#3d3250]">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== NEWSLETTER ==================== -->
    <section class="relative px-4 py-20 sm:py-28">
      <!-- Dark section -->
      <div class="mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3d3250] via-[#4d3f5c] to-[#5b4b6e] p-10 shadow-2xl sm:p-14">
        <!-- Decorative glow -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full opacity-30"
          style="background: radial-gradient(circle, rgba(212, 149, 106, 0.5), transparent 70%); filter: blur(60px);"
        />
        <div class="relative text-center">
          <h2 class="font-serif text-3xl text-white sm:text-4xl">
            Recevez nos conseils ménopause
          </h2>
          <p class="mt-3 text-[#c4bdd0]">
            Guides, témoignages et actualités — 1 email par semaine, sans spam.
          </p>
          <div class="mx-auto mt-8 max-w-md">
            <NewsletterForm />
          </div>
          <p class="mt-5 text-xs text-[#9685ab]">
            Données hébergées en France. Conforme RGPD. Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== DISCLAIMER ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- ==================== FOOTER B2C ==================== -->
    <footer class="border-t border-[#e8e2ed]/60 bg-[#faf8f6] px-4 py-12">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <p class="font-serif text-2xl text-[#3d3250]">
          Keova
        </p>
        <nav class="flex flex-wrap justify-center gap-5 text-sm text-[#857d8c]">
          <NuxtLink
            to="/legal/cgu"
            class="transition-colors hover:text-[#5b4b6e]"
          >
            CGU
          </NuxtLink>
          <NuxtLink
            to="/legal/mentions-legales"
            class="transition-colors hover:text-[#5b4b6e]"
          >
            Mentions légales
          </NuxtLink>
          <NuxtLink
            to="/legal/confidentialite"
            class="transition-colors hover:text-[#5b4b6e]"
          >
            Confidentialité
          </NuxtLink>
        </nav>
        <a
          href="https://keova.app"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1.5 rounded-full bg-[#d4956a]/10 px-5 py-2 text-sm font-medium text-[#c07d4e] transition-colors hover:bg-[#d4956a]/20"
        >
          Vous êtes praticienne ? Rejoignez Keova
          <UIcon
            name="i-lucide-arrow-right"
            class="size-4"
          />
        </a>
        <p class="text-xs text-[#b5adc0]">
          &copy; {{ new Date().getFullYear() }} Keova
        </p>
      </div>
    </footer>
  </div>
</template>

<style scoped>
@keyframes pulse-slow {
  0%, 100% { opacity: 0.5; }
  50% { opacity: 0.35; }
}

.animate-pulse-slow {
  animation: pulse-slow 8s ease-in-out infinite;
}
</style>
