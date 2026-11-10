import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { OrderPaginationDto } from './dto/order-paginations.dto';
import { ClientProxy, RpcException } from '@nestjs/microservices';
import { ChangeOrderStatusDto } from './dto/change-order-status.dto';
import { PRODUCT_SERVICE } from 'src/config/service';
import { firstValueFrom } from 'rxjs';

interface Product {
  id: number;
  name: string;
  price: number;
}

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    @Inject(PRODUCT_SERVICE) private readonly productsClient: ClientProxy,
  ) {}
  async create(createOrderDto: CreateOrderDto) {
    try {
      //Confirmar que los productos existen
      const productIds = createOrderDto.items.map((item) => item.productId);
      const products = await firstValueFrom(
        this.productsClient.send<Product[]>(
          { cmd: 'validateProducts' },
          productIds,
        ),
      );
      const productsById = new Map(
        products.map((product) => [product.id, product] as const),
      );

      //funcion auxiliar: devolver un producto o lanzar un error
      const getProduct = (productId: number): Product => {
        const product = productsById.get(productId);
        if (!product) {
          throw new RpcException({
            status: HttpStatus.BAD_REQUEST,
            message: `Product ${productId} not found`,
          });
        }
        return product;
      };
      //*Calculo de los totales
      const totalAmount = createOrderDto.items.reduce(
        (accumulate, orderItem) =>
          accumulate +
          getProduct(orderItem.productId).price * orderItem.quantity,
        0,
      );
      const totalItems = createOrderDto.items.reduce(
        (accumulate, orderItem) => accumulate + orderItem.quantity,
        0,
      );
      //* Guardar la orden con sus items
      const order = await this.prisma.order.create({
        data: {
          totalAmount,
          totalItems,
          orderItems: {
            createMany: {
              data: createOrderDto.items.map((orderItem) => ({
                price: getProduct(orderItem.productId).price,
                productId: orderItem.productId,
                quantity: orderItem.quantity,
              })),
            },
          },
        },
        include: {
          orderItems: {
            select: {
              price: true,
              quantity: true,
              productId: true,
            },
          },
        },
      });
      //*Armar la respuesta
      return {
        ...order,
        orderItems: order.orderItems.map((orderItem) => ({
          ...orderItem,
          name: getProduct(orderItem.productId).name,
        })),
      };
    } catch (error) {
      if (error instanceof RpcException) {
        throw error;
      }
      if (typeof error == 'object' && error !== null) {
        throw new RpcException(error);
      }
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
