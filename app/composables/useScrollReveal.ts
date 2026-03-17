/**
 * useScrollReveal — lightweight IntersectionObserver composable for scroll-triggered animations.
 *
 * Usage:
 *   const { reveal } = useScrollReveal()
 *   <div v-bind="reveal()" class="scroll-reveal">...</div>
 *   <div v-bind="reveal({ delay: 200 })" class="scroll-reveal">...</div>
 *
 * CSS classes:
 *   .scroll-reveal — base state (hidden)
 *   .scroll-reveal.is-visible — revealed state
 */
export function useScrollReveal(options?: { threshold?: number, rootMargin?: string }) {
  const threshold = options?.threshold ?? 0.15
  const rootMargin = options?.rootMargin ?? '0px 0px -40px 0px'

  let observer: IntersectionObserver | null = null

  function getObserver(): IntersectionObserver | null {
    if (import.meta.server) return null
    if (observer) return observer

    observer = new IntersectionObserver(
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

    return observer
  }

  function reveal(opts?: { delay?: number }) {
    return {
      ref: (el: Element | ComponentPublicInstance | null) => {
        const htmlEl = (el as ComponentPublicInstance)?.$el ?? el
        if (!(htmlEl instanceof HTMLElement)) return

        if (opts?.delay) {
          htmlEl.dataset.revealDelay = String(opts.delay)
        }

        const obs = getObserver()
        if (obs) {
          nextTick(() => obs.observe(htmlEl))
        } else {
          // SSR fallback — show immediately
          htmlEl.classList.add('is-visible')
        }
      }
    }
  }

  onUnmounted(() => {
    observer?.disconnect()
    observer = null
  })

  return { reveal }
}
