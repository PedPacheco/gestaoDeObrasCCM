import { Transform } from 'class-transformer';
import { IsArray, IsOptional } from 'class-validator';

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

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => value.toString().split(',').map(Number))
  ano?: number[];
}
