<script setup lang="ts">
const config = useRuntimeConfig()

const { data: demoUser } = await useAsyncData(
  'demo-user',
  () => $fetch<{ id: string }>(`${config.public.apiBase}/users/demo`),
)

const { items, total, setQty, remove, clear } = useCart()
const { state, submit, retry } = useCheckout()

async function handleCheckout() {
  if (!demoUser.value?.id || !items.value.length) return
  await submit(
    demoUser.value.id,
    items.value.map((i) => ({ product_id: i.productId, quantity: i.quantity })),
  )
  if (state.value.type === 'success') clear()
}
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 shadow-sm">
      <div class="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
        <NuxtLink to="/" class="text-gray-500 hover:text-gray-900 transition-colors">
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </NuxtLink>
        <h1 class="text-xl font-bold text-gray-900">Carrinho</h1>
      </div>
    </header>

    <div class="max-w-2xl mx-auto px-4 py-8">

      <!-- Empty cart -->
      <div v-if="!items.length && state.type !== 'success'" class="text-center py-20 text-gray-500">
        <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M3 3h2l.4 2M7 13h10l4-10H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
        <p class="text-lg font-medium">Seu carrinho está vazio.</p>
        <NuxtLink to="/" class="mt-4 inline-block text-sm font-medium text-emerald-600 underline">
          Ver produtos
        </NuxtLink>
      </div>

      <!-- Cart items -->
      <template v-else-if="state.type !== 'success'">
        <div class="space-y-3 mb-6">
          <div
            v-for="item in items"
            :key="item.productId"
            class="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 flex gap-4"
          >
            <!-- Image -->
            <div class="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 shrink-0">
              <img
                v-if="item.imageUrl"
                :src="item.imageUrl"
                :alt="item.name"
                class="w-full h-full object-cover"
              />
              <div v-else class="w-full h-full flex items-center justify-center text-gray-300">
                <svg class="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>

            <!-- Info -->
            <div class="flex-1 min-w-0">
              <p class="font-semibold text-gray-900 truncate">{{ item.name }}</p>
              <p class="text-sm text-emerald-600 font-medium mt-0.5">
                R$ {{ item.price.toFixed(2).replace('.', ',') }}
              </p>

              <div class="flex items-center gap-2 mt-2">
                <button
                  @click="setQty(item.productId, item.quantity - 1)"
                  :disabled="item.quantity <= 1 || state.type === 'loading'"
                  class="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center
                         text-gray-600 hover:border-emerald-500 hover:text-emerald-600
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                >−</button>
                <span class="w-6 text-center text-sm font-semibold">{{ item.quantity }}</span>
                <button
                  @click="setQty(item.productId, item.quantity + 1)"
                  :disabled="item.quantity >= item.maxStock || state.type === 'loading'"
                  class="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center
                         text-gray-600 hover:border-emerald-500 hover:text-emerald-600
                         disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-sm font-bold"
                >+</button>
              </div>
            </div>

            <!-- Subtotal + remove -->
            <div class="flex flex-col items-end justify-between shrink-0">
              <button
                @click="remove(item.productId)"
                :disabled="state.type === 'loading'"
                class="text-gray-400 hover:text-red-500 transition-colors disabled:opacity-40"
                title="Remover"
              >
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <p class="text-sm font-bold text-gray-900">
                R$ {{ (item.price * item.quantity).toFixed(2).replace('.', ',') }}
              </p>
            </div>
          </div>
        </div>

        <!-- Summary -->
        <div class="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
          <div class="flex justify-between items-center mb-5 text-lg font-bold text-gray-900">
            <span>Total</span>
            <span>R$ {{ total.toFixed(2).replace('.', ',') }}</span>
          </div>

          <!-- Checkout button -->
          <button
            @click="handleCheckout"
            :disabled="state.type === 'loading'"
            class="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200
                   bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="state.type === 'loading'">Aguarde...</span>
            <span v-else>Finalizar Compra</span>
          </button>

          <NuxtLink
            to="/"
            class="mt-3 w-full py-3 rounded-xl font-semibold text-gray-700 text-base flex items-center justify-center
                   border-2 border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Continuar comprando
          </NuxtLink>

          <!-- Step progression -->
          <div
            v-if="state.type === 'loading'"
            class="mt-6 p-5 rounded-xl bg-gray-50 border border-gray-200"
          >
            <p class="text-sm font-semibold text-gray-700 mb-4">Processando seu pedido...</p>
            <CheckoutStepper :step="state.step" />
          </div>

          <!-- Status messages -->
          <div class="mt-4 space-y-3">
            <!-- Validation errors -->
            <div
              v-if="state.type === 'validation_error'"
              class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800"
            >
              <p class="font-semibold mb-2">Dados inválidos:</p>
              <ul class="text-sm space-y-1">
                <li v-for="detail in state.details" :key="detail.field">
                  <span class="font-medium">{{ detail.field }}:</span> {{ detail.message }}
                </li>
              </ul>
            </div>

            <!-- Insufficient stock -->
            <div
              v-if="state.type === 'stock_error'"
              class="p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-800"
            >
              <p class="font-semibold">Estoque insuficiente</p>
              <p class="text-sm mt-1">
                Apenas <strong>{{ state.available }}</strong>
                {{ state.available === 1 ? 'unidade disponível' : 'unidades disponíveis' }}.
              </p>
            </div>

            <!-- ERP failure -->
            <div
              v-if="state.type === 'erp_error'"
              class="p-4 rounded-xl bg-red-50 border border-red-200 text-red-800"
            >
              <p class="font-semibold">Falha temporária no processamento</p>
              <p class="text-sm mt-1">O ERP não respondeu a tempo. Tente novamente.</p>
              <button
                @click="retry"
                class="mt-3 px-4 py-2 rounded-lg bg-red-600 text-white text-sm font-medium
                       hover:bg-red-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </template>

      <!-- Success -->
      <div
        v-if="state.type === 'success'"
        class="bg-white rounded-2xl border border-green-200 shadow-sm p-8 text-center"
      >
        <div class="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
          <svg class="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 class="text-xl font-bold text-gray-900 mb-1">Pedido confirmado!</h2>
        <p class="text-sm text-gray-500 mb-4">ID: <span class="font-mono text-xs">{{ state.orderId }}</span></p>
        <div class="flex items-center justify-center gap-4">
          <NuxtLink to="/" class="text-sm font-medium text-emerald-600 underline">
            Continuar comprando
          </NuxtLink>
          <NuxtLink to="/pedidos" class="text-sm font-medium text-emerald-600 underline">
            Ver meus pedidos
          </NuxtLink>
        </div>
      </div>

    </div>
  </main>
</template>
