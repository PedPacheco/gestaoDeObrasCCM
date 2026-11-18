export type StatusFeasibility = 'DENTRO DO PRAZO' | 'FORA DO PRAZO';

export type FeasibilityFileType = 'technical' | 'complementary';

/** ⚠ Confirme as colunas de relatorio_viabilidade no schema.prisma e complete. */
export interface FeasibilityReport {
  id: number;
  workId: number;
  userId: number | null;
  technicalFiles: string[];
  complementaryFiles: string[];
  sentAt: Date | null;
  timeframeStatus: string | null; // prazo_viabilidade (inclui 'FALTA VIABILIDADE')
  approved: boolean | null;
  approvedAt: Date | null;
  approverId: number | null;
}

export interface FeasibilityFiles {
  id: number;
  technicalFiles: string[];
  complementaryFiles: string[];
}

export interface FeasibilityRejection {
  description: string | null;
  reason: string | null;
  createdAt: Date;
  userName: string | null;
}

export interface RejectFeasibilityData {
  feasibilityReportId: number;
  userId: number;
  reason: string;
  description: string;
}

export interface FeasibleItemUpdate {
  id: number;
  feasibleQuantity: number;
}

export interface FeasibilityExportService {
  operation: string | null;
  point: string | null;
  plannedQuantity: number | null;
  feasibleQuantity: number | null;
  operationDescription: string | null;
  operationNumber: string | null;
  material: {
    code: string | null;
    description: string | null;
    price: number | null;
  } | null;
  contractItem: {
    material: string | null;
    shortText: string | null;
    price: number | null;
  } | null;
}

export interface FeasibilityExportWork {
  ovnota: string | null; // ovnota
  diagram: string | null;
  dciOrder: string | null;
  dcaOrder: string | null;
  dcdOrder: string | null;
  dcimOrder: string | null;
  sentAt: Date | null;
  services: FeasibilityExportService[];
}
