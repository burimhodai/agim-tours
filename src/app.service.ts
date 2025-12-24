import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private configService: ConfigService) {}

  getHealth() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: this.configService.get('nodeEnv'),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };
  }

  getWelcome() {
    return {
      message: 'Buli osht tu ngarend',
      version: '1.0.0',
      documentation: '/api/v1/docs',
      health: '/api/v1/health',
    };
  }
}