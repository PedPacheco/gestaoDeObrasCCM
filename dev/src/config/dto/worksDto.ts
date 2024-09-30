import { Type } from 'class-transformer';
import { IsNumber, IsOptional } from 'class-validator';

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
