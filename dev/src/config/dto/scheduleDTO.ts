import { Transform, Type } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetTotalValuesScheduleDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idRegional: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idMunicipio: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idGrupo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idTipo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idParceira: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idCircuito: number;

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
  idRegional: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idMunicipio: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idGrupo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idTipo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idParceira: number;

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
  @IsNumber()
  @Type(() => Number)
  idRegional: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idMunicipio: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idGrupo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idTipo: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idParceira: number;

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  executado: boolean;
}

export class GetPendingScheduleValuesDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idParceira: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idRegional: number;
}
