import { PartialType } from '@nestjs/mapped-types';
import { CreateFuelReportDto } from './create-fuel-report.dto';

export class UpdateFuelReportDto extends PartialType(CreateFuelReportDto) {}
