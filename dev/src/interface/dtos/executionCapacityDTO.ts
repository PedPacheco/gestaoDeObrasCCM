import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class ExecutionCapacityDTO {
  @IsString()
  @IsNotEmpty()
  year: string;

  @IsOptional()
  @IsNumber()
  regionalId?: number;

  @IsOptional()
  @IsNumber()
  partnerId?: number;

  @IsOptional()
  @IsString()
  teams?: string;
}
