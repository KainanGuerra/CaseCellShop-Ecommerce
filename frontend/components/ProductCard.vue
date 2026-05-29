<script setup lang="ts">
import type { Product } from '~/types/api'

const props = defineProps<{ product: Product }>()

const { add } = useCart()
const added = ref(false)

function handleAdd(e: Event) {
  e.preventDefault()
  e.stopPropagation()
  if (props.product.stock_quantity === 0) return
  add(props.product, 1)
  added.value = true
  setTimeout(() => { added.value = false }, 1000)
}
</script>

<template>
  <NuxtLink
    :to="`/checkout/${props.product.id}`"
    class="group block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow duration-200"
  >
    <div class="aspect-[4/3] overflow-hidden bg-gray-100">
      <img
        v-if="props.product.image_url"
        :src="props.product.image_url"
        :alt="props.product.name"
        class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
      />
      <div v-else class="w-full h-full flex items-center justify-center text-gray-400">
        <svg class="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
    </div>

    <div class="p-4">
      <h3 class="font-semibold text-gray-900 truncate">{{ props.product.name }}</h3>
      <p class="text-sm text-gray-500 mt-1 line-clamp-2">{{ props.product.description }}</p>

      <div class="mt-3 flex items-center justify-between gap-2">
        <div class="flex items-center gap-2 min-w-0">
          <span class="text-lg font-bold text-emerald-600 shrink-0">
            R$ {{ Number(props.product.price).toFixed(2).replace('.', ',') }}
          </span>
          <StockBadge :stock="props.product.stock_quantity" />
        </div>

        <!-- Add to cart button -->
        <button
          v-if="props.product.stock_quantity > 0"
          @click="handleAdd"
          class="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
                 transition-all duration-200 border"
          :class="added
            ? 'bg-emerald-600 text-white border-emerald-600'
            : 'bg-white text-gray-700 border-gray-300 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'"
          title="Adicionar ao carrinho"
        >
          <!-- Cart icon -->
          <svg v-if="!added" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-10H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <!-- Checkmark icon -->
          <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          <span>{{ added ? 'Adicionado' : 'Adicionar' }}</span>
        </button>
      </div>
    </div>
  </NuxtLink>
</template>
