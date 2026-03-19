<script setup lang="ts">
import type { FeaturedProvider } from '~/components/organisms/SpecialistCard.vue'
import SpecialistCard from '~/components/organisms/SpecialistCard.vue'
import NewsletterForm from '~/components/organisms/NewsletterForm.vue'

// OG image B2C — override global fallback (AC-9, AC-10)
useSeoMeta({
  ogImage: '/images/og-default-b2c.png'
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
    icon: 'i-lucide-brain'
  },
  {
    title: 'Un accompagnement sur mesure',
    text: 'Chaque femme vit la ménopause différemment. Un accompagnement personnalisé tient compte de votre quotidien, votre alimentation, votre stress.',
    icon: 'i-lucide-heart-handshake'
  },
  {
    title: 'Des spécialistes vérifiées',
    text: 'Les spécialistes sur Keova sont des professionnelles du bien-être formées et vérifiées. Pas du coaching généraliste.',
    icon: 'i-lucide-shield-check'
  },
  {
    title: 'Au-delà du médical',
    text: 'L\'accompagnement ménopause complète le suivi médical. Alimentation, gestion du stress, sommeil, mouvement — les 4 piliers.',
    icon: 'i-lucide-leaf'
  }
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="relative min-h-screen bg-[#faf8f6]">
    <!-- ==================== HERO ==================== -->
    <section class="relative overflow-hidden px-4 pb-16 pt-24 sm:pb-24 sm:pt-32">
      <!-- Ambient glow -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
      >
        <div
          class="absolute -left-[15%] -top-[10%] h-[60vh] w-[60vh] rounded-full opacity-40"
          style="background: radial-gradient(circle, rgba(212, 149, 106, 0.4), transparent 70%); filter: blur(80px);"
        />
        <div
          class="absolute -bottom-[15%] -right-[10%] h-[50vh] w-[50vh] rounded-full opacity-30"
          style="background: radial-gradient(circle, rgba(122, 107, 142, 0.35), transparent 70%); filter: blur(80px);"
        />
      </div>

      <div class="mx-auto max-w-3xl text-center">
        <p class="mb-6 text-sm font-medium uppercase tracking-widest text-[#d4956a]">
          Accompagnement ménopause
        </p>
        <h1 class="font-serif text-4xl leading-tight text-[#3d3250] sm:text-5xl lg:text-6xl">
          Trouvez votre spécialiste ménopause
        </h1>
        <p class="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-[#6b6177]">
          Accompagnement personnalisé par des spécialistes vérifiées.
          Périménopause, ménopause : vous n'êtes pas seule.
        </p>
        <div class="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <UButton
            size="lg"
            color="primary"
            @click="scrollTo('specialistes')"
          >
            Découvrir nos spécialistes
          </UButton>
        </div>
        <p class="mt-10 text-sm text-[#857d8c]">
          Plus de 10 millions de femmes en France traversent la ménopause
        </p>
      </div>
    </section>

    <!-- ==================== ÉDUCATION ==================== -->
    <section class="px-4 py-16 sm:py-24">
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl text-[#3d3250] sm:text-4xl">
          Pourquoi un accompagnement ?
        </h2>
        <div class="mt-12 grid gap-6 sm:grid-cols-2">
          <div
            v-for="bloc in educationBlocs"
            :key="bloc.title"
            class="rounded-2xl border border-[#e8e2ed] bg-white p-6 shadow-sm"
          >
            <div class="mb-4 grid size-12 place-items-center rounded-xl bg-[#f5f0fa]">
              <UIcon
                :name="bloc.icon"
                class="size-6 text-[#5b4b6e]"
              />
            </div>
            <h3 class="font-serif text-xl text-[#3d3250]">
              {{ bloc.title }}
            </h3>
            <p class="mt-2 text-sm leading-relaxed text-[#6b6177]">
              {{ bloc.text }}
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SPÉCIALISTES ==================== -->
    <section
      id="specialistes"
      class="bg-white px-4 py-16 sm:py-24"
    >
      <div class="mx-auto max-w-5xl">
        <h2 class="text-center font-serif text-3xl text-[#3d3250] sm:text-4xl">
          Nos spécialistes
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-center text-[#857d8c]">
          Des professionnelles formées à l'accompagnement de la ménopause.
        </p>

        <!-- Grid de cartes -->
        <div
          v-if="providers.length"
          class="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
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
          class="mt-12 text-center"
        >
          <UIcon
            name="i-lucide-users"
            class="mx-auto size-12 text-[#c4bdd0]"
          />
          <p class="mt-4 text-[#857d8c]">
            Nos spécialistes arrivent bientôt.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== SYMPTÔMES TEASER ==================== -->
    <section class="px-4 py-16 sm:py-24">
      <div class="mx-auto max-w-4xl">
        <h2 class="text-center font-serif text-3xl text-[#3d3250] sm:text-4xl">
          Symptômes courants
        </h2>
        <p class="mx-auto mt-4 max-w-lg text-center text-[#857d8c]">
          La ménopause se manifeste de nombreuses façons. Voici les plus fréquents.
        </p>
        <div class="mt-10 flex flex-wrap justify-center gap-4">
          <div
            v-for="s in symptoms"
            :key="s.label"
            class="flex items-center gap-2.5 rounded-full border border-[#e8e2ed] bg-white px-5 py-3 shadow-sm"
          >
            <UIcon
              :name="s.icon"
              class="size-5 text-[#d4956a]"
            />
            <span class="text-sm font-medium text-[#3d3250]">{{ s.label }}</span>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== NEWSLETTER ==================== -->
    <section class="bg-white px-4 py-16 sm:py-24">
      <div class="mx-auto max-w-lg text-center">
        <h2 class="font-serif text-3xl text-[#3d3250]">
          Recevez nos conseils ménopause
        </h2>
        <p class="mt-3 text-[#857d8c]">
          Guides, témoignages et actualités — 1 email par semaine.
        </p>
        <div class="mt-8">
          <NewsletterForm />
        </div>
      </div>
    </section>

    <!-- ==================== DISCLAIMER ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- ==================== FOOTER B2C ==================== -->
    <footer class="border-t border-[#e8e2ed] px-4 py-10">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-6 text-center">
        <p class="font-serif text-xl text-[#3d3250]">
          Keova
        </p>
        <nav class="flex flex-wrap justify-center gap-4 text-sm text-[#857d8c]">
          <NuxtLink
            to="/legal/cgu"
            class="hover:text-[#5b4b6e]"
          >
            CGU
          </NuxtLink>
          <NuxtLink
            to="/legal/mentions-legales"
            class="hover:text-[#5b4b6e]"
          >
            Mentions légales
          </NuxtLink>
          <NuxtLink
            to="/legal/confidentialite"
            class="hover:text-[#5b4b6e]"
          >
            Confidentialité
          </NuxtLink>
        </nav>
        <a
          href="https://keova.app"
          target="_blank"
          rel="noopener"
          class="text-sm font-medium text-[#d4956a] hover:underline"
        >
          Vous êtes praticienne ? Rejoignez Keova &rarr;
        </a>
        <p class="text-xs text-[#b5adc0]">
          &copy; {{ new Date().getFullYear() }} Keova
        </p>
      </div>
    </footer>
  </div>
</template>
