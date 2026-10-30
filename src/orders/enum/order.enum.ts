import { OrderStatus } from 'src/generated/prisma/enums';

export const OrderStatusList = [
  OrderStatus.PENDING,
  OrderStatus.PROCESSING,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
];
