import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { BatchService } from './batch.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('batch')
@UseGuards(JwtAuthGuard)
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  findAll() {
    return this.batchService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.batchService.findOne(id);
  }

  @Post()
  create(@Body() dto: CreateBatchDto) {
    return this.batchService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateBatchDto) {
    return this.batchService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.batchService.remove(id);
  }

  @Post(':id/products')
  addProduct(@Param('id', ParseIntPipe) id: number, @Body() dto: CreateProductDto) {
    return this.batchService.addProduct(id, dto);
  }

  @Post(':id/products/upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        return cb(null, true);
      },
    }),
  )
  addProductWithUpload(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.batchService.addProductWithImage(id, file);
  }

  @Post(':id/products/uploads')
  @UseInterceptors(
    FilesInterceptor('files', 50, {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype?.startsWith('image/')) {
          return cb(new BadRequestException('Only image files are allowed'), false);
        }
        return cb(null, true);
      },
    }),
  )
  addProductsWithUploads(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
  ) {
    return this.batchService.addProductsWithImages(id, files);
  }
}