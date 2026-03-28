/**
 * useScrollReveal — lightweight IntersectionObserver composable for scroll-triggered animations.
 *
 * SSR-safe: content is visible by default (opacity: 1). On client mount,
 * `isReady` becomes true which enables the hide-before-reveal CSS via a
 * class binding on the component root element (scoped CSS compatible).
 *
 * Usage:
 *   const { reveal, isReady } = useScrollReveal()
 *   <div :class="{ 'js-scroll-ready': isReady }">
 *     <div v-bind="reveal()" class="scroll-reveal">...</div>
 *   </div>
 *
 * CSS classes:
 *   .scroll-reveal — base state (visible by default for SSR)
 *   .js-scroll-ready .scroll-reveal:not(.is-visible) — hidden (JS-enhanced)
 *   .scroll-reveal.is-visible — revealed state
 */
export function useScrollReveal(options?: { threshold?: number, rootMargin?: string }) {
  const threshold = options?.threshold ?? 0.15
  const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px'

  let observer: IntersectionObserver | null = null
  const isReady = ref(false)

  function createObserver(): IntersectionObserver {
    return new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement
            const delay = Number(el.dataset.revealDelay) || 0

            if (delay > 0) {
              setTimeout(() => el.classList.add('is-visible'), delay)
            } else {
              el.classList.add('is-visible')
            }

            observer!.unobserve(el)
          }
        }
      },
      { threshold, rootMargin }
    )
  }

  onMounted(() => {
    observer = createObserver()
    // Delay isReady by a frame so that ref callbacks have time to register
    // elements, and the browser has painted the initial state
    requestAnimationFrame(() => {
      isReady.value = true
    })
  })

  function reveal(opts?: { delay?: number }) {
    return {
      ref: (el: Element | ComponentPublicInstance | null) => {
        const htmlEl = (el as ComponentPublicInstance)?.$el ?? el
        if (!(htmlEl instanceof HTMLElement)) return

        if (opts?.delay) {
          htmlEl.dataset.revealDelay = String(opts.delay)
        }

        if (import.meta.server) {
          // SSR: mark as visible immediately so content renders
          htmlEl.classList.add('is-visible')
          return
        }

        // Always use nextTick to ensure observer is created (onMounted runs first)
        nextTick(() => {
          if (observer) {
            observer.observe(htmlEl)
          }
        })
      }
    }
  }

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { reveal, isReady }
}
