import { Transform, Type } from 'class-transformer';
import { IsArray, IsIn, IsNumber, IsOptional, IsString } from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class GetRestrictionsDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsString()
  ovnota?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idMunicipio?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRestricao?: number[];

  @IsOptional()
  @IsArray()
  @IsIn(['done', 'pending'], { each: true })
  @Transform(({ value }) => {
    if (!value) return undefined;

    if (Array.isArray(value)) return value;

    return value.split(',').map((v: string) => v.trim());
  })
  status?: ('done' | 'pending')[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page?: number;
}

export class InsertPublicationRestrictionsDTO {
  @IsNumber()
  id: number;

  @IsNumber()
  idRestriction: number;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibility: string;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleName: string;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  restrictionStatus: string;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsString()
  @IsOptional()
  constructionObservation?: string;

  @IsNumber()
  idUser: number;
}

export class GetRestrictionsAdvancePartnerDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];
}

export class UpdatePublicationRestrictionsDTO {
  @IsNumber()
  id: number;

  @IsNumber()
  idRestriction: number;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibility?: string;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  responsibleName?: string;

  @IsString()
  @Transform(({ value }) => (value === '' ? null : value))
  restrictionStatus?: string;

  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? null : value))
  resolutionDate?: string;

  @IsString()
  @IsOptional()
  observation?: string;

  @IsString()
  @IsOptional()
  constructionObservation?: string;

  @IsNumber()
  idUser: number;
}
