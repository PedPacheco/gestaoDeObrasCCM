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
import { ExecutionReportDataDTO } from './executionReportDTO';

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
  data?: string;

  @IsString()
  @IsOptional()
  tipoFiltro?: string;

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
  idStatus: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatusProgramacao: number[];

  @IsOptional()
  @IsString()
  ovnota: string;

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
  page: number;
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
  @IsNumber({}, { message: 'Progresso executado deve ser um número válido' })
  @Transform(({ value }) => {
    if (
      value === '' ||
      value === null ||
      value === undefined ||
      value === 'null'
    ) {
      return null;
    }

    const parsed = Number(value);
    return parsed;
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

export class UpdateSchedulesDataDTO {
  @ValidateNested({ each: true })
  @Type(() => SchedulesDataDTO)
  updateData: SchedulesDataDTO;

  @IsOptional()
  executionReportData?: ExecutionReportDataDTO;
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
