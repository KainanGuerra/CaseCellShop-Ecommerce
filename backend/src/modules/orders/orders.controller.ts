import { Controller, Post, Get, Body, Param, HttpStatus, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CreateOrderDto } from './dto/create-order.dto';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) { }

  @Post()
  async create(@Body() dto: CreateOrderDto, @Res() res: Response) {
    const { order, wasExisting } = await this.ordersService.createOrder(dto);

    return res.status(wasExisting ? HttpStatus.OK : HttpStatus.CREATED).json({
      orderId: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
    });
  }

  @Get('user/:userId')
  async findByUser(@Param('userId') userId: string) {
    const orders = await this.ordersService.findByUser(userId);
    return orders.map((order) => this.serializeOrder(order));
  }

  @Get(':orderId')
  async findById(@Param('orderId') orderId: string) {
    const order = await this.ordersService.findById(orderId);
    return this.serializeOrder(order);
  }

  private serializeOrder(order: import('./order.entity').Order) {
    return {
      id: order.id,
      status: order.status,
      paymentStatus: order.payment_status,
      totalAmount: Number(order.total_amount),
      createdAt: order.created_at,
      items: order.items.map((item) => ({
        productId: item.product_id,
        productName: item.product.name,
        quantity: item.quantity,
        unitPrice: Number(item.unit_price),
      })),
    };
  }
}
