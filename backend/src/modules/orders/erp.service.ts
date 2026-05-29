import { Injectable, Logger } from '@nestjs/common';
import { ErpProcessingException } from '../../common/exceptions/erp-processing.exception';
import { Order } from './order.entity';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

@Injectable()
export class ErpService {
  private readonly logger = new Logger(ErpService.name);

  async processOrder(order: Order): Promise<void> {
    const delay = 1000 + Math.random() * 3000;
    this.logger.log(
      `ERP processing order ${order.id} — delay ${Math.round(delay)}ms`,
    );
    await sleep(delay);

    if (Math.random() < 0.3) {
      this.logger.warn(`ERP failure for order ${order.id}`);
      throw new ErpProcessingException();
    }

    this.logger.log(`ERP approved order ${order.id}`);
  }
}
