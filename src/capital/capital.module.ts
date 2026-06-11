import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CapitalController } from './capital.controller';
import { CapitalService } from './capital.service';

@Module({
  controllers: [CapitalController],
  providers: [CapitalService, PrismaService],
  exports: [CapitalService],
})
export class CapitalModule {}
