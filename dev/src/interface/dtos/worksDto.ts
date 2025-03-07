import { Transform, Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class GetAllWorksDTO {
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
  idStatus: number[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;
}

export class GetWorksDTO {
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsString()
  data: string;

  @IsOptional()
  @IsString()
  tipoFiltro: string;

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
  idStatus: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idConjunto: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idCircuito: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idEmpreendimento: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  idOvnota: number[];
}
