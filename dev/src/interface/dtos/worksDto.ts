import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class GetAllWorksDTO {
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
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsBoolean()
  insufficientPermission: boolean;
}

export class GetWorksDTO {
  @IsOptional()
  @IsBoolean()
  insufficientPermission: boolean;

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

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatus: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idConjunto: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idCircuito: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idEmpreendimento: number[];

  @IsOptional()
  @IsString()
  ovnota: string;
}

export class UpdateWorkDTO {
  @IsNumber()
  @IsOptional()
  id_turma: number;

  @IsNumber()
  @IsOptional()
  id_status: number;

  @ValidateIf(
    (_, value) =>
      value === null || value instanceof Date || typeof value === 'string',
  )
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_empreitamento?: Date | null;

  @IsString()
  @IsOptional()
  @IsIn(['CONVENCIONAL', 'PONTO A PONTO'])
  tipo_ads: string;
}

export class ContractUpdateDTO {
  @IsString()
  @Transform(({ value }) => String(value))
  ovnota: string;

  @IsString()
  @Transform(({ value }) => String(value))
  ordemDiagrama: string;

  @IsDate()
  @Type(() => Date)
  dataEmpreitamento: Date;

  @IsString()
  @IsIn(['CONVENCIONAL', 'PONTO A PONTO'])
  tipoAds: string;
}
