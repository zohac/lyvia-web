import { onBeforeUnmount, onMounted, ref } from 'vue'

type UseMediaQueryOptions = {
  /**
   * Value used during SSR and before hydration.
   * Defaults to `false`.
   */
  defaultValue?: boolean
}

export function useMediaQuery(query: string, options: UseMediaQueryOptions = {}) {
  const matches = ref<boolean>(options.defaultValue ?? false)

  if (import.meta.server) return matches

  let mediaQueryList: MediaQueryList | null = null

  const update = () => {
    matches.value = Boolean(mediaQueryList?.matches)
  }

  onMounted(() => {
    mediaQueryList = window.matchMedia(query)
    update()

    mediaQueryList.addEventListener('change', update)
  })

  onBeforeUnmount(() => {
    if (!mediaQueryList) return

    mediaQueryList.removeEventListener('change', update)

    mediaQueryList = null
  })

  return matches
}
