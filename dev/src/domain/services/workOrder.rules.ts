import { WorkOrderNumbers } from '../types/shared/workOrder.types';

export function resolveOrdemDiagrama(obra: WorkOrderNumbers): string | null {
  return (
    obra?.diagram ??
    obra?.dciOrder ??
    obra?.dcaOrder ??
    obra?.dcdOrder ??
    obra?.dcimOrder ??
    obra?.dcdmOrder ??
    null
  );
}
