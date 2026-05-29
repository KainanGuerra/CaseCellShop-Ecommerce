import type { OrderResponse, ValidationDetail } from '~/types/api'

export type LoadingStep = 1 | 2 | 3 | 4

export interface CheckoutItem {
  product_id: string
  quantity: number
}

type CheckoutState =
  | { type: 'idle' }
  | { type: 'loading'; step: LoadingStep }
  | { type: 'success'; orderId: string; status: string }
  | { type: 'validation_error'; details: ValidationDetail[] }
  | { type: 'stock_error'; available: number }
  | { type: 'erp_error' }

export function useCheckout() {
  const config = useRuntimeConfig()
  const state = ref<CheckoutState>({ type: 'idle' })
  const idempotencyKey = ref(crypto.randomUUID())

  let timers: ReturnType<typeof setTimeout>[] = []

  function clearTimers() {
    timers.forEach(clearTimeout)
    timers = []
  }

  onUnmounted(clearTimers)

  async function submit(userId: string, items: CheckoutItem[]) {
    if (state.value.type === 'loading') return

    state.value = { type: 'loading', step: 1 }

    timers = [
      setTimeout(() => {
        if (state.value.type === 'loading') state.value = { type: 'loading', step: 2 }
      }, 600),
      setTimeout(() => {
        if (state.value.type === 'loading') state.value = { type: 'loading', step: 3 }
      }, 1200),
      setTimeout(() => {
        if (state.value.type === 'loading') state.value = { type: 'loading', step: 4 }
      }, 1800),
    ]

    try {
      const result = await $fetch<OrderResponse>(`${config.public.apiBase}/orders`, {
        method: 'POST',
        body: { user_id: userId, idempotency_key: idempotencyKey.value, items },
      })

      clearTimers()
      state.value = { type: 'success', orderId: result.orderId, status: result.status }
    } catch (err: unknown) {
      clearTimers()
      const e = err as { response?: { status: number; _data: Record<string, unknown> } }
      const status = e?.response?.status
      const body = e?.response?._data ?? {}

      if (status === 400) {
        state.value = { type: 'validation_error', details: (body.details as ValidationDetail[]) ?? [] }
      } else if (status === 409) {
        state.value = { type: 'stock_error', available: (body.available as number) ?? 0 }
      } else if (status === 503) {
        state.value = { type: 'erp_error' }
      } else {
        state.value = { type: 'idle' }
      }
    }
  }

  function retry() {
    clearTimers()
    idempotencyKey.value = crypto.randomUUID()
    state.value = { type: 'idle' }
  }

  function reset() {
    clearTimers()
    idempotencyKey.value = crypto.randomUUID()
    state.value = { type: 'idle' }
  }

  return { state: readonly(state), submit, retry, reset }
}
