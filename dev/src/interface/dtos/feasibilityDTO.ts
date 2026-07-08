import { IsNumber, IsString } from 'class-validator';

export class RejectFeasibilityDTO {
  @IsNumber()
  idWork: number;

  @IsNumber()
  idUser: number;

  @IsString()
  reason: string;

  @IsString()
  description: string;
}
