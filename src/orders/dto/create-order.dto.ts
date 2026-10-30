import { IsEnum, IsNumber, IsOptional, IsPositive } from 'class-validator';
//Importa el objeto real de js para usarlo como valor por defecto
import { OrderStatus } from 'src/generated/prisma/enums';
//importa el arreglo que usa class-validator para comprarar valores
import { OrderStatusList } from '../enum/order.enum';

export class CreateOrderDto {
  @IsNumber()
  @IsPositive()
  totalAmount!: number;
  @IsNumber()
  @IsPositive()
  totalItem!: number;

  @IsEnum(OrderStatusList, {
    message: `Possible status values are ${OrderStatusList.join(', ')}`,
  })
  @IsOptional()
  status: OrderStatus = OrderStatus.PENDING;
}
