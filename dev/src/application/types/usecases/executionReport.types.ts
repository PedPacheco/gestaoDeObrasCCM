type EquipmentItem = {
  equipment: string;
  power: string;
  patrimony: string;
  installation: string;
};

export type UpdateExecutionReportInput = {
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
