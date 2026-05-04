import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';

@Injectable()
export class OrderItemService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.orderItem.findMany({ include: { order: true, product: true } });
  }

  findOne(id: number) {
    return this.prisma.orderItem.findUnique({
      where: { id },
      include: { order: true, product: true },
    });
  }

  create(dto: CreateOrderItemDto) {
    return this.prisma.orderItem.create({ data: dto });
  }

  update(id: number, dto: UpdateOrderItemDto) {
    return this.prisma.orderItem.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.orderItem.delete({ where: { id } });
  }
}
