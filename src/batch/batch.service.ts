import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { CreateBatchDto } from './dto/create-batch.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateBatchDto } from './dto/update-batch.dto';
import { R2Service } from '../r2.service';
@Injectable()
export class BatchService {
  constructor(
    private prisma: PrismaService,
    private r2Service: R2Service,
  ) {}

  findAll() {
    return this.prisma.batch.findMany({ include: { products: true } });
  }

  findOne(id: number) {
    return this.prisma.batch.findUnique({
      where: { id },
      include: { products: true },
    });
  }

  async create(dto: CreateBatchDto) {
    return this.prisma.batch.create({ data: dto });
  }

  update(id: number, dto: UpdateBatchDto) {
    return this.prisma.batch.update({ where: { id }, data: dto });
  }

  remove(id: number) {
    return this.prisma.batch.delete({ where: { id } });
  }

  async removeProduct(productId: number) {
    // Lấy thông tin sản phẩm để lấy imageUrl trước khi xóa
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
      select: { imageUrl: true },
    });

    // Xóa ảnh trên Cloudflare R2 nếu có
    if (product?.imageUrl) {
      try {
        await this.r2Service.deleteByUrl(product.imageUrl);
      } catch (err) {
        // Log lỗi nhưng không block việc xóa DB
        console.error(`[R2] Không thể xóa ảnh: ${product.imageUrl}`, err);
      }
    }

    return this.prisma.product.delete({ where: { id: productId } });
  }

  async addProduct(batchId: number, dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, batchId, price: 0 } });
  }

  async addProductWithImage(batchId: number, file: Express.Multer.File) {
    if (!file?.buffer) {
      throw new BadRequestException('Image file is required');
    }

    const imageUrl = await this.r2Service.upload(file, batchId);

    return this.prisma.product.create({
      data: {
        imageUrl,
        batchId,
        price: 0,
      },
    });
  }

  async addProductsWithImages(batchId: number, files: Express.Multer.File[]) {
  if (!files?.length) {
    throw new BadRequestException('Image files are required');
  }

  const imageUrls: string[] = [];
  const chunkSize = 2;

  try {
    // Upload theo chunk để tránh quá tải R2
    for (let i = 0; i < files.length; i += chunkSize) {
      const chunk = files.slice(i, i + chunkSize);

      const urls = await Promise.all(
        chunk.map((file) => this.r2Service.upload(file, batchId)),
      );

      imageUrls.push(...urls);
    }

    // Chuẩn bị data
    const data = imageUrls.map((imageUrl) => ({
      imageUrl,
      batchId,
      price: 0,
    }));

    // Create products
    const result = await this.prisma.product.createMany({
      data,
      skipDuplicates: true,
    });

    return {
      message: 'Thêm sản phẩm thành công',
      count: result.count,
      imageUrls,
    };
  } catch (error) {
    // === BẮN LỖI RÕ RÀNG VỀ FE ===
    if (error instanceof BadRequestException) {
      throw error;
    }

    // Lỗi upload (R2)
    if (error.message?.includes('upload') || error.name === 'UploadError') {
      throw new BadRequestException(
        `Upload ảnh thất bại: ${error.message || 'Unknown error'}`,
      );
    }

    // Lỗi Prisma (ví dụ: duplicate, foreign key, DB error...)
    if (error.code?.startsWith('P')) {
      throw new BadRequestException(
        `Lỗi database: ${error.message || 'Không thể tạo sản phẩm'}`,
      );
    }

    // Lỗi không xác định
    throw new InternalServerErrorException(
      `Có lỗi xảy ra khi thêm sản phẩm: ${error.message || 'Unknown error'}`,
    );
  }
}
}
