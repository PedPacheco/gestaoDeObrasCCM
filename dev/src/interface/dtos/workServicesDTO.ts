import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class ScheduleServicesDTO {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  idTeam: number;

  @IsNumber()
  @Type(() => Number)
  idSchedule: number;

  @IsNumber()
  @Type(() => Number)
  prog: number;
}
