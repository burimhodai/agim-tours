import { ConfigService } from '@nestjs/config';
import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (
  configService: ConfigService,
): MongooseModuleOptions => ({
  uri: configService.get<string>('database.uri'),
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
});