import { Transform } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  convertParameterValue,
  convertParameterValueForArray,
} from 'src/utils/convertParameterValue';

export class ExecutionCapacityDTO {
  @IsString()
  @IsNotEmpty()
  ano: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  equipe?: string[];
}

export class UpdateExecutionCapacityDTO {
  @IsNumber()
  @IsNotEmpty()
  id: number;

  @IsNumber()
  @IsOptional()
  jan?: number;

  @IsNumber()
  @IsOptional()
  fev?: number;

  @IsNumber()
  @IsOptional()
  mar?: number;

  @IsNumber()
  @IsOptional()
  abr?: number;

  @IsNumber()
  @IsOptional()
  mai?: number;

  @IsNumber()
  @IsOptional()
  jun?: number;

  @IsNumber()
  @IsOptional()
  jul?: number;

  @IsNumber()
  @IsOptional()
  ago?: number;

  @IsNumber()
  @IsOptional()
  set?: number;

  @IsNumber()
  @IsOptional()
  out?: number;

  @IsNumber()
  @IsOptional()
  nov?: number;

  @IsNumber()
  @IsOptional()
  dez?: number;
}
