import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    const email = createUserDto.email.trim().toLowerCase();

    // Kiểm tra email đã tồn tại hay chưa
    const existingUser = await this.prisma.user.findFirst({
      where: { email },
    });
    if (existingUser) {
      throw new BadRequestException('Email này đã tồn tại trong hệ thống');
    }

    const emailPrefix = email.split('@')[0];
    let candidateUsername = emailPrefix;
    let isUnique = false;
    let counter = 0;

    // Sinh username duy nhất từ prefix email
    while (!isUnique) {
      const existing = await this.prisma.user.findUnique({
        where: { username: candidateUsername },
      });
      if (!existing) {
        isUnique = true;
      } else {
        counter++;
        candidateUsername = `${emailPrefix}${counter}`;
      }
    }

    return this.prisma.user.create({
      data: {
        username: candidateUsername,
        email: email,
      },
    });
  }

  findAll() {
    return this.prisma.user.findMany();
  }

  findOne(id: number) {
    return this.prisma.user.findUnique({ where: { id } });
  }

  remove(id: number) {
    return this.prisma.user.delete({ where: { id } });
  }
}
