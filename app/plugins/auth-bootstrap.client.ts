export default defineNuxtPlugin(() => {
  const auth = useAuth()
  void auth.bootstrap()
})
