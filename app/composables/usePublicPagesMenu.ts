import { apiFetch } from '~/services/api/apiFetch'

export interface PublicPageMenuItem {
  slug: string
  title: string
  menuLabel?: string | null
  includeInMenu: boolean
  sortOrder: number
  publishedAt: string
}

interface PublicPagesListResponse {
  pages: PublicPageMenuItem[]
}

export async function usePublicPagesMenu(providerSlug?: string) {
  const queryKey = providerSlug ? `public-pages-menu:${providerSlug}` : 'public-pages-menu'

  const { data: menuPages } = await useAsyncData<PublicPageMenuItem[]>(
    queryKey,
    async () => {
      try {
        const query: Record<string, string> = { menuOnly: 'true' }
        if (providerSlug) {
          query.providerSlug = providerSlug
        }
        const response = await apiFetch<PublicPagesListResponse>('/public/pages', {
          method: 'GET',
          query
        })
        return Array.isArray(response?.pages) ? response.pages : []
      } catch {
        return []
      }
    }
  )

  return {
    menuPages: computed(() => menuPages.value || [])
  }
}
