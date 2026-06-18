import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';

@Injectable()
export class OrderService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.order.findMany({
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
  }

  findOne(id: number) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        customer: true,
      },
    });
  }

  async create(dto: CreateOrderDto) {
    const { customerId, note, items, status } = dto;

    let orderStatus: 'DEPOSIT' | 'COMPLETED' = 'DEPOSIT';
    if (status) {
      orderStatus = status as any;
    } else if (items && items.length > 0) {
      const allCompleted = items.every(
        (item) => Number(item.deposit) >= Number(item.price),
      );
      orderStatus = allCompleted ? 'COMPLETED' : 'DEPOSIT';
    }

    return this.prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          customerId,
          status: orderStatus,
          note: note || null,
        },
      });

      if (items && items.length > 0) {
        for (const item of items) {
          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              price: item.price,
              deposit: item.deposit,
            },
          });

          const productStatus =
            Number(item.deposit) >= Number(item.price) ? 'SOLD' : 'DEPOSIT';

          await tx.product.update({
            where: { id: item.productId },
            data: {
              status: productStatus as any,
              price: item.price,
            },
          });
        }
      }

      return tx.order.findUnique({
        where: { id: order.id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
    });
  }

  async createSellOrder(dto: CreateSellOrderDto) {
    const {
      customerName,
      customerPhone,
      productId,
      price,
      deposit,
      status,
      note,
    } = dto;

    let customer;
    if (customerPhone) {
      customer = await this.prisma.customer.findUnique({
        where: { phone: customerPhone },
      });
    }

    if (customer) {
      if (customer.name !== customerName) {
        customer = await this.prisma.customer.update({
          where: { id: customer.id },
          data: { name: customerName },
        });
      }
    } else {
      const phoneValue =
        customerPhone ||
        `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
      customer = await this.prisma.customer.create({
        data: {
          name: customerName,
          phone: phoneValue,
        },
      });
    }

    const isSold = status === 'SOLD';
    const orderStatus = isSold ? 'COMPLETED' : 'DEPOSIT';
    const productStatus =
      status || (Number(deposit || 0) >= Number(price) ? 'SOLD' : 'DEPOSIT');

    const order = await this.prisma.order.create({
      data: {
        customerId: customer.id,
        status: orderStatus as any,
        note: note || null,
      },
    });

    const orderItem = await this.prisma.orderItem.create({
      data: {
        orderId: order.id,
        productId: productId,
        price: price,
        deposit: isSold ? price : Number(deposit || 0),
      },
    });

    await this.prisma.product.update({
      where: { id: productId },
      data: {
        status: productStatus as any,
        price: price,
      },
    });

    return {
      ...order,
      items: [orderItem],
    };
  }

  async update(id: number, dto: UpdateOrderDto) {
    const { status, items, customerId, note } = dto;

    return this.prisma.$transaction(async (tx) => {
      const updateData: any = {};
      if (status) updateData.status = status;
      if (customerId !== undefined) updateData.customerId = customerId;
      if (note !== undefined) updateData.note = note || null;

      const order = await tx.order.update({
        where: { id },
        data: updateData,
      });

      if (items && items.length > 0) {
        for (const item of items) {
          await tx.orderItem.updateMany({
            where: {
              orderId: id,
              productId: item.productId,
            },
            data: {
              price: item.price,
              deposit: item.deposit,
            },
          });
        }
      }

      // Đồng bộ trạng thái của sản phẩm dựa trên trạng thái đơn hàng
      const currentItems = await tx.orderItem.findMany({
        where: { orderId: id },
      });

      const orderStatus = order.status;

      for (const item of currentItems) {
        let productStatus: 'AVAILABLE' | 'DEPOSIT' | 'SOLD' = 'AVAILABLE';
        if (orderStatus === 'COMPLETED') {
          productStatus = 'SOLD';
        } else if (orderStatus === 'DEPOSIT') {
          productStatus = Number(item.deposit) >= Number(item.price) ? 'SOLD' : 'DEPOSIT';
        } else if (orderStatus === 'CANCELLED') {
          productStatus = 'AVAILABLE';
        }

        await tx.product.update({
          where: { id: item.productId },
          data: {
            status: productStatus,
            ...(orderStatus !== 'CANCELLED' ? { price: item.price } : {}),
          },
        });
      }

      return tx.order.findUnique({
        where: { id },
        include: {
          items: {
            include: {
              product: true,
            },
          },
          customer: true,
        },
      });
    });
  }

  async remove(id: number) {
    return this.prisma.$transaction(async (tx) => {
      const items = await tx.orderItem.findMany({
        where: { orderId: id },
      });

      for (const item of items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { status: 'AVAILABLE' },
        });
      }

      await tx.orderItem.deleteMany({
        where: { orderId: id },
      });

      return tx.order.delete({
        where: { id },
      });
    });
  }
}
