import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';
import { ScheduleServicesDTO } from './workServicesDTO';

export class GetTotalValuesScheduleDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idCircuito: number[];

  @IsNumber()
  @Type(() => Number)
  ano: number;
}

export class GetScheduleValuesDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idMunicipio?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatus?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatusProgramacao?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatusSap?: number[];

  @IsOptional()
  @IsString()
  ovnota?: string;

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  executado: boolean;

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  pendente: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;
}

export class GetMonthlySummaryDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo?: number[];
}

export class GetExecMonitoringDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTecnico?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo?: number[];
}

export class ValidateSchedulesDTO {
  @IsNumber()
  id: number;

  @IsBoolean()
  validate: boolean;
}

export class ConfirmSchedulesDTO {
  @IsNumber()
  id: number;

  @IsBoolean()
  confirm: boolean;
}

export class RejectScheduleDTO {
  @IsNumber()
  id: number;

  @IsBoolean()
  reject: boolean;

  @IsString()
  reason: string;

  @IsString()
  description: string;
}

export class SchedulesDataDTO {
  @IsNumber()
  idWork: number;

  @IsDate()
  @Type(() => Date)
  dataProg: Date;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  finishTime: string;

  @IsOptional()
  @IsString()
  serviceType?: string;

  @IsNumber()
  @Type()
  @IsOptional()
  prog?: number;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  equipment?: string;

  @IsOptional()
  @IsNumber()
  chi?: number;

  @IsOptional()
  @IsString()
  numDp?: string;

  @IsOptional()
  @IsBoolean()
  temporaryKey?: boolean;

  @IsOptional()
  @IsNumber()
  idTechnical?: number;

  @IsNumber()
  idProgRestriction1: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibilityProg?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleName?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleArea?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  restrictionStatus?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  resolutionDate?: Date;

  @IsNumber()
  idProgRestriction2: number;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibilityProg2?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleName2?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleArea2?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  restrictionStatus2?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  resolutionDate2?: Date;

  @IsBoolean()
  @IsOptional()
  validated?: boolean;

  @IsBoolean()
  @IsOptional()
  confirmed?: boolean;
}

export class CreateScheduleWithServicesDTO {
  @ValidateNested()
  @Type(() => SchedulesDataDTO)
  schedule: SchedulesDataDTO;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ScheduleServicesDTO)
  services: ScheduleServicesDTO[];
}
