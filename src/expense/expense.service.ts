import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';

@Injectable()
export class ExpenseService {
	constructor(private prisma: PrismaService) {}

	findAll() {
		return this.prisma.expense.findMany();
	}

	findOne(id: number) {
		return this.prisma.expense.findUnique({ where: { id } });
	}

	create(dto: CreateExpenseDto) {
		return this.prisma.expense.create({ data: dto });
	}

	update(id: number, dto: UpdateExpenseDto) {
		return this.prisma.expense.update({ where: { id }, data: dto });
	}

	remove(id: number) {
		return this.prisma.expense.delete({ where: { id } });
	}
}
