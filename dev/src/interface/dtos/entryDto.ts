import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import * as moment from 'moment';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class GetEntryOfWorksDTO {
  @IsNumber()
  @Type(() => Number)
  ano: number;

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
}

export class InsertMarketWorksDTO {
  @IsString()
  @IsNotEmpty()
  obra: string;

  @IsString()
  pep: string;

  @IsString()
  diagrama: string;

  @IsDate()
  @Type(() => Date)
  entrada: Date;

  @IsString()
  gpm: string;

  @IsString()
  tipo: string;

  @IsString()
  circuito: string;

  @IsString()
  prazoTexto: string;

  @IsString()
  tecnicoResp: string;

  @IsNumber()
  statusOv: number;

  @IsString()
  statusDiagrama: number;

  @IsString()
  statusPep: string;

  @IsString()
  equipeNumPedido: string;

  @IsNumber()
  moCliente: number;

  @IsNumber()
  moEmpresa: number;

  @IsString()
  observacao: string;

  @IsString()
  turma: string;
}
