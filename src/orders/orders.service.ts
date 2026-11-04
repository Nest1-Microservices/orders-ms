import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderPaginationDto } from './dto/order-paginations.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PRODUCT_SERVICE } from 'src/config/service';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products: any[] = await firstValueFrom(
        this.productsClient.send({ cmd: 'validateProducts' }, productIds),
      );
    } catch (error) {
      throw new RpcException({
        status: HttpStatus.BAD_REQUEST,
        message: 'Check logs',
      });
    }
  }

  async findAll(orderPaginationDto: OrderPaginationDto) {
    const { page, limit, status } = orderPaginationDto;
    const totalOrders = await this.prisma.order.count({
      where: { status: status },
    });
    const currentPage = Math.ceil(totalOrders / limit);
    return {
      data: await this.prisma.order.findMany({
        skip: (page - 1) * limit,
        take: limit,
        where: {
          status: status,
        },
      }),
      meta: {
        total: totalOrders,
        page: page,
        lastPage: currentPage,
      },
    };
  }

  async findOne(id: string) {
    const order = await this.prisma.order.findFirst({
      where: { id },
    });
    if (!order) {
      throw new RpcException({
        status: HttpStatus.NOT_FOUND,
        message: `Order with id ${id} nor found`,
      });
    }
    return order;
  }

  async changeOrderStatus(changeOrderStatusDto: ChangeOrderStatusDto) {
    const { id, status } = changeOrderStatusDto;
    const order = await this.findOne(id);
    if (order.status === status) {
      return order;
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: status },
    });
  }
}
