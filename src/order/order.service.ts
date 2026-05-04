import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';

@Injectable()
export class OrderService {
	constructor(private prisma: PrismaService) {}

	findAll() {
		return this.prisma.order.findMany();
	}

	findOne(id: number) {
		return this.prisma.order.findUnique({ where: { id } });
	}

	create(dto: CreateOrderDto) {
		return this.prisma.order.create({ data: dto });
	}

	update(id: number, dto: UpdateOrderDto) {
		return this.prisma.order.update({ where: { id }, data: dto });
	}

	remove(id: number) {
		return this.prisma.order.delete({ where: { id } });
	}
}
