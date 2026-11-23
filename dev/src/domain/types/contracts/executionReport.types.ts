export type EquipmentItem = {
  equipment: string;
  power: string;
  patrimony: string;
  installation: string;
};

/** Entrada de ExecutionReport.create: horas em string (HH:mm), ficheiros por normalizar. */
export type ExecutionReportProps = {
  idSchedule: number;
  idWork: number;
  userId: number;
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
  files?: string[] | null;
};

/** Estado da entidade depois de criada e validada. */
export type ExecutionReportSnapshot = Omit<
  ExecutionReportProps,
  'startTime' | 'finishTime' | 'files'
> & {
  startTime: Date;
  finishTime: Date;
  files: string[];
  delayed: boolean;
};

/** Leitura usada no update e no delete (ficheiros e ligações). */
export interface ExecutionReportFiles {
  id: number;
  workId: number;
  scheduleId: number;
  filePaths: string[]; // caminhos_arquivos, com fallback para caminho_arquivo
}

export interface ExecutionReportWork {
  orderNumber: string | null; // ovnota
  dciOrder: string | null; // ordem_dci
  type: string | null; // tipos.tipo_obra
  status: string | null; // status.status
}

export interface ExecutionReportSchedule {
  date: Date | null; // data_prog
  planned: number | null; // prog
  executed: number | null; // exec
  dpNumber: string | null; // num_dp
  startTime: Date | null; // hora_ini
  endTime: Date | null; // hora_ter
  provisionalKey: boolean | null; // chave_provisoria
}

/** Leitura do findByWorkId: as colunas guardadas, em camelCase. */
export interface ExecutionReportDetail {
  id: number;
  createdAt: Date;
  userId: number | null;
  supervisor: string | null;
  partialConnectionReleased: boolean | null;
  startTime: Date | null;
  finishTime: Date | null;
  startContact: string | null;
  endContact: string | null;
  delay: boolean | null;
  delayJustification: string | null;
  hasEquipmentInstalled: boolean | null;
  appliedEquipment: string | null;
  appliedEquipmentPower: string | null;
  appliedEquipmentPatrimony: string | null;
  appliedEquipmentInstallation: string | null;
  hasEquipmentRemoved: boolean | null;
  removedEquipment: string | null;
  removedEquipmentPower: string | null;
  removedEquipmentPatrimony: string | null;
  removedEquipmentInstallation: string | null;
  changesExecution: boolean | null;
  generalObservation: string | null;
  provisionalKeyInstalled: boolean | null;
  provisionalKeyReference: string | null;
  provisionalKeyWithdrawn: boolean | null;
  provisionalKeyReferenceWithdrawn: string | null;
  reason: string | null;
  legacyFilePath: string | null; // caminho_arquivo (sai no fim do Passo 2.5)
  filePaths: string[]; // caminhos_arquivos, tal como está na BD
  userName: string | null;
  work: ExecutionReportWork | null;
  schedule: ExecutionReportSchedule | null;
}

export interface ScheduleWorkMode {
  workId: number;
  pointToPoint: boolean | null;
}

export interface WorkStatusResetData {
  status: number;
  executed?: number;
}
