import { Type } from 'class-transformer';
import { IsInt, IsPositive } from 'class-validator';

export class OrderItemDto {
  @IsInt()
  @IsPositive()
  productId!: number;

  @IsInt()
  @IsPositive()
  @Type(() => Number)
  quantity!: number;
}
