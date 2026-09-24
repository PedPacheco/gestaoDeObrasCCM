import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';
import { OmitType, PartialType } from '@nestjs/mapped-types';
import { BadRequestException } from '@nestjs/common';

export class D5NotesFiltersDTO {
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

  @IsNumber()
  @Type(() => Number)
  page?: number;
}

export class D5NotesSchedulesFiltersDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

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

  @IsNumber()
  @Type(() => Number)
  page?: number;
}

export class CreateProgramacaoD5Dto {
  @IsInt()
  @Type(() => Number)
  d5NoteId: number;

  @IsDateString()
  scheduledDate: string;

  @IsInt()
  @Type(() => Number)
  prog: number;

  @IsOptional()
  @IsNumber()
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
  observation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  numDp?: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  endTime: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lmTeam?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  regulTeam?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  lvTeam?: number;

  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  temporaryKey?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  serviceType?: string;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  chi?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  technicalId?: number;

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  restrictionId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  restrictionResponsible?: string;

  @IsOptional()
  @IsString()
  executionObservation?: string;

  @IsInt()
  @Type(() => Number)
  creatorUserId: number;

  @IsInt()
  @Type(() => Number)
  modifyingUserId: number;
}

export class UpdateScheduleD5Dto extends PartialType(
  OmitType(CreateProgramacaoD5Dto, [
    'd5NoteId',
    'creatorUserId',
    'modifyingUserId',
  ] as const),
) {
  /**
   * Nomes JÁ existentes em caminhos_arquivos que devem permanecer.
   * Enviado como JSON string — evita a ambiguidade do array vazio em multipart.
   *   omitido  → não mexer nos anexos
   *   "[]"     → remover todos
   */
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @Transform(({ value }) => {
    if (value === undefined || value === null) return undefined;
    if (Array.isArray(value)) return value;

    try {
      const parsed = JSON.parse(value);

      if (!Array.isArray(parsed)) {
        throw new Error();
      }

      return parsed;
    } catch {
      throw new BadRequestException('keptFiles deve ser um array JSON válido');
    }
  })
  keptFiles?: string[];
}
