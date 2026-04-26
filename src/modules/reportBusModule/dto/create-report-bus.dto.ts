import { IsString, IsOptional, IsBoolean } from 'class-validator';

export class CreateReportBusDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  plates?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
