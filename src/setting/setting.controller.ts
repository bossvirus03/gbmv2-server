import { Controller, Get, Post, Body } from '@nestjs/common';
import { SettingService } from './setting.service';

@Controller('settings')
export class SettingController {
  constructor(private readonly settingService: SettingService) {}

  @Get()
  async get() {
    return this.settingService.get();
  }

  @Post()
  async update(
    @Body()
    body: {
      shippingVnPerKg?: number;
      exchangeRate?: number;
      domesticShippingJpy?: number;
      serviceFeeRate?: number;
    },
  ) {
    return this.settingService.update(body);
  }
}
