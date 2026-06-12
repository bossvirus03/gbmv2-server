import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

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
   * Upload file vào folder: images/batches/[batchId]/
   */
  async upload(file: Express.Multer.File, batchId: number): Promise<string> {
    if (!batchId) {
      throw new Error('batchId is required for upload');
    }

    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `images/batches/${batchId}/${timestamp}-${random}-${safeFilename}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  /**
   * Xóa file khỏi R2 theo full public URL.
   * Trích xuất key từ URL bằng cách bỏ phần prefix R2_PUBLIC_URL.
   */
  async deleteByUrl(imageUrl: string): Promise<void> {
    if (!imageUrl) return;

    const publicUrl = (process.env.R2_PUBLIC_URL || '').replace(/\/$/, '');
    let key: string;

    if (publicUrl && imageUrl.startsWith(publicUrl)) {
      // Bỏ prefix và dấu "/" đầu để lấy key, ví dụ: "images/batches/1/xxx.jpg"
      key = imageUrl.slice(publicUrl.length).replace(/^\//, '');
    } else {
      // Fallback: lấy pathname từ URL
      try {
        key = new URL(imageUrl).pathname.replace(/^\//, '');
      } catch {
        return; // URL không hợp lệ, bỏ qua không throw
      }
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: process.env.R2_BUCKET,
        Key: key,
      }),
    );
  }
}