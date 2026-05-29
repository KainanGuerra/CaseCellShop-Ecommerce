import type { Product } from '~/types/api'

export interface CartItem {
  productId: string
  name: string
  price: number
  imageUrl: string | null
  maxStock: number
  quantity: number
}

export function useCart() {
  const items = useState<CartItem[]>('cart-items', () => [])

  const total = computed(() =>
    items.value.reduce((sum, i) => sum + i.price * i.quantity, 0),
  )

  const itemCount = computed(() =>
    items.value.reduce((sum, i) => sum + i.quantity, 0),
  )

  function add(product: Product, qty = 1) {
    const existing = items.value.find((i) => i.productId === product.id)
    if (existing) {
      existing.quantity = Math.min(existing.quantity + qty, product.stock_quantity)
    } else {
      items.value.push({
        productId: product.id,
        name: product.name,
        price: Number(product.price),
        imageUrl: product.image_url,
        maxStock: product.stock_quantity,
        quantity: Math.min(qty, product.stock_quantity),
      })
    }
  }

  function remove(productId: string) {
    items.value = items.value.filter((i) => i.productId !== productId)
  }

  function setQty(productId: string, qty: number) {
    const item = items.value.find((i) => i.productId === productId)
    if (item) item.quantity = Math.max(1, Math.min(qty, item.maxStock))
  }

  function clear() {
    items.value = []
  }

  return { items: readonly(items), total, itemCount, add, remove, setQty, clear }
}
