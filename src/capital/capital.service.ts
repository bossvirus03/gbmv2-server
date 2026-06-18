import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateCapitalDto } from './dto/create-capital.dto';
import { UpdateCapitalDto } from './dto/update-capital.dto';

@Injectable()
export class CapitalService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.capital.findMany({
      orderBy: { date: 'asc' },
    });
  }

  async findOne(id: number) {
    return this.prisma.capital.findUnique({
      where: { id },
    });
  }

  async create(data: CreateCapitalDto) {
    return this.prisma.capital.create({
      data: {
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        content: data.content,
      },
    });
  }

  async update(id: number, data: UpdateCapitalDto) {
    return this.prisma.capital.update({
      where: { id },
      data: {
        amount: data.amount,
        content: data.content,
        date: data.date ? new Date(data.date) : undefined,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.capital.delete({
      where: { id },
    });
  }
}
