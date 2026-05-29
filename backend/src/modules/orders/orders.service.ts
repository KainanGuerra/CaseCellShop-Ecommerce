import { Injectable, ConflictException, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectDataSource } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Order, OrderStatus, PaymentStatus } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Product } from '../products/product.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { ErpService } from './erp.service';
import { InsufficientStockException } from '../../common/exceptions/insufficient-stock.exception';
import { ErpProcessingException } from '../../common/exceptions/erp-processing.exception';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly erpService: ErpService,
  ) { }

  async createOrder(
    dto: CreateOrderDto,
  ): Promise<{ order: Order; wasExisting: boolean }> {
    // Fast-path idempotency check — outside transaction to avoid holding a connection
    const existing = await this.orderRepo.findOne({
      where: { idempotency_key: dto.idempotency_key },
      relations: { items: true },
    });
    if (existing) {
      this.logger.log(`Idempotent replay for key ${dto.idempotency_key}`);
      return { order: existing, wasExisting: true };
    }

    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    let order: Order;

    try {
      // Lock each product row and validate stock
      const productCache = new Map<string, Product>();

      for (const itemDto of dto.items) {
        const product = await qr.manager.findOne(Product, {
          where: { id: itemDto.product_id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new ConflictException(
            `Product ${itemDto.product_id} not found`,
          );
        }

        if (product.stock_quantity < itemDto.quantity) {
          throw new InsufficientStockException(product.stock_quantity);
        }

        product.stock_quantity -= itemDto.quantity;
        await qr.manager.save(Product, product);
        productCache.set(itemDto.product_id, product);
      }

      const total = dto.items.reduce((sum, item) => {
        const p = productCache.get(item.product_id)!;
        // price before decrement is the same object — price didn't change, only stock did
        return sum + Number(p.price) * item.quantity;
      }, 0);

      const newOrder = qr.manager.create(Order, {
        user_id: dto.user_id,
        idempotency_key: dto.idempotency_key,
        status: OrderStatus.PROCESSING,
        payment_status: PaymentStatus.PENDING,
        total_amount: total,
      });
      order = await qr.manager.save(Order, newOrder);

      const items = dto.items.map((itemDto) => {
        const p = productCache.get(itemDto.product_id)!;
        return qr.manager.create(OrderItem, {
          order_id: order.id,
          product_id: itemDto.product_id,
          quantity: itemDto.quantity,
          unit_price: p.price,
        });
      });
      await qr.manager.save(OrderItem, items);

      await qr.commitTransaction();
      this.logger.log(`Order ${order.id} committed — calling ERP`);
    } catch (err) {
      await qr.rollbackTransaction();
      throw err;
    } finally {
      await qr.release();
    }

    // ERP call happens after commit, within the HTTP request — client waits the full delay
    try {
      await this.erpService.processOrder(order);
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CONFIRMED,
        payment_status: PaymentStatus.PAID,
      });
      order.status = OrderStatus.CONFIRMED;
      order.payment_status = PaymentStatus.PAID;
    } catch {
      await this.orderRepo.update(order.id, {
        status: OrderStatus.CANCELLED,
        payment_status: PaymentStatus.FAILED,
      });
      throw new ErpProcessingException();
    }

    return { order, wasExisting: false };
  }

  async findByUser(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { user_id: userId },
      relations: { items: true },
      order: { created_at: 'DESC' },
    });
  }

  async findById(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
      relations: { items: true },
    });
    if (!order) throw new NotFoundException(`Order ${orderId} not found`);
    return order;
  }
}
