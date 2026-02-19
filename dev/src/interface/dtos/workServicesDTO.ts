import {
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExecutionReportDataDTO } from './executionReportDTO';

export class ScheduleServicesDTO {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  idTeam: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  idSchedule?: number;

  @IsNumber()
  @Type(() => Number)
  prog: number;
}

export class AddServicesDTO {
  @IsNumber()
  @Type(() => Number)
  idWork: number;

  @IsNumber()
  @Type(() => Number)
  idService: number;

  @IsString()
  point: string;

  @IsString()
  operation: string;

  @IsNumber()
  @Type(() => Number)
  qtdePlan: number;
}

export class PerformServicesDTO {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  idSchedule: number;

  @IsNumber()
  @Type(() => Number)
  qtdeRealizada: number;
}

class DataScheduleInFinalizeServiceDTO {
  @IsNumber()
  @Type(() => Number)
  idSchedule: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idExecutionRestriction?: number;

  @IsOptional()
  @IsString()
  responsibility?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ExecutionReportDataDTO)
  executionReport?: ExecutionReportDataDTO;
}

export class FinalizeServicesDTO {
  @Transform(({ value }) =>
    typeof value === 'string' ? JSON.parse(value) : value,
  )
  @ValidateNested()
  @Type(() => DataScheduleInFinalizeServiceDTO)
  data: DataScheduleInFinalizeServiceDTO;
}
