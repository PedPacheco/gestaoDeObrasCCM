import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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

export class DailyForecastSummaryTotalsDTO {
  @IsNumber()
  totalQtdeObras: number;

  @IsNumber()
  totalTeams: number;

  @IsNumber()
  totalFinancialGoal: number;

  @IsNumber()
  totalDiaryGoal: number;

  @IsNumber()
  totalServiceMoProg: number;

  @IsNumber()
  totalServiceMoPlan: number;

  @IsNumber()
  totalServiceMoPend: number;

  @IsNumber()
  totalServiceMoExec: number;

  @IsNumber()
  totalServiceMoForecast: number;

  @IsNumber()
  totalMaterialMoProg: number;

  @IsNumber()
  totalMaterialMoPlan: number;

  @IsNumber()
  totalMaterialMoPend: number;

  @IsNumber()
  totalMaterialMoForecast: number;

  @IsNumber()
  totalMaterialMoExec: number;

  @IsNumber()
  totalDiff: number;
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

export class GroupForecastSummaryTotalsDTO {
  @IsNumber()
  totalWorks: number;

  @IsNumber()
  totalServiceMoProgByGrouping: number;

  @IsNumber()
  totalServiceMoPlanByGrouping: number;

  @IsNumber()
  totalServiceMoPendByGrouping: number;

  @IsNumber()
  totalServiceMoExecByGrouping: number;

  @IsNumber()
  totalMaterialMoProgByGrouping: number;

  @IsNumber()
  totalMaterialMoPlanByGrouping: number;

  @IsNumber()
  totalMaterialMoPendByGrouping: number;

  @IsNumber()
  totalMaterialMoExecByGrouping: number;

  @IsNumber()
  totalDiff: number;
}

export class DiaryDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DailySummaryEntryForecastDTO)
  summary: DailySummaryEntryForecastDTO[];

  @ValidateNested()
  @Type(() => DailyForecastSummaryTotalsDTO)
  totals: DailyForecastSummaryTotalsDTO;
}

export class GroupDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GroupTeamSummaryEntryForecastDTO)
  summary: GroupTeamSummaryEntryForecastDTO[];

  @ValidateNested()
  @Type(() => GroupForecastSummaryTotalsDTO)
  totals: GroupForecastSummaryTotalsDTO;
}

export class CreateForecastSnapshotDTO {
  @ValidateNested()
  @Type(() => DiaryDTO)
  diario: DiaryDTO;

  @ValidateNested()
  @Type(() => GroupDTO)
  grupo: GroupDTO;

  @IsOptional()
  @ValidateNested()
  @Type(() => GetMonthlySummaryDTO)
  filtros?: GetMonthlySummaryDTO;
}

export class GetForecastSnapshotDTO {
  // @IsOptional()
  // @IsDateString()
  // dataInicial?: string;

  // @IsOptional()
  // @IsDateString()
  // dataFinal?: string;

  @IsNumber()
  @Type(() => Number)
  idForecast: number;
}
