import { Transform, Type } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString } from 'class-validator';
import * as moment from 'moment';

export class GetEntryOfWorksDTO {
  @IsNumber()
  @Type(() => Number)
  ano: number;

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
}

export class GetEntryOfWorksByDayDTO {
  @IsDate()
  @Transform(({ value }) => {
    const formats = ['DD/MM/YYYY', 'MM/YYYY'];
    const date = moment(value, formats, true);
    return date.isValid() ? date.toDate() : null;
  })
  data: Date;

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
}
