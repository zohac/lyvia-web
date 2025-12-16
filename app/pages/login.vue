<template>
  <UContainer class="py-10">
    <UCard>
      <template #header>
        <div class="flex items-center justify-between">
          <h1 class="text-lg font-semibold">
            Smoke Login
          </h1>
          <UButton
            to="/"
            variant="ghost"
            size="sm"
            label="Home"
          />
        </div>
      </template>

      <UForm
        :state="form"
        @submit.prevent="onSubmit"
      >
        <div class="grid gap-4">
          <UFormField label="Email">
            <UInput
              v-model="form.email"
              type="email"
              autocomplete="email"
            />
          </UFormField>

          <UFormField label="Password">
            <UInput
              v-model="form.password"
              type="password"
              autocomplete="current-password"
            />
          </UFormField>

          <div class="flex gap-2">
            <UButton
              type="submit"
              label="Login"
            />
            <UButton
              variant="outline"
              label="Call /auth/me"
              @click="callMe"
            />
          </div>

          <div
            v-if="error"
            class="text-sm text-red-600"
          >
            {{ error }}
          </div>

          <div
            v-if="result"
            class="text-sm"
          >
            <div class="font-semibold">
              Login response
            </div>
            <pre class="mt-2 overflow-auto rounded bg-gray-950/5 p-3 text-xs">{{ result }}</pre>
          </div>
        </div>
      </UForm>
    </UCard>
  </UContainer>
</template>

<script setup lang="ts">
const config = useRuntimeConfig()

const form = reactive({
  email: 'admin@example.com',
  password: 'ChangeMe123!'
})

const accessToken = useCookie<string | null>('access_token')
const result = ref<unknown>(null)
const error = ref<string | null>(null)

async function onSubmit() {
  error.value = null
  result.value = null

  try {
    const response = await $fetch<{ accessToken: string }>(`${config.public.apiBase}/auth/login`, {
      method: 'POST',
      body: form
    })

    accessToken.value = response.accessToken
    result.value = response
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Login failed'
  }
}

async function callMe() {
  error.value = null
  result.value = null

  if (!accessToken.value) {
    error.value = 'Missing access token. Login first.'
    return
  }

  try {
    const response = await $fetch(`${config.public.apiBase}/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken.value}`
      }
    })
    result.value = response
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Request failed'
  }
}
</script>
