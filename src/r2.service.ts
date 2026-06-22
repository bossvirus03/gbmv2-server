import { Injectable, Logger } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import sharp from 'sharp';

@Injectable()
export class R2Service {
  private client: S3Client;

  constructor() {
    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY!,
        secretAccessKey: process.env.R2_SECRET_KEY!,
      },
    });
  }

  /**
   * Nén ảnh bằng sharp: resize tối đa 800px, chuyển sang WebP chất lượng 80
   * Giảm 60-80% dung lượng so với ảnh gốc (JPEG/PNG)
   */
  async compressImage(
    buffer: Buffer,
  ): Promise<{ buffer: Buffer; contentType: string }> {
    const compressed = await sharp(buffer)
      .rotate() // Tự động xoay theo EXIF metadata (quan trọng cho ảnh chụp từ điện thoại)
      .resize(800, 800, {
        fit: 'inside', // Giữ nguyên tỷ lệ, không crop
        withoutEnlargement: true, // Không phóng to ảnh nhỏ hơn 800px
      })
      .webp({ quality: 80 }) // Chuyển sang WebP - nén tốt hơn JPEG 30-40%
      .toBuffer();

    return { buffer: compressed, contentType: 'image/webp' };
  }

  /**
   * Upload file vào folder: images/batches/[batchId]/
   * Tự động nén ảnh trước khi upload
   */
  private readonly logger = new Logger(R2Service.name);

  async upload(file: Express.Multer.File, batchId: number): Promise<string> {
    if (!batchId) {
      throw new Error('batchId is required for upload');
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const key = `images/batches/${batchId}/${timestamp}-${random}.webp`;

    try {
      this.logger.log(`[R2] Bắt đầu nén ảnh: ${file.originalname || 'file'}`);
      const { buffer: compressedBuffer, contentType } = await this.compressImage(
        file.buffer,
      );
      this.logger.log(`[R2] Nén ảnh thành công. Kích thước sau nén: ${compressedBuffer.length} bytes`);

      this.logger.log(`[R2] Đang upload lên bucket ${process.env.R2_BUCKET} với key: ${key}`);
      await this.client.send(
        new PutObjectCommand({
          Bucket: process.env.R2_BUCKET,
          Key: key,
          Body: compressedBuffer,
          ContentType: contentType,
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      this.logger.log(`[R2] Upload thành công lên R2`);

      return `${process.env.R2_PUBLIC_URL}/${key}`;
    } catch (error: any) {
      this.logger.error(`[R2] Lỗi trong quá trình xử lý/tải lên file ${file.originalname || 'file'}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Download ảnh từ R2 về Buffer (dùng cho migration)
   */
  async downloadBuffer(imageUrl: string): Promise<Buffer> {
    const key = this.extractKey(imageUrl);

    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      }),
    );

    // Chuyển ReadableStream -> Buffer
    const chunks: Uint8Array[] = [];
    for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  /**
   * Upload một buffer trực tiếp lên R2 với key cho trước
   */
  async uploadBuffer(
    key: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  /**
   * Xóa file khỏi R2 theo full public URL.
   */
  async deleteByUrl(imageUrl: string): Promise<void> {
    if (!imageUrl) return;
    const key = this.extractKey(imageUrl);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      }),
    );
  }

  /**
   * Trích xuất R2 object key từ public URL
   */
  extractKey(imageUrl: string): string {
    const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');

    if (publicUrl && imageUrl.startsWith(publicUrl)) {
      return imageUrl.slice(publicUrl.length).replace(/^\//, '');
    }

    try {
      return new URL(imageUrl).pathname.replace(/^\//, '');
    } catch {
      throw new Error(`URL không hợp lệ: ${imageUrl}`);
    }
  }
}
