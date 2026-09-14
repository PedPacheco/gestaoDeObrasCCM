import { EquipmentItem } from '../executionReport.types';

export type PerformServicesInput = {
  id: number;
  idSchedule: number;
  qtdeRealizada?: number;
};

export type ExecutionReportDataInput = {
  supervisor: string;
  partialConnectionReleased: boolean;
  startTime: string;
  finishTime: string;
  startContact: string;
  endContact: string;
  delayJustification: string;
  hasEquipmentInstalled: boolean;
  appliedEquipment: EquipmentItem[];
  hasEquipmentRemoved: boolean;
  equipmentRemoved: EquipmentItem[];
  changesExecution: boolean;
  generalObservation: string;
  reason: string;
  provisionalKeyInstalled: boolean;
  provisionalKeyReference: string;
  provisionalKeyWithdrawn?: boolean;
  provisionalKeyReferenceWithdrawn?: string;
  userId: number;
};

export type FinalizeServicesInput = {
  idSchedule: number;
  idExecutionRestriction?: number;
  responsibility?: string;
  executionObservation?: string;
  userId: number;
  executionReportData?: ExecutionReportDataInput;
};

export type FinalizeServicesData = {
  id: number;
  idWork: number;
  dataProg: Date;
  prog: number;
  exec: number;
  idExecutionRestriction: number;
  responsibility: string;
  executionObservation: string;
  userId: number;
};
