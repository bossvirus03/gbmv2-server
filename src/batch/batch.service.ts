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

    // Upload song song
    const imageUrls = await Promise.all(
      files.map((file) => this.r2Service.upload(file, batchId)),
    );

    const data = imageUrls.map((imageUrl) => ({
      imageUrl,
      batchId,
      price: 0,
    }));

    return this.prisma.product.createMany({
      data,
      skipDuplicates: true,
    });
  }
}
