import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { LuggageController } from './luggage.controller';
import { LuggageService } from './luggage.service';
import { LuggageTypeSchema } from 'src/models/luggageType.model';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'LuggageType', schema: LuggageTypeSchema },
    ]),
  ],
  controllers: [LuggageController],
  providers: [LuggageService],
})
export class LuggageModule {}
