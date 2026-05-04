import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';

@Injectable()
export class CustomerService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.customer.findMany({ include: { orders: true } });
  }

  findOne(id: number) {
    return this.prisma.customer.findUnique({ where: { id }, include: { orders: true } });
  }

  create(dto: CreateCustomerDto) {
    return this.prisma.customer.create({ data: dto });
  }

  update(id: number, dto: UpdateCustomerDto) {
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.customer.delete({ where: { id } });
  }
}
