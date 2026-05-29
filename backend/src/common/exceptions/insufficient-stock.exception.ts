import { HttpException, HttpStatus } from '@nestjs/common'

export class InsufficientStockException extends HttpException {
  constructor(available: number) {
    super({ error: 'INSUFFICIENT_STOCK', available }, HttpStatus.CONFLICT)
  }
}
