import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class GoalsDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  tipo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  regional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  parceira?: number[];

  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  ano?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  empreendimento?: number[];

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  btzero: boolean;

  @IsBoolean()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : undefined,
  )
  rda: boolean;
}
