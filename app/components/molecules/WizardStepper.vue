<script setup lang="ts">
import StepperDot from '../atoms/StepperDot.vue'

const props = defineProps<{
  steps: { label: string }[]
  currentStep: number
}>()

function getStepState(index: number): 'pending' | 'active' | 'completed' {
  const stepNumber = index + 1
  if (stepNumber < props.currentStep) return 'completed'
  if (stepNumber === props.currentStep) return 'active'
  return 'pending'
}
</script>

<template>
  <nav aria-label="Progression">
    <ol class="grid gap-3 sm:grid-cols-3 sm:gap-4">
      <li
        v-for="(step, index) in steps"
        :key="step.label"
        class="flex items-center"
      >
        <StepperDot
          :state="getStepState(index)"
          :label="step.label"
        >
          {{ index + 1 }}
        </StepperDot>
      </li>
    </ol>
  </nav>
</template>
