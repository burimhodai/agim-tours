import { PartialType } from '@nestjs/mapped-types';
import { CreateReportBusDto } from './create-report-bus.dto';

export class UpdateReportBusDto extends PartialType(CreateReportBusDto) {}
