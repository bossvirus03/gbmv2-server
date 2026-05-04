import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.product.findMany({ include: { batch: true } });
  }

  findOne(id: number) {
    return this.prisma.product.findUnique({ where: { id }, include: { batch: true } });
  }

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: {...dto, price: 0 } });
  }

  update(id: number, dto: UpdateProductDto) {
    return this.prisma.product.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.product.delete({ where: { id } });
  }
}
