import { Module } from '@nestjs/common';
import { BatchService } from './batch.service';
import { BatchController } from './batch.controller';
import { PrismaService } from '../prisma.service';
import { R2Service } from '../r2.service';
@Module({
  controllers: [BatchController],
  providers: [BatchService, PrismaService, R2Service],
})
export class BatchModule {}
