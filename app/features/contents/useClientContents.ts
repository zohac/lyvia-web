import { onBeforeUnmount } from 'vue'
import { createClientContents } from './createClientContents'
import { listAccessibleContents } from './services/client-contents.service'

export async function useClientContents() {
  const contents = createClientContents({ list: listAccessibleContents })

  onBeforeUnmount(contents.dispose)

  await contents.refresh()

  return contents
}
