import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
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
  workSituation: string;

  @IsString()
  reason: string;

  @IsBoolean()
  provisionalKeyInstalled: boolean;

  @IsString()
  provisionalKeyReference: string;

  @IsBoolean()
  provisionalKeyWithdrawn: boolean;
}

export class UpdateExecutionReportDTO {
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
  workSituation: string;

  @IsString()
  reason: string;

  @IsBoolean()
  provisionalKeyInstalled: boolean;

  @IsString()
  provisionalKeyReference: string;

  @IsBoolean()
  provisionalKeyWithdrawn: boolean;
}
