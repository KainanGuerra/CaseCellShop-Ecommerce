import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Product } from './product.entity'

export interface PaginatedProducts {
  data: Product[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async findAll(
    search?: string,
    inStock?: string,
    page = 1,
    limit = 6,
  ): Promise<PaginatedProducts> {
    const qb = this.productRepo.createQueryBuilder('product')

    if (search) {
      qb.andWhere('product.name ILIKE :search OR product.description ILIKE :search', {
        search: `%${search}%`,
      })
    }

    if (inStock === 'true') {
      qb.andWhere('product.stock_quantity > 0')
    }

    qb.orderBy('product.name', 'ASC')

    const total = await qb.getCount()
    const data = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getMany()

    return { data, total, page, pageSize: limit, totalPages: Math.ceil(total / limit) }
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productRepo.findOne({ where: { id } })
    if (!product) throw new NotFoundException(`Product ${id} not found`)
    return product
  }
}
