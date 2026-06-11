import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
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
