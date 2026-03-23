import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { GetMonthlySummaryDTO } from './scheduleDTO';

export class DailySummaryEntryForecastDTO {
  @IsString()
  dataProg: string;

  @IsNumber()
  qtdeWorks: number;

  @IsNumber()
  teams: number;

  @IsNumber()
  financialGoal: number;

  @IsNumber()
  diaryGoal: number;

  @IsNumber()
  serviceMoProg: number;

  @IsNumber()
  serviceMoPlan: number;

  @IsNumber()
  serviceMoPend: number;

  @IsNumber()
  serviceMoExec: number;

  @IsNumber()
  serviceMoForecast: number;

  @IsNumber()
  materialMoProg: number;

  @IsNumber()
  materialMoPlan: number;

  @IsNumber()
  materialMoPend: number;

  @IsNumber()
  materialMoExec: number;

  @IsNumber()
  materialMoForecast: number;

  @IsBoolean()
  isServicePendLowerThanProg: boolean;

  @IsBoolean()
  isMaterialPendLowerThanProg: boolean;

  @IsNumber()
  diff: number;
}

export class GroupTeamSummaryEntryForecastDTO {
  @IsString()
  grupo: string;

  @IsString()
  turma: string;

  @IsNumber()
  qtdeWorks: number;

  @IsNumber()
  totalServiceMoProg: number;

  @IsNumber()
  totalServiceMoPlan: number;

  @IsNumber()
  totalServiceMoPend: number;

  @IsNumber()
  totalServiceMoPrev: number;

  @IsNumber()
  totalServiceMoExec: number;

  @IsNumber()
  totalMaterialMoProg: number;

  @IsNumber()
  totalMaterialMoPlan: number;

  @IsNumber()
  totalMaterialMoPend: number;

  @IsNumber()
  totalMaterialMoPrev: number;

  @IsNumber()
  totalMaterialMoExec: number;

  @IsNumber()
  diff: number;
}

export class CreateForecastSnapshotDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailySummaryEntryForecastDTO)
  diario: DailySummaryEntryForecastDTO[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupTeamSummaryEntryForecastDTO)
  grupo: GroupTeamSummaryEntryForecastDTO[];

  @IsOptional()
  @ValidateNested()
  @Type(() => GetMonthlySummaryDTO)
  filtros?: GetMonthlySummaryDTO;
}

export class GetForecastSnapshotDTO {
  @IsOptional()
  @IsDateString()
  dataInicial?: string;

  @IsOptional()
  @IsDateString()
  dataFinal?: string;
}
