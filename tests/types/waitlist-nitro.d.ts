declare function useRuntimeConfig(): { apiBase?: string }
declare function $fetch<T>(url: string, options: {
  method: string
  body: Record<string, string>
  headers: Headers
}): Promise<T>
