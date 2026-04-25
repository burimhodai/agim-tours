import { PartialType } from '@nestjs/mapped-types';
import { CreateDriverReportDto } from './create-driver-report.dto';

export class UpdateDriverReportDto extends PartialType(CreateDriverReportDto) {}
