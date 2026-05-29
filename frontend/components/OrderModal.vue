<script setup lang="ts">
import type { OrderDetail } from '~/types/api'

const props = defineProps<{ orderId: string | null }>()
const emit = defineEmits<{ close: [] }>()

const config = useRuntimeConfig()

const { data: order, pending, error } = useAsyncData<OrderDetail>(
  () => `order-modal-${props.orderId}`,
  () => {
    if (!props.orderId) return Promise.resolve(null) as Promise<OrderDetail>
    return $fetch(`${config.public.apiBase}/orders/${props.orderId}`)
  },
  { watch: [() => props.orderId] },
)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

onMounted(() => {
  window.addEventListener('keydown', onKey)
})
onUnmounted(() => {
  window.removeEventListener('keydown', onKey)
})

function onKey(e: KeyboardEvent) {
  if (e.key === 'Escape') emit('close')
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="orderId"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/50 backdrop-blur-sm"
        @click="emit('close')"
      />

      <!-- Panel -->
      <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <!-- Header -->
        <div class="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 class="text-lg font-bold text-gray-900">Detalhe do Pedido</h2>
          <button
            @click="emit('close')"
            class="w-8 h-8 rounded-full flex items-center justify-center text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Loading -->
        <div v-if="pending" class="p-5 space-y-3 animate-pulse">
          <div class="h-3 bg-gray-200 rounded w-2/3" />
          <div class="h-3 bg-gray-200 rounded w-1/2" />
          <div class="h-10 bg-gray-200 rounded mt-4" />
          <div class="h-10 bg-gray-200 rounded" />
        </div>

        <!-- Error -->
        <div v-else-if="error" class="p-5 text-center text-red-600 text-sm">
          Erro ao carregar pedido.
        </div>

        <!-- Content -->
        <div v-else-if="order" class="p-5">
          <!-- Meta -->
          <div class="flex items-start justify-between gap-4 mb-4">
            <div>
              <p class="text-xs text-gray-400 font-mono break-all">{{ order.id }}</p>
              <p class="text-sm text-gray-500 mt-0.5">{{ formatDate(order.createdAt) }}</p>
            </div>
            <div class="flex flex-col items-end gap-1.5 shrink-0">
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                :class="{
                  'bg-green-100 text-green-800': order.status === 'confirmed',
                  'bg-red-100 text-red-800': order.status === 'cancelled',
                  'bg-yellow-100 text-yellow-800': order.status === 'processing',
                }"
              >
                {{ order.status === 'confirmed' ? 'Confirmado'
                  : order.status === 'cancelled' ? 'Cancelado'
                  : 'Processando' }}
              </span>
              <span
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                :class="{
                  'bg-emerald-100 text-emerald-800': order.paymentStatus === 'paid',
                  'bg-red-100 text-red-700': order.paymentStatus === 'failed',
                  'bg-gray-100 text-gray-600': order.paymentStatus === 'pending',
                }"
              >
                {{ order.paymentStatus === 'paid' ? 'Pago'
                  : order.paymentStatus === 'failed' ? 'Falhou'
                  : 'Pendente' }}
              </span>
            </div>
          </div>

          <!-- Items -->
          <ul class="divide-y divide-gray-100 mb-4">
            <li
              v-for="item in order.items"
              :key="item.productId"
              class="py-3 flex items-center justify-between text-sm"
            >
              <span class="text-gray-700 font-medium">{{ item.productName }}</span>
              <div class="text-right shrink-0 ml-4">
                <p class="text-gray-500">{{ item.quantity }}x R$ {{ item.unitPrice.toFixed(2).replace('.', ',') }}</p>
                <p class="font-semibold text-gray-900">R$ {{ (item.unitPrice * item.quantity).toFixed(2).replace('.', ',') }}</p>
              </div>
            </li>
          </ul>

          <!-- Total -->
          <div class="flex justify-between items-center border-t border-gray-100 pt-3">
            <span class="font-bold text-gray-900">Total</span>
            <span class="font-bold text-lg text-emerald-600">
              R$ {{ order.totalAmount.toFixed(2).replace('.', ',') }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
