import { EquipmentItem } from '../dtos/executionReportDTO';

export interface ExecutionReportServiceInterface {
  idSchedule: number;
  idUser: number;
  idWork: number;
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
  provisionalKeyReferenceWithdrawn?: string;
  provisionalKeyWithdrawn?: boolean;
  files?: string;
}

export interface ExecutionReportRepositoryInterface {
  id_usuario: number;
  id_obra: number;
  id_programacao: number;
  supervisor: string;
  liberado_ligacao_parcial: boolean;
  hora_inicio: string;
  hora_conclusao: string;
  contato_inicio: string;
  contato_termino: string;
  atraso: boolean;
  justificativa_atraso: string;
  possui_equipamentos_instalados: boolean;
  equipamentos_aplicados: string;
  possui_equipamentos_retirados: boolean;
  equipamentos_retirados: string;
  alteracoes_execucao: string;
  observacoes_gerais: string;
  situacao_obra: string;
  referencia_chave_provisoria: string;
  chave_provisoria_retirada: boolean;
  motivo: string;
  chave_provisoria_instalada: boolean;
}
