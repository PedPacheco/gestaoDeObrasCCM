import { Type } from 'class-transformer';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ExecutionCapacityDTO {
  @IsString()
  @IsNotEmpty()
  year: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  regionalId?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  partnerId?: number;

  @IsOptional()
  @IsString()
  teams?: string;
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
