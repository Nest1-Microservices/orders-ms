import { IsEnum, IsOptional } from 'class-validator';
import { OrderStatusList } from '../enum/order.enum';

import { PaginationDto } from 'src/common/dto/pagination.dto';
import { OrderStatus } from 'src/generated/prisma/enums';

export class OrderPaginationDto extends PaginationDto {
  @IsOptional()
  @IsEnum(OrderStatusList, {
    message: `Valid status are ${OrderStatusList.join(', ')}`,
  })
  status!: OrderStatus;
}
