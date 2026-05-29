import { Type } from 'class-transformer'
import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator'

export class OrderItemDto {
  @IsUUID()
  product_id: string

  @IsInt()
  @Min(1)
  quantity: number
}

export class CreateOrderDto {
  @IsUUID()
  user_id: string

  @IsString()
  @IsNotEmpty()
  idempotency_key: string

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[]
}
