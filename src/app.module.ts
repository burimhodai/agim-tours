import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';

@Module({
  imports: [
    // Config Module - Must be first
    ConfigModule.forRoot({
      isGlobal: true, // Makes ConfigService available everywhere
      load: [configuration], // Load custom configuration
      validationOptions: {
        allowUnknown: true, // Allow unknown env variables
        abortEarly: false, // Show all validation errors
      },
      envFilePath: ['.env.local', '.env'], // Load env files in order
      cache: true, // Cache config for performance
    }),

    // Database Module

    // Feature Modules (will be added here)
    // AuthModule,
    // UsersModule,
    // PermissionsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}