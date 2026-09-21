import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';
import { OmitType } from '@nestjs/mapped-types';

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

export class CreateProgramacaoD5Dto {
  @IsInt()
  d5NoteId: number;

  @IsDateString()
  scheduledDate: string;

  @IsInt()
  prog: number;

  @IsOptional()
  @IsInt()
  exec?: number;

  @IsOptional()
  @IsString()
  observation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(25)
  numDp?: string;

  @IsOptional()
  @IsDateString()
  startTime?: string;

  @IsOptional()
  @IsDateString()
  endTime?: string;

  @IsOptional()
  @IsNumber()
  lmTeam?: number;

  @IsOptional()
  @IsNumber()
  regulTeam?: number;

  @IsOptional()
  @IsNumber()
  lvTeam?: number;

  @IsOptional()
  @IsBoolean()
  temporaryKey?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  serviceType?: string;

  @IsOptional()
  @IsInt()
  chi?: number;

  @IsOptional()
  @IsInt()
  technicalId?: number;

  @IsOptional()
  @IsInt()
  restrictionId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  restrictionResponsible?: string;

  @IsOptional()
  @IsString()
  executionObservation?: string;

  @IsInt()
  creatorUserId: number;

  @IsInt()
  modifyingUserId: number;
}

export class UpdateScheduleD5Dto extends OmitType(CreateProgramacaoD5Dto, [
  'creatorUserId',
] as const) {
  @IsInt()
  modifyingUserId: number;
}
