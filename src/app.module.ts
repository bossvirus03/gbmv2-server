import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BatchModule } from './batch/batch.module';
import { OrderModule } from './order/order.module';
import { ExpenseModule } from './expense/expense.module';
import { UserModule } from './user/user.module';
import { ProductModule } from './product/product.module';
import { CustomerModule } from './customer/customer.module';
import { OrderItemModule } from './order-item/order-item.module';
import { CapitalModule } from './capital/capital.module';
import { SettingModule } from './setting/setting.module';
import { PrismaService } from './prisma.service';
import { R2Service } from './r2.service';

@Module({
  imports: [
    AuthModule,
    BatchModule,
    OrderModule,
    ExpenseModule,
    UserModule,
    ProductModule,
    CustomerModule,
    OrderItemModule,
    CapitalModule,
    SettingModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrismaService, R2Service],
})
export class AppModule {}
