import { Injectable, ConflictException } from '@nestjs/common';
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

  async create(dto: CreateCustomerDto) {
    const existing = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });
    if (existing) {
      throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống.');
    }
    return this.prisma.customer.create({ data: dto });
  }

  async update(id: number, dto: UpdateCustomerDto) {
    if (dto.phone) {
      const existing = await this.prisma.customer.findUnique({
        where: { phone: dto.phone },
      });
      if (existing && existing.id !== id) {
        throw new ConflictException('Số điện thoại đã tồn tại trong hệ thống.');
      }
    }
    return this.prisma.customer.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.customer.delete({ where: { id } });
  }
}
