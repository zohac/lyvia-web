export type Support401Handler = () => Promise<void>

let activeHandler: Support401Handler | null = null

export function registerSupport401Handler(handler: Support401Handler): () => void {
  activeHandler = handler
  return () => {
    if (activeHandler === handler) {
      activeHandler = null
    }
  }
}

export async function invokeSupport401Handler(): Promise<void> {
  if (activeHandler) {
    await activeHandler()
  }
}

export function hasActiveSupport401Handler(): boolean {
  return activeHandler !== null
}
