import { keovaButton } from './config/design-system/keova-button'
import { keovaCard } from './config/design-system/keova-card'
import { keovaColors } from './config/design-system/keova-colors'
import { keovaBadge } from './config/design-system/keova-badge'
import { keovaInput } from './config/design-system/keova-input'
import { keovaAlert } from './config/design-system/keova-alert'
import { keovaSelect } from './config/design-system/keova-select'
import { keovaTabs } from './config/design-system/keova-tabs'
import { keovaLink } from './config/design-system/keova-link'

export default defineAppConfig({
  ui: {
    colors: keovaColors,
    button: keovaButton,
    badge: keovaBadge,
    card: keovaCard,
    input: keovaInput,
    alert: keovaAlert,
    select: keovaSelect,
    tabs: keovaTabs,
    link: keovaLink
  }
})
