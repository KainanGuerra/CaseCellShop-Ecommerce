<script setup lang="ts">
import type { PaginatedResponse, Product } from '~/types/api'

const config = useRuntimeConfig()
const PAGE_SIZE = 6
const { itemCount } = useCart()

const currentPage = ref(1)

const { data, error, pending, refresh } = await useAsyncData<PaginatedResponse<Product>>(
  () => `products-page-${currentPage.value}`,
  () => $fetch(`${config.public.apiBase}/products?page=${currentPage.value}&limit=${PAGE_SIZE}`),
  { watch: [currentPage] },
)

const products = computed(() => data.value?.data ?? [])
const totalPages = computed(() => data.value?.totalPages ?? 1)
const total = computed(() => data.value?.total ?? 0)

function goTo(page: number) {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
}

const pageNumbers = computed(() => {
  const pages: (number | '...')[] = []
  const tp = totalPages.value
  const cp = currentPage.value
  if (tp <= 7) {
    for (let i = 1; i <= tp; i++) pages.push(i)
  } else {
    pages.push(1)
    if (cp > 3) pages.push('...')
    for (let i = Math.max(2, cp - 1); i <= Math.min(tp - 1, cp + 1); i++) pages.push(i)
    if (cp < tp - 2) pages.push('...')
    pages.push(tp)
  }
  return pages
})
</script>

<template>
  <main class="min-h-screen bg-gray-50">
    <header class="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
      <div class="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">📱 CaseCellShop</h1>
          <p class="text-xs text-gray-400 mt-0.5">Capinhas &amp; Acessórios</p>
        </div>
        <div class="flex items-center gap-4">
          <NuxtLink
            to="/pedidos"
            class="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Meus Pedidos
          </NuxtLink>
          <NuxtLink
            to="/carrinho"
            class="relative flex items-center text-gray-600 hover:text-gray-900 transition-colors"
            title="Carrinho"
          >
            <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-10H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span
              v-if="itemCount > 0"
              class="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center"
            >
              {{ itemCount }}
            </span>
          </NuxtLink>
          <span v-if="total > 0" class="text-sm text-gray-500">{{ total }} produtos</span>
        </div>
      </div>
    </header>

    <div class="max-w-6xl mx-auto px-4 py-8">

      <!-- Loading skeleton -->
      <div v-if="pending" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          v-for="n in PAGE_SIZE"
          :key="n"
          class="bg-white rounded-2xl border border-gray-200 overflow-hidden animate-pulse"
        >
          <div class="aspect-[4/3] bg-gray-200" />
          <div class="p-4 space-y-3">
            <div class="h-4 bg-gray-200 rounded w-3/4" />
            <div class="h-3 bg-gray-200 rounded w-full" />
            <div class="h-3 bg-gray-200 rounded w-2/3" />
            <div class="mt-3 flex justify-between items-center">
              <div class="h-5 bg-gray-200 rounded w-1/4" />
              <div class="h-5 bg-gray-200 rounded w-1/5" />
            </div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="text-center py-20">
        <p class="text-red-600 font-medium">Erro ao carregar produtos.</p>
        <p class="text-sm text-gray-500 mt-1">Verifique se o backend está rodando na porta 3001.</p>
        <button
          class="mt-4 px-4 py-2 text-sm bg-gray-900 text-white rounded-lg hover:bg-gray-700"
          @click="refresh()"
        >
          Tentar novamente
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!products.length" class="text-center py-20 text-gray-500">
        Nenhum produto encontrado.
      </div>

      <!-- Product grid -->
      <template v-else>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductCard
            v-for="product in products"
            :key="product.id"
            :product="product"
          />
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="mt-10 flex items-center justify-center gap-1">
          <!-- Prev -->
          <button
            :disabled="currentPage === 1"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="currentPage === 1
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'"
            @click="goTo(currentPage - 1)"
          >
            ← Anterior
          </button>

          <!-- Page numbers -->
          <template v-for="(p, i) in pageNumbers" :key="i">
            <span v-if="p === '...'" class="px-2 py-2 text-gray-400 text-sm select-none">…</span>
            <button
              v-else
              class="w-9 h-9 rounded-lg text-sm font-medium transition-colors"
              :class="p === currentPage
                ? 'bg-gray-900 text-white'
                : 'text-gray-600 hover:bg-gray-200'"
              @click="goTo(p as number)"
            >
              {{ p }}
            </button>
          </template>

          <!-- Next -->
          <button
            :disabled="currentPage === totalPages"
            class="px-3 py-2 rounded-lg text-sm font-medium transition-colors"
            :class="currentPage === totalPages
              ? 'text-gray-300 cursor-not-allowed'
              : 'text-gray-600 hover:bg-gray-200'"
            @click="goTo(currentPage + 1)"
          >
            Próxima →
          </button>
        </div>

        <!-- Page info -->
        <p v-if="totalPages > 1" class="mt-3 text-center text-xs text-gray-400">
          Página {{ currentPage }} de {{ totalPages }}
        </p>
      </template>

    </div>
  </main>
</template>
