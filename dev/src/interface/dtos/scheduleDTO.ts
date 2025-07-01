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
  data: string;

  @IsString()
  tipoFiltro: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

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

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  executado: boolean;
}

export class GetValueWeeklyScheduleDTO {
  @IsString()
  dataInicial: string;

  @IsString()
  dataFinal: string;

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

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  executado: boolean;
}

export class GetPendingScheduleValuesDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];
}

export class GetMonthlySummaryDTO {
  @IsString()
  date: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo: number[];
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
  prog: number;

  @IsOptional()
  @IsNumber()
  @Transform(({ value }) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }
    const parsed = Number(value);
    return isNaN(parsed) ? null : parsed;
  })
  exec?: number;

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
  lmTeam?: number;

  @IsOptional()
  @IsNumber()
  regulTeam?: number;

  @IsOptional()
  @IsNumber()
  lvTeam?: number;

  @IsOptional()
  @IsNumber()
  idTechnical?: number;

  @IsOptional()
  @IsNumber()
  idExecutionRestriction?: number;

  @IsOptional()
  @IsString()
  responsibility?: string;

  @IsOptional()
  @IsString()
  observation?: string;
}

export class EquipmentItem {
  @IsString()
  equipment: string;

  @IsString()
  power: string;

  @IsString()
  patrimony: string;
}

export class ExecutionReportDataDTO {
  @IsNumber()
  idUser: number;

  @IsString()
  supervisor: string;

  @IsBoolean()
  partialConnectionReleased: boolean;

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

  @IsString()
  startContact: string;

  @IsString()
  endContact: string;

  @IsString()
  delayJustification: string;

  @IsBoolean()
  hasEquipmentInstalled: boolean;

  @IsArray()
  @IsString({ each: true })
  @Type(() => EquipmentItem)
  appliedEquipment: EquipmentItem[];

  @IsBoolean()
  hasEquipmentRemoved: boolean;

  @IsArray()
  @IsString({ each: true })
  @Type(() => EquipmentItem)
  equipmentRemoved: EquipmentItem[];

  @IsBoolean()
  changesExecution: boolean;

  @IsString()
  generalObservation: string;

  @IsString()
  workSituation: string;

  @IsString()
  reason: string;

  @IsBoolean()
  provisionalKeyInstalled: boolean;

  @IsString()
  provisionalKeyReference: string;

  @IsBoolean()
  provisionalKeyWithdrawn: boolean;
}

export class UpdateSchedulesDataDTO {
  @ValidateNested({ each: true })
  @Type(() => SchedulesDataDTO)
  updateData: SchedulesDataDTO;

  @IsOptional()
  executionReportData?: ExecutionReportDataDTO;
}
