import { IsNumber, IsOptional } from 'class-validator';
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
  @IsOptional()
  idSchedule?: number;

  @IsNumber()
  @Type(() => Number)
  prog: number;
}

export class PerformServicesDTO {
  @IsNumber()
  @Type(() => Number)
  id: number;

  @IsNumber()
  @Type(() => Number)
  qtdeRealizada: number;
}
