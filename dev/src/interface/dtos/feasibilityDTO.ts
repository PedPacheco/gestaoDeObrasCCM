import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsString } from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';

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

export class ExportFeasibilityInputDto {
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idPartner: number[];
}
