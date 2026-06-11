import { Controller, Get, Post, Put, Delete, Body, Param, ParseIntPipe } from '@nestjs/common';
import { CapitalService } from './capital.service';

@Controller('capital')
export class CapitalController {
  constructor(private readonly capitalService: CapitalService) {}

  @Get()
  async findAll() {
    return this.capitalService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.capitalService.findOne(id);
  }

  @Post()
  async create(@Body() body: { amount: number; date?: string; content: string }) {
    return this.capitalService.create(body);
  }

  @Put(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { amount?: number; date?: string; content?: string },
  ) {
    return this.capitalService.update(id, body);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.capitalService.remove(id);
  }
}
