<script setup lang="ts">
import FormControl from './FormControl.vue'

type IdentityModel = {
  firstname: string
  lastname: string
  email: string
  phone: string
}

type ConsentsModel = {
  legalAccepted: boolean
  emailMarketingOptIn: boolean
  smsMarketingOptIn: boolean
}

const props = defineProps<{
  disabled?: boolean
  modelValue: IdentityModel
  consents: ConsentsModel
  errors?: Partial<Record<'firstname' | 'lastname' | 'email' | 'phone' | 'legalAccepted', string>>
}>()

const emit = defineEmits<{
  'update:modelValue': [value: IdentityModel]
  'update:consents': [value: ConsentsModel]
}>()

function updateField<K extends keyof IdentityModel>(key: K, value: string) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
}

function updateConsent<K extends keyof ConsentsModel>(key: K, value: boolean) {
  emit('update:consents', { ...props.consents, [key]: value })
}
</script>

<template>
  <div class="grid gap-5">
    <div class="grid gap-4 sm:grid-cols-2">
      <FormControl
        id="firstname"
        v-slot="slotProps"
        label="Prénom"
        :required="true"
        :error="errors?.firstname"
      >
        <input
          v-bind="slotProps?.inputAttrs ?? { id: 'firstname' }"
          :disabled="disabled"
          name="firstname"
          type="text"
          autocomplete="given-name"
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
          "
          :value="modelValue.firstname"
          @input="updateField('firstname', ($event.target as HTMLInputElement).value)"
        >
      </FormControl>

      <FormControl
        id="lastname"
        v-slot="slotProps"
        label="Nom"
        :required="true"
        :error="errors?.lastname"
      >
        <input
          v-bind="slotProps?.inputAttrs ?? { id: 'lastname' }"
          :disabled="disabled"
          name="lastname"
          type="text"
          autocomplete="family-name"
          class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
          :class="
            slotProps?.invalid
              ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
              : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
          "
          :value="modelValue.lastname"
          @input="updateField('lastname', ($event.target as HTMLInputElement).value)"
        >
      </FormControl>
    </div>

    <FormControl
      id="email"
      v-slot="slotProps"
      label="Adresse e-mail"
      :required="true"
      :error="errors?.email"
    >
      <input
        v-bind="slotProps?.inputAttrs ?? { id: 'email' }"
        :disabled="disabled"
        name="email"
        type="email"
        inputmode="email"
        autocomplete="email"
        class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
        :class="
          slotProps?.invalid
            ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
            : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
        "
        :value="modelValue.email"
        @input="updateField('email', ($event.target as HTMLInputElement).value)"
      >
    </FormControl>

    <FormControl
      id="phone"
      v-slot="slotProps"
      label="Téléphone"
      :required="true"
      :error="errors?.phone"
    >
      <input
        v-bind="slotProps?.inputAttrs ?? { id: 'phone' }"
        :disabled="disabled"
        name="phone"
        type="tel"
        inputmode="tel"
        autocomplete="tel"
        placeholder="+33 6 12 34 56 78"
        class="h-12 w-full rounded-[var(--radius-sm)] border bg-[color:var(--color-surface-card)] px-4 text-base text-[color:var(--color-brand-primary)] placeholder:text-[color:var(--color-brand-secondary)] placeholder:opacity-60 shadow-none transition-[border-color,box-shadow] duration-150 ease-in-out focus:outline-none focus:ring-4"
        :class="
          slotProps?.invalid
            ? 'border-[color:var(--color-error)] focus:ring-[rgba(186,63,63,0.18)]'
            : 'border-[color:var(--color-brand-subtle)] focus:border-[color:var(--color-accent-main)] focus:ring-[rgba(200,121,100,0.2)]'
        "
        :value="modelValue.phone"
        @input="updateField('phone', ($event.target as HTMLInputElement).value)"
      >
    </FormControl>

    <div class="grid gap-3">
      <label class="flex items-start gap-3">
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-[color:var(--color-brand-subtle)] text-[color:var(--color-accent-main)] focus:ring-4 focus:ring-[rgba(200,121,100,0.2)]"
          :checked="consents.legalAccepted"
          :disabled="disabled"
          @change="updateConsent('legalAccepted', ($event.target as HTMLInputElement).checked)"
        >
        <span class="text-sm text-[color:var(--color-brand-primary)]">
          J’accepte les conditions générales d’utilisation et la politique de confidentialité.
          <span class="font-semibold text-[color:var(--color-error)]">*</span>
        </span>
      </label>

      <p
        v-if="errors?.legalAccepted"
        class="text-sm text-[color:var(--color-error)]"
      >
        {{ errors.legalAccepted }}
      </p>

      <label class="flex items-start gap-3">
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-[color:var(--color-brand-subtle)] text-[color:var(--color-accent-main)] focus:ring-4 focus:ring-[rgba(200,121,100,0.2)]"
          :checked="consents.emailMarketingOptIn"
          :disabled="disabled"
          @change="updateConsent('emailMarketingOptIn', ($event.target as HTMLInputElement).checked)"
        >
        <span class="text-sm text-[color:var(--color-brand-primary)]">
          Je souhaite recevoir des conseils bien-être par email (optionnel).
        </span>
      </label>

      <label class="flex items-start gap-3">
        <input
          type="checkbox"
          class="mt-1 h-4 w-4 rounded border-[color:var(--color-brand-subtle)] text-[color:var(--color-accent-main)] focus:ring-4 focus:ring-[rgba(200,121,100,0.2)]"
          :checked="consents.smsMarketingOptIn"
          :disabled="disabled"
          @change="updateConsent('smsMarketingOptIn', ($event.target as HTMLInputElement).checked)"
        >
        <span class="text-sm text-[color:var(--color-brand-primary)]">
          Je souhaite recevoir des conseils bien-être par SMS (optionnel).
        </span>
      </label>
    </div>
  </div>
</template>
