import { Type } from 'class-transformer';
import { IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAllWorksDTO {
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
  idStatus: number;
}

export class GetWorksDTO {
  @IsOptional()
  @IsString()
  data: string;

  @IsOptional()
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

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idStatus: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idConjunto: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idCircuito: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idEmpreendimento: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  idOvnota: number;
}
