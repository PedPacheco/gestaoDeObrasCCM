import { Transform } from 'class-transformer';
import { IsArray, IsBoolean, IsOptional } from 'class-validator';

export class GoalsDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  tipo?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  regional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  parceira?: number[];

  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  ano?: number[];

  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) =>
    value === 'true' ? true : value === 'false' ? false : value,
  )
  btzero?: boolean;
}

export class RdaGoalsDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  regional?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  parceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  empreendimento?: number[];

  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  ano?: number[];
}
