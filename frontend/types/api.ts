export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface Product {
  id: string
  name: string
  description: string
  price: number
  stock_quantity: number
  image_url: string | null
  sku: string
  created_at: string
  updated_at: string
}

export interface OrderResponse {
  orderId: string
  status: 'processing' | 'confirmed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
}

export interface ValidationDetail {
  field: string
  message: string
}

export interface ApiError {
  error: string
  message?: string
  available?: number
  details?: ValidationDetail[]
}

export interface OrderItemDetail {
  productId: string
  productName: string
  quantity: number
  unitPrice: number
}

export interface OrderDetail {
  id: string
  status: 'processing' | 'confirmed' | 'cancelled'
  paymentStatus: 'pending' | 'paid' | 'failed'
  totalAmount: number
  createdAt: string
  items: OrderItemDetail[]
}
