import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class GetTotalValuesScheduleDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
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

  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
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
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
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
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idRegional: number[];
}

export class GetMonthlySummaryDTO {
  @IsString()
  date: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idTipo: number[];
}
