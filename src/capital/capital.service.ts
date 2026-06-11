import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

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

  async create(data: { amount: number; date?: string | Date; content: string }) {
    return this.prisma.capital.create({
      data: {
        amount: data.amount,
        date: data.date ? new Date(data.date) : new Date(),
        content: data.content,
      },
    });
  }

  async update(id: number, data: { amount?: number; date?: string | Date; content?: string }) {
    return this.prisma.capital.update({
      where: { id },
      data: {
        ...data,
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
