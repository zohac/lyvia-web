const dateShortFmt = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
const dateTimeFmt = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

export function formatDateShort(isoString: string): string {
  return dateShortFmt.format(new Date(isoString))
}

export function formatDateTime(isoString: string): string {
  return dateTimeFmt.format(new Date(isoString))
}
