import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';
import { R2Service } from './r2.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly r2Service: R2Service,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('r2/storage')
  async getR2Storage(@Query('refresh') refresh?: string) {
    const forceRefresh = refresh === 'true';
    const usedBytes = await this.r2Service.getStorageStats(forceRefresh);
    const maxGb = process.env.R2_MAX_SIZE_GB ? parseFloat(process.env.R2_MAX_SIZE_GB) : 10;
    const totalBytes = maxGb * 1024 * 1024 * 1024;
    const remainingBytes = Math.max(0, totalBytes - usedBytes);
    const usedPercentage = parseFloat(((usedBytes / totalBytes) * 100).toFixed(2));

    return {
      usedBytes,
      totalBytes,
      remainingBytes,
      usedPercentage,
      maxGb,
    };
  }

  @Get('proxy-download')
  async proxyDownload(@Query('url') url: string, @Res() res: Response) {
    try {
      if (!url) {
        return res.status(400).send('URL is required');
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        return res.status(response.status).send('Failed to fetch resource');
      }

      const contentType = response.headers.get('content-type') || 'application/octet-stream';
      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      res.setHeader('Content-Type', contentType);
      const filename = url.split('/').pop()?.split('?')[0] || 'file';
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(buffer);
    } catch (error) {
      console.error('Proxy download error:', error);
      res.status(500).send('Error downloading file');
    }
  }
}
