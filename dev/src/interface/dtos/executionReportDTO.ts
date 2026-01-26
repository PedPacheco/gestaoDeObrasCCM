import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

export class EquipmentItem {
  @IsString()
  equipment: string;

  @IsString()
  power: string;

  @IsString()
  patrimony: string;

  @IsString()
  installation: string;
}

export class ExecutionReportDataDTO {
  @IsNumber()
  idUser: number;

  @IsString()
  supervisor: string;

  @IsBoolean()
  partialConnectionReleased: boolean;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  startTime: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/, {
    message: 'horario deve estar no formato HH:mm (ex: 14:30)',
  })
  finishTime: string;

  @IsString()
  startContact: string;

  @IsString()
  endContact: string;

  @IsString()
  delayJustification: string;

  @IsBoolean()
  hasEquipmentInstalled: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItem)
  appliedEquipment: EquipmentItem[];

  @IsBoolean()
  hasEquipmentRemoved: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EquipmentItem)
  equipmentRemoved: EquipmentItem[];

  @IsBoolean()
  changesExecution: boolean;

  @IsString()
  generalObservation: string;

  @IsString()
  reason: string;

  @IsBoolean()
  provisionalKeyInstalled: boolean;

  @IsString()
  provisionalKeyReference: string;

  @IsBoolean()
  @IsOptional()
  provisionalKeyWithdrawn?: boolean;

  @IsString()
  @IsOptional()
  provisionalKeyReferenceWithdrawn?: string;
}

export class UpdateExecutionReportDTO {
  @Transform(({ value }) => {
    const parsed = typeof value === 'string' ? JSON.parse(value) : value;
    return parsed;
  })
  @ValidateNested()
  @Type(() => ExecutionReportDataDTO)
  executionReportData: ExecutionReportDataDTO;
}
