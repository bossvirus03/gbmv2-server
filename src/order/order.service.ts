import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { CreateSellOrderDto } from './dto/create-sell-order.dto';

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

	async createSellOrder(dto: CreateSellOrderDto) {
		const { customerName, customerPhone, productId, price, deposit, status, note } = dto;

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
			const phoneValue = customerPhone || `temp_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
			customer = await this.prisma.customer.create({
				data: {
					name: customerName,
					phone: phoneValue,
				},
			});
		}

		const isSold = status === 'SOLD';
		const orderStatus = isSold ? 'COMPLETED' : 'DEPOSIT';
		const productStatus = status || (Number(deposit || 0) >= Number(price) ? 'SOLD' : 'DEPOSIT');

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

	update(id: number, dto: UpdateOrderDto) {
		return this.prisma.order.update({ where: { id }, data: dto });
	}

	remove(id: number) {
		return this.prisma.order.delete({ where: { id } });
	}
}

