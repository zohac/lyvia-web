import { defineNuxtPlugin } from '#app'

import AuthPageTemplate from '../components/templates/AuthPageTemplate.vue'
import DashboardShell from '../components/templates/DashboardShell.vue'
import AuthCard from '../components/organisms/AuthCard.vue'
import FormControl from '../components/molecules/FormControl.vue'
import PasswordCriteriaList from '../components/molecules/PasswordCriteriaList.vue'
import SystemAlert from '../components/atoms/SystemAlert.vue'
import CssVarDisplay from '../components/atoms/CssVarDisplay.vue'

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.component('AuthPageTemplate', AuthPageTemplate)
  nuxtApp.vueApp.component('DashboardShell', DashboardShell)
  nuxtApp.vueApp.component('AuthCard', AuthCard)
  nuxtApp.vueApp.component('FormControl', FormControl)
  nuxtApp.vueApp.component('PasswordCriteriaList', PasswordCriteriaList)
  nuxtApp.vueApp.component('SystemAlert', SystemAlert)
  nuxtApp.vueApp.component('CssVarDisplay', CssVarDisplay)
})
