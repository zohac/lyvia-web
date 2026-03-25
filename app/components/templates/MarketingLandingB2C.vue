<script setup lang="ts">
import type { FeaturedProvider } from '~/components/organisms/SpecialistCard.vue'
import SpecialistCard from '~/components/organisms/SpecialistCard.vue'
import LeadCaptureForm from '~/components/organisms/LeadCaptureForm.vue'
import { useScrollReveal } from '~/composables/useScrollReveal'

const { reveal } = useScrollReveal()

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
  { label: 'Bouffées de chaleur', icon: 'i-lucide-flame', desc: 'Vagues de chaleur soudaines' },
  { label: 'Troubles du sommeil', icon: 'i-lucide-moon', desc: 'Insomnies et réveils nocturnes' },
  { label: 'Prise de poids', icon: 'i-lucide-scale', desc: 'Changements métaboliques' },
  { label: 'Fatigue', icon: 'i-lucide-battery-low', desc: 'Épuisement persistant' },
  { label: 'Anxiété', icon: 'i-lucide-cloud-rain', desc: 'Stress et inquiétudes' }
]

// --- Éducation pillars ---
const pillars = [
  {
    num: '01',
    title: 'Ce n\'est pas dans votre tête',
    text: '77 % des femmes ne font pas le lien entre leurs symptômes et la ménopause. Bouffées de chaleur, insomnie, fatigue, anxiété — ce sont des symptômes réels qui méritent d\'être reconnus.',
    icon: 'i-lucide-brain'
  },
  {
    num: '02',
    title: 'Un accompagnement sur mesure',
    text: 'Chaque femme vit la ménopause différemment. Un accompagnement personnalisé tient compte de votre quotidien, votre alimentation, votre stress — pas un protocole générique.',
    icon: 'i-lucide-heart-handshake'
  },
  {
    num: '03',
    title: 'Des spécialistes vérifiées',
    text: 'Les spécialistes sur Keova sont des professionnelles du bien-être formées et vérifiées. Pas du coaching généraliste — de l\'expertise ciblée.',
    icon: 'i-lucide-shield-check'
  },
  {
    num: '04',
    title: 'Au-delà du médical',
    text: 'L\'accompagnement ménopause complète le suivi médical. Alimentation, gestion du stress, sommeil, mouvement — les 4 piliers d\'un bien-être durable.',
    icon: 'i-lucide-leaf'
  }
]

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div class="relative min-h-screen overflow-hidden bg-[#faf8f6]">
    <!-- ========= AMBIENT MESH (fixed, organic biophilic) ========= -->
    <div
      aria-hidden="true"
      class="pointer-events-none fixed inset-0 -z-10"
    >
      <div
        class="absolute -left-[20%] -top-[8%] h-[80vh] w-[80vh] rounded-full animate-drift-slow"
        style="background: radial-gradient(circle at 30% 40%, rgba(212,149,106,0.35), rgba(232,149,96,0.08) 55%, transparent 75%); filter: blur(100px);"
      />
      <div
        class="absolute -bottom-[12%] -right-[15%] h-[70vh] w-[70vh] rounded-full animate-drift-slow-reverse"
        style="background: radial-gradient(circle at 60% 60%, rgba(122,107,142,0.3), rgba(91,75,110,0.06) 55%, transparent 75%); filter: blur(110px);"
      />
      <div
        class="absolute left-[40%] top-[20%] h-[40vh] w-[55vh] -translate-x-1/2 rounded-full opacity-25"
        style="background: radial-gradient(ellipse, rgba(212,149,106,0.2), transparent 70%); filter: blur(120px);"
      />
    </div>

    <!-- ==================== HERO ==================== -->
    <section class="relative px-4 pb-24 pt-32 sm:pb-36 sm:pt-44">
      <div class="mx-auto max-w-3xl text-center">
        <!-- Eyebrow — appear stagger 0ms -->
        <div class="hero-appear mb-8 inline-flex items-center gap-2.5 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/8 px-5 py-2.5 shadow-sm">
          <span class="size-2 rounded-full bg-[#d4956a] animate-pulse" />
          <span class="text-sm font-semibold tracking-wide text-[#b07a4a]">Accompagnement ménopause</span>
        </div>

        <!-- H1 — appear stagger 120ms -->
        <h1 class="hero-appear stagger-1 font-serif text-[2.75rem] leading-[1.08] tracking-tight text-[#3d3250] sm:text-6xl lg:text-[4.25rem]">
          Trouvez votre
          <span class="relative inline-block">
            <span class="relative z-10">spécialiste</span>
            <svg
              class="hero-underline absolute -bottom-1 left-0 w-full"
              viewBox="0 0 200 12"
              preserveAspectRatio="none"
              aria-hidden="true"
            >
              <path
                d="M2 8 Q50 2 100 7 T198 5"
                fill="none"
                stroke="#d4956a"
                stroke-width="4.5"
                stroke-linecap="round"
                opacity="0.45"
              />
            </svg>
          </span>
          <br class="sm:hidden">
          ménopause
        </h1>

        <!-- Subtitle — appear stagger 240ms -->
        <p class="hero-appear stagger-2 mx-auto mt-8 max-w-lg text-lg leading-relaxed text-[#6b6177] sm:text-xl">
          Accompagnement personnalisé par des spécialistes vérifiées.
          <br class="hidden sm:block">
          Périménopause, ménopause : <strong class="font-semibold text-[#3d3250]">vous n'êtes pas seule.</strong>
        </p>

        <!-- CTA — appear stagger 400ms -->
        <div class="hero-appear stagger-3 mt-10">
          <button
            class="group relative cursor-pointer overflow-hidden rounded-full bg-gradient-to-r from-[#5b4b6e] via-[#6d5c82] to-[#7a6b8e] px-9 py-4 text-base font-semibold text-white shadow-lg shadow-[#5b4b6e]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#5b4b6e]/30 active:scale-[0.98]"
            @click="scrollTo('specialistes')"
          >
            <span class="relative z-10 flex items-center gap-2.5">
              Découvrir nos spécialistes
              <UIcon
                name="i-lucide-arrow-down"
                class="size-5 transition-transform duration-300 group-hover:translate-y-0.5"
              />
            </span>
          </button>
        </div>

        <!-- Social proof — appear stagger 600ms -->
        <div class="hero-appear stagger-4 mt-16 inline-flex items-center gap-3 rounded-full bg-white/60 px-5 py-2.5 shadow-sm backdrop-blur-sm">
          <div class="flex -space-x-1.5">
            <span class="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#d4956a] to-[#e89560] text-[10px] font-bold text-white ring-2 ring-white">10</span>
            <span class="grid size-7 place-items-center rounded-full bg-gradient-to-br from-[#5b4b6e] to-[#7a6b8e] text-[10px] font-bold text-white ring-2 ring-white">M+</span>
          </div>
          <span class="text-sm text-[#6b6177]">de femmes traversent la ménopause en France</span>
        </div>
      </div>
    </section>

    <!-- ==================== ACTE 2 — ÉDUCATION ==================== -->
    <section
      id="education"
      class="relative px-4 py-24 sm:py-32"
    >
      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Comprendre</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl lg:text-[2.75rem]">
            Pourquoi un accompagnement ?
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            La ménopause n'est pas une maladie. C'est une transition naturelle qui mérite un soutien adapté.
          </p>
        </div>

        <!-- Pillar cards — staggered scroll reveal, alternating directions -->
        <div class="mt-16 grid gap-5 sm:grid-cols-2">
          <div
            v-for="(p, i) in pillars"
            :key="p.num"
            v-bind="reveal({ delay: i * 120 })"
            :class="['scroll-reveal group relative overflow-hidden rounded-3xl border border-white/70 bg-white/70 p-8 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_40px_rgba(91,75,110,0.1)]', i % 2 === 0 ? 'reveal-from-left' : 'reveal-from-right']"
          >
            <!-- Organic corner accent -->
            <div
              class="absolute -right-6 -top-6 size-28 rounded-full bg-gradient-to-br from-[#d4956a]/10 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100"
              aria-hidden="true"
            />
            <div class="relative">
              <!-- Icon + number row -->
              <div class="mb-6 flex items-center justify-between">
                <div class="grid size-14 place-items-center rounded-2xl bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3] shadow-sm">
                  <UIcon
                    :name="p.icon"
                    class="size-7 text-[#5b4b6e]"
                  />
                </div>
                <span class="font-serif text-3xl font-light text-[#d4956a]/30">{{ p.num }}</span>
              </div>
              <h3 class="font-serif text-xl leading-snug text-[#3d3250] lg:text-[1.35rem]">
                {{ p.title }}
              </h3>
              <p class="mt-3 text-[0.9rem] leading-relaxed text-[#6b6177]">
                {{ p.text }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== SPÉCIALISTES ==================== -->
    <section
      id="specialistes"
      class="relative px-4 py-24 sm:py-32"
    >
      <!-- Subtle section bg -->
      <div
        aria-hidden="true"
        class="pointer-events-none absolute inset-0 -z-10"
        style="background: linear-gradient(180deg, transparent, rgba(122,107,142,0.04) 30%, rgba(122,107,142,0.04) 70%, transparent);"
      />

      <div class="mx-auto max-w-5xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Accompagnement</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl lg:text-[2.75rem]">
            Nos spécialistes
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            Des professionnelles formées à l'accompagnement de la ménopause et de la périménopause.
          </p>
        </div>

        <div
          v-if="providers.length"
          class="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3"
        >
          <SpecialistCard
            v-for="(prov, i) in providers"
            :key="prov.slug"
            v-bind="reveal({ delay: i * 150 })"
            class="scroll-reveal"
            :provider="prov"
          />
        </div>

        <!-- Empty state — inviting, not sterile -->
        <div
          v-else
          v-bind="reveal()"
          class="scroll-reveal mt-14 rounded-3xl border border-dashed border-[#d4956a]/20 bg-white/50 px-8 py-20 text-center backdrop-blur-sm"
        >
          <div class="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-gradient-to-br from-[#f5f0fa] to-[#ebe4f3]">
            <UIcon
              name="i-lucide-sparkles"
              class="size-9 text-[#7a6b8e]"
            />
          </div>
          <p class="font-serif text-2xl text-[#3d3250]">
            Nos spécialistes arrivent bientôt
          </p>
          <p class="mt-3 text-sm text-[#857d8c]">
            Inscrivez-vous pour être prévenue du lancement.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== SYMPTÔMES ==================== -->
    <section
      id="symptomes"
      class="relative px-4 py-24 sm:py-32"
    >
      <div class="mx-auto max-w-4xl">
        <div
          v-bind="reveal()"
          class="scroll-reveal mx-auto max-w-2xl text-center"
        >
          <span class="text-sm font-semibold uppercase tracking-[0.2em] text-[#d4956a]">Identifier</span>
          <h2 class="mt-4 font-serif text-3xl leading-tight text-[#3d3250] sm:text-4xl lg:text-[2.75rem]">
            Symptômes courants
          </h2>
          <p class="mt-5 text-base leading-relaxed text-[#857d8c]">
            La ménopause se manifeste de nombreuses façons. Les reconnaître, c'est le premier pas vers un mieux-être.
          </p>
        </div>

        <!-- Symptom cards — staggered scale-in reveal -->
        <div class="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div
            v-for="(s, i) in symptoms"
            :key="s.label"
            v-bind="reveal({ delay: i * 100 })"
            class="scroll-reveal reveal-scale group flex items-start gap-4 rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_2px_16px_rgba(0,0,0,0.03)] backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(91,75,110,0.08)]"
          >
            <div class="grid size-12 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[#d4956a]/12 to-[#e89560]/8">
              <UIcon
                :name="s.icon"
                class="size-6 text-[#d4956a]"
              />
            </div>
            <div>
              <p class="font-semibold text-[#3d3250]">
                {{ s.label }}
              </p>
              <p class="mt-0.5 text-sm text-[#857d8c]">
                {{ s.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ==================== ACTE 5 — LEAD CAPTURE ==================== -->
    <section class="relative px-4 py-24 sm:py-32">
      <div
        v-bind="reveal()"
        class="scroll-reveal reveal-clip mx-auto max-w-3xl overflow-hidden rounded-[2rem] bg-gradient-to-br from-[#3d3250] via-[#4a3d5e] to-[#5b4b6e] p-10 shadow-2xl shadow-[#3d3250]/20 sm:p-14"
      >
        <!-- Decorative glows -->
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -right-12 -top-12 size-56 rounded-full opacity-30"
          style="background: radial-gradient(circle, rgba(212,149,106,0.5), transparent 70%); filter: blur(50px);"
        />
        <div
          aria-hidden="true"
          class="pointer-events-none absolute -bottom-8 -left-8 size-40 rounded-full opacity-20"
          style="background: radial-gradient(circle, rgba(122,107,142,0.6), transparent 70%); filter: blur(40px);"
        />
        <div class="relative text-center">
          <h2 class="font-serif text-3xl text-white sm:text-4xl">
            Recevez nos conseils ménopause
          </h2>
          <p class="mt-4 text-base leading-relaxed text-[#c4bdd0]">
            Guides pratiques, témoignages et actualités — 1 email par semaine, sans spam.
          </p>
          <div class="mx-auto mt-10 max-w-md">
            <LeadCaptureForm />
          </div>
          <p class="mt-6 text-xs text-[#9685ab]">
            Données hébergées en France. Conforme RGPD. Désinscription en un clic.
          </p>
        </div>
      </div>
    </section>

    <!-- ==================== DISCLAIMER ==================== -->
    <AtomsMedicalDisclaimer />

    <!-- ==================== FOOTER B2C ==================== -->
    <footer class="border-t border-[#e8e2ed]/50 bg-[#faf8f6] px-4 py-14">
      <div class="mx-auto flex max-w-5xl flex-col items-center gap-7 text-center">
        <!-- Brand -->
        <p class="font-serif text-2xl tracking-tight text-[#3d3250]">
          Keova
        </p>

        <!-- Legal nav -->
        <nav class="flex flex-wrap justify-center gap-5 text-sm text-[#857d8c]">
          <NuxtLink
            to="/legal/cgu"
            class="transition-colors duration-200 hover:text-[#5b4b6e]"
          >
            CGU
          </NuxtLink>
          <NuxtLink
            to="/legal/mentions-legales"
            class="transition-colors duration-200 hover:text-[#5b4b6e]"
          >
            Mentions légales
          </NuxtLink>
          <NuxtLink
            to="/legal/confidentialite"
            class="transition-colors duration-200 hover:text-[#5b4b6e]"
          >
            Confidentialité
          </NuxtLink>
        </nav>

        <!-- Cross-domain CTA -->
        <a
          href="https://keova.app"
          target="_blank"
          rel="noopener"
          class="inline-flex cursor-pointer items-center gap-2 rounded-full border border-[#d4956a]/20 bg-[#d4956a]/8 px-6 py-2.5 text-sm font-semibold text-[#b07a4a] transition-colors duration-200 hover:bg-[#d4956a]/15"
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
/* Hero staggered appear — 21st.dev inspired */
@keyframes appear {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.hero-appear {
  animation: appear 0.7s cubic-bezier(0.16, 1, 0.3, 1) backwards;
}
.stagger-1 { animation-delay: 120ms; }
.stagger-2 { animation-delay: 240ms; }
.stagger-3 { animation-delay: 400ms; }
.stagger-4 { animation-delay: 600ms; }

/* SVG underline draw */
@keyframes draw-underline {
  from { stroke-dashoffset: 300; }
  to { stroke-dashoffset: 0; }
}

.hero-underline path {
  stroke-dasharray: 300;
  animation: draw-underline 1s ease-out 0.5s backwards;
}

/* Ambient mesh drift */
@keyframes drift-slow {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(15px, -10px); }
  66% { transform: translate(-10px, 8px); }
}

@keyframes drift-slow-reverse {
  0%, 100% { transform: translate(0, 0); }
  33% { transform: translate(-12px, 8px); }
  66% { transform: translate(10px, -12px); }
}

.animate-drift-slow {
  animation: drift-slow 20s ease-in-out infinite;
}

.animate-drift-slow-reverse {
  animation: drift-slow-reverse 25s ease-in-out infinite;
}

/* ========= SCROLLTELLING — IntersectionObserver driven ========= */

/* Base: fade up (default) */
.scroll-reveal {
  opacity: 0;
  transform: translateY(32px);
  transition:
    opacity 0.8s cubic-bezier(0.16, 1, 0.3, 1),
    transform 0.8s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: opacity, transform;
}

.scroll-reveal.is-visible {
  opacity: 1;
  transform: translateY(0) translateX(0) scale(1);
}

/* Variant: slide from left (education cards — even) */
.scroll-reveal.reveal-from-left {
  transform: translateX(-40px) translateY(0);
}

/* Variant: slide from right (education cards — odd) */
.scroll-reveal.reveal-from-right {
  transform: translateX(40px) translateY(0);
}

/* Variant: scale in (symptom pills) */
.scroll-reveal.reveal-scale {
  transform: scale(0.9) translateY(0);
}

/* Variant: clip reveal (lead capture dark section) */
.scroll-reveal.reveal-clip {
  transform: translateY(48px);
}

/* Respect reduced motion */
@media (prefers-reduced-motion: reduce) {
  .hero-appear,
  .hero-underline path,
  .animate-drift-slow,
  .animate-drift-slow-reverse {
    animation: none;
  }
  .hero-appear {
    opacity: 1;
    transform: none;
  }
  .scroll-reveal {
    opacity: 1;
    transform: none;
    transition: none;
  }
}
</style>
