/**
 * Formatage des dates de notification du back-office.
 *
 * Partagé par la liste (`AdminNotificationLogsPanel.vue`) et le détail
 * (`AdminNotificationLogDetail.vue`) : la ligne et le détail ne doivent pas
 * afficher deux dates différentes pour la même notification. Format fr-FR à la
 * seconde (jour/mois/année heure:minute:seconde), inchangé depuis l'extraction.
 */
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString)
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })
}
