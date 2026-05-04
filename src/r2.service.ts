import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

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
    const safeFilename = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `images/batches/${batchId}/${timestamp}-${safeFilename}`;

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
}