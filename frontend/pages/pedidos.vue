<script setup lang="ts">
import type { OrderDetail } from '~/types/api'

const config = useRuntimeConfig()

const { data: demoUser } = await useAsyncData(
  'demo-user',
  () => $fetch<{ id: string }>(`${config.public.apiBase}/users/demo`),
)

const { data: orders, pending, error, refresh } = await useAsyncData<OrderDetail[]>(
  'user-orders',
  () => {
    if (!demoUser.value?.id) return Promise.resolve([])
    return $fetch(`${config.public.apiBase}/orders/user/${demoUser.value.id}`)
  },
)

const selectedOrderId = ref<string | null>(null)

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-3xl mx-auto px-4 py-4 flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-500 hover:text-gray-900 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900">Meus Pedidos</h1>
      </div>
    </header>

    <div class="max-w-3xl mx-auto px-4 py-8">

      <!-- Loading skeleton -->
      <div v-if="pending" class="space-y-4">
        <div
          v-for="n in 3"
          :key="n"
          class="bg-white rounded-2xl border border-gray-200 p-5 animate-pulse"
        >
          <div class="flex justify-between items-start mb-4">
            <div class="space-y-2">
              <div class="h-3 bg-gray-200 rounded w-48" />
              <div class="h-3 bg-gray-200 rounded w-32" />
            </div>
            <div class="flex flex-col gap-1.5 items-end">
              <div class="h-5 bg-gray-200 rounded w-20" />
              <div class="h-5 bg-gray-200 rounded w-16" />
            </div>
          </div>
          <div class="h-3 bg-gray-200 rounded w-3/4 mb-2" />
          <div class="h-3 bg-gray-200 rounded w-1/2" />
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-600 font-medium">Erro ao carregar pedidos.</p>
        <button
          class="mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          @click="refresh()"
        >
          Tentar novamente
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!orders?.length" class="text-center py-20 text-gray-500">
        <p class="text-lg font-medium">Nenhum pedido ainda.</p>
        <NuxtLink to="/" class="mt-4 inline-block text-sm font-medium text-emerald-600 underline">
          Ver produtos
        </NuxtLink>
      </div>

      <!-- Orders list -->
      <div v-else class="space-y-4">
        <div
          v-for="order in orders"
          :key="order.id"
          class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 cursor-pointer hover:shadow-md transition-shadow"
          @click="selectedOrderId = order.id"
        >
          <!-- Header row -->
          <div class="flex items-start justify-between gap-4 mb-3">
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
          <ul class="divide-y divide-gray-100 mb-3">
            <li
              v-for="item in order.items"
              :key="item.productId"
              class="py-2 flex items-center justify-between text-sm"
            >
              <span class="text-gray-700 font-medium">{{ item.productName }}</span>
              <span class="text-gray-500 shrink-0 ml-4">
                {{ item.quantity }}x R$ {{ item.unitPrice.toFixed(2).replace('.', ',') }}
              </span>
            </li>
          </ul>

          <!-- Total -->
          <div class="flex justify-end border-t border-gray-100 pt-3">
            <span class="text-sm font-semibold text-gray-900">
              Total: R$ {{ order.totalAmount.toFixed(2).replace('.', ',') }}
            </span>
          </div>
        </div>
      </div>

    </div>
  </main>

  <OrderModal :orderId="selectedOrderId" @close="selectedOrderId = null" />
</template>
