import { IsNumber, IsString } from 'class-validator';

export class RejectFeasibilityDTO {
  @IsNumber()
  feasibilityReportId: number;

  @IsNumber()
  workId: number;

  @IsNumber()
  userId: number;

  @IsString()
  reason: string;

  @IsString()
  description: string;
}
