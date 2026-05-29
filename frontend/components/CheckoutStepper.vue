<script setup lang="ts">
import type { LoadingStep } from '~/composables/useCheckout'

const props = defineProps<{ step: LoadingStep }>()

const steps = [
  'Pedido criado',
  'Processando pagamento',
  'Atualizando estoque',
  'Pedido confirmado',
]

function stepState(index: number): 'done' | 'active' | 'pending' {
  const n = index + 1
  if (n < props.step) return 'done'
  if (n === props.step) return 'active'
  return 'pending'
}
</script>

<template>
  <div class="flex flex-col">
    <div v-for="(label, i) in steps" :key="i" class="flex items-start gap-4">
      <!-- Icon + connector -->
      <div class="flex flex-col items-center">
        <div
          class="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-300"
          :class="{
            'bg-emerald-600 text-white': stepState(i) === 'done',
            'bg-emerald-600 text-white ring-4 ring-emerald-100': stepState(i) === 'active',
            'bg-white border-2 border-gray-300': stepState(i) === 'pending',
          }"
        >
          <svg
            v-if="stepState(i) === 'done'"
            class="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            stroke-width="3"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span v-else-if="stepState(i) === 'active'" class="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />
          <span v-else class="text-xs font-semibold text-gray-400">{{ i + 1 }}</span>
        </div>
        <div
          v-if="i < steps.length - 1"
          class="w-0.5 h-8 mt-1 transition-colors duration-300"
          :class="stepState(i) === 'done' ? 'bg-emerald-400' : 'bg-gray-200'"
        />
      </div>

      <!-- Label -->
      <div :class="i < steps.length - 1 ? 'pb-8' : ''" class="pt-1.5">
        <p
          class="text-sm font-medium transition-colors duration-300"
          :class="{
            'text-gray-400': stepState(i) === 'pending',
            'text-emerald-700 font-semibold': stepState(i) === 'active',
            'text-gray-500': stepState(i) === 'done',
          }"
        >
          {{ label }}
        </p>
      </div>
    </div>
  </div>
</template>
