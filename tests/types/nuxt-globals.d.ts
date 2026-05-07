declare function useState<T>(key: string, init?: () => T): { value: T }
declare function useCookie<T>(name: string, options?: unknown): { value: T }
