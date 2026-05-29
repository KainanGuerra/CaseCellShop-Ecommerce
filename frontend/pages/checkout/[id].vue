<script setup lang="ts">
import type { Product } from '~/types/api'

const route = useRoute()
const config = useRuntimeConfig()
const productId = route.params.id as string

const { data: product, error } = await useAsyncData<Product>(
  `product-${productId}`,
  () => $fetch(`${config.public.apiBase}/products/${productId}`),
)

const { add } = useCart()
const quantity = ref(1)

const maxQty = computed(() => product.value?.stock_quantity ?? 0)
const isOutOfStock = computed(() => maxQty.value === 0)

watch(maxQty, (val) => {
  if (quantity.value > val) quantity.value = Math.max(1, val)
})

function handleAddToCart() {
  if (!product.value || isOutOfStock.value) return
  add(product.value, quantity.value)
  navigateTo('/carrinho')
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
        <h1 class="text-xl font-bold text-gray-900">Detalhes do Produto</h1>
      </div>
    </header>

    <div class="max-w-2xl mx-auto px-4 py-8">
      <div v-if="error" class="text-center py-20 text-red-600">
        Produto não encontrado.
      </div>

      <div v-else-if="product">
        <!-- Product card -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div class="aspect-[16/7] overflow-hidden bg-gray-100">
            <img
              v-if="product.image_url"
              :src="product.image_url"
              :alt="product.name"
              class="w-full h-full object-cover"
            />
          </div>

          <div class="p-6">
            <div class="flex items-start justify-between gap-4">
              <div>
                <h2 class="text-2xl font-bold text-gray-900">{{ product.name }}</h2>
                <p class="text-gray-500 mt-1">{{ product.description }}</p>
              </div>
              <StockBadge :stock="product.stock_quantity" class="shrink-0" />
            </div>
            <p class="text-3xl font-bold text-emerald-600 mt-4">
              R$ {{ Number(product.price).toFixed(2).replace('.', ',') }}
            </p>
          </div>
        </div>

        <!-- Quantity + add to cart -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 class="font-semibold text-gray-900 mb-4">Quantidade</h3>

          <div class="flex items-center gap-3 mb-6">
            <button
              @click="quantity = Math.max(1, quantity - 1)"
              :disabled="quantity <= 1 || isOutOfStock"
              class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center
                     font-bold text-gray-600 hover:border-emerald-500 hover:text-emerald-600
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >−</button>

            <input
              v-model.number="quantity"
              type="number"
              :min="1"
              :max="maxQty"
              :disabled="isOutOfStock"
              class="w-20 text-center border-2 border-gray-300 rounded-xl py-2 font-semibold
                     focus:outline-none focus:border-emerald-500 disabled:opacity-40"
            />

            <button
              @click="quantity = Math.min(maxQty, quantity + 1)"
              :disabled="quantity >= maxQty || isOutOfStock"
              class="w-10 h-10 rounded-full border-2 border-gray-300 flex items-center justify-center
                     font-bold text-gray-600 hover:border-emerald-500 hover:text-emerald-600
                     disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >+</button>
          </div>

          <button
            @click="handleAddToCart"
            :disabled="isOutOfStock"
            class="w-full py-4 rounded-xl font-bold text-white text-lg transition-all duration-200
                   bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isOutOfStock">Produto Esgotado</span>
            <span v-else>Adicionar ao Carrinho</span>
          </button>

          <NuxtLink
            to="/"
            class="mt-3 w-full py-3 rounded-xl font-semibold text-gray-700 text-base flex items-center justify-center
                   border-2 border-gray-200 hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Continuar comprando
          </NuxtLink>
        </div>
      </div>
    </div>
  </main>
</template>
