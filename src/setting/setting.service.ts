import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';

@Injectable()
export class SettingService {
  constructor(private prisma: PrismaService) {}

  async get() {
    let setting = await this.prisma.setting.findUnique({ where: { id: 1 } });
    if (!setting) {
      setting = await this.prisma.setting.create({
        data: {
          id: 1,
          shippingVnPerKg: 0,
          exchangeRate: 0,
          domesticShippingJpy: 0,
          serviceFeeRate: 0,
        },
      });
    }
    return setting;
  }

  async update(data: {
    shippingVnPerKg?: number;
    exchangeRate?: number;
    domesticShippingJpy?: number;
    serviceFeeRate?: number;
  }) {
    return this.prisma.setting.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        shippingVnPerKg: data.shippingVnPerKg || 0,
        exchangeRate: data.exchangeRate || 0,
        domesticShippingJpy: data.domesticShippingJpy || 0,
        serviceFeeRate: data.serviceFeeRate || 0,
      },
    });
  }
}
