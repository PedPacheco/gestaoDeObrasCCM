import {
  IsEnum,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ExecutionReportDataDTO } from './executionReportDTO';

enum ServiceType {
  SERVICE = 'S',
  MATERIAL = 'M',
}

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

  @IsString()
  @IsIn(['M', 'S'], {
    message: "O tipo deve ser 'S' OU 'M'",
  })
  type: 'M' | 'S';

  @IsString()
  operation: string;

  @IsString()
  point: string;

  @IsNumber()
  @Type(() => Number)
  prog: number;

  @IsNumber()
  @Type(() => Number)
  @IsOptional()
  additional?: number;
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

  @IsString()
  operationNumber: string;

  @IsString()
  operationDescription: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
}

export class AddFamilyDTO {
  @IsNumber()
  @Type(() => Number)
  idWork: number;

  @IsNumber()
  @Type(() => Number)
  idService: number;

  @IsEnum(ServiceType)
  type: ServiceType;

  @IsString()
  point: string;

  @IsString()
  operation: string;

  @IsString()
  operationDescription: string;

  @IsNumber()
  @Type(() => Number)
  quantity: number;
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
  @IsOptional()
  qtdeRealizada?: number;
}

export class ApplyAdditonalDTO {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  additional: number;
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
  @IsString()
  executionObservation?: string;

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

export class ServiceMaterialItemDto {
  @IsInt()
  id: number;

  @Transform(({ value }) => {
    if (value === null || value === undefined || value === '') {
      return value; // deixa @IsNumber acusar se for obrigatório
    }

    const normalized =
      typeof value === 'string' ? value.replace(',', '.') : value;

    const parsed = Number(normalized);

    return Number.isNaN(parsed) ? value : parsed; // se não converter, deixa passar o valor original pro validador rejeitar
  })
  @IsNumber()
  viabilizado: number;
}
