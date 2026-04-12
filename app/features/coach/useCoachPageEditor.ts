import { useProviderAccount } from '../account/useProviderAccount'
import { listCoachPageTemplates } from './services/coach-page-templates.service'
import { createCoachPageEditor } from './createCoachPageEditor'

export function useCoachPageEditor() {
  return createCoachPageEditor({
    providerAccount: useProviderAccount(),
    listTemplates: listCoachPageTemplates
  })
}
