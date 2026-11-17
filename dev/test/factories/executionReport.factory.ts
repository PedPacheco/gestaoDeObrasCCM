import { ExecutionReport } from 'src/domain/entities/executionReport.entity';
import {
  EquipmentItem,
  ExecutionReportDetail,
  ExecutionReportProps,
} from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';
import { ExecutionReportDetailRow } from 'src/infra/types';

// ⚠️ Campos supostos: substitua pelos campos reais de EquipmentItem
export const makeEquipmentItem = (
  overrides: Partial<EquipmentItem> = {},
): EquipmentItem =>
  ({
    equipment: 'Transformador 75kVA',
    power: '75kVA',
    patrimony: 'PAT-0001',
    installation: 'INST-9001',
    ...overrides,
  }) as EquipmentItem;

export const makeExecutionReportProps = (
  overrides: Partial<ExecutionReportProps> = {},
): ExecutionReportProps => ({
  idSchedule: 101,
  idWork: 202,
  userId: 42,
  supervisor: 'Supervisor de teste',
  partialConnectionReleased: true,
  startTime: '08:15',
  finishTime: '17:45',
  startContact: 'Contacto inicial',
  endContact: 'Contacto final',
  delayJustification: 'Trânsito intenso',
  hasEquipmentInstalled: true,
  appliedEquipment: [makeEquipmentItem()], // use um EquipmentItem válido do seu projeto
  hasEquipmentRemoved: true,
  equipmentRemoved: [makeEquipmentItem()],
  changesExecution: false,
  generalObservation: 'Execução concluída',
  reason: 'Manutenção preventiva',
  provisionalKeyInstalled: true,
  provisionalKeyReference: 'CHV-PROV-01',
  provisionalKeyWithdrawn: false,
  provisionalKeyReferenceWithdrawn: 'CHV-PROV-02',
  files: [' relatorios/101/foto1.jpg '],
  ...overrides,
});

export const makeExecutionReport = (
  overrides: Partial<ExecutionReportProps> = {},
  scheduledFinishTime = new Date('2025-06-10T18:00:00.000Z'),
): ExecutionReport =>
  ExecutionReport.create(
    makeExecutionReportProps(overrides),
    scheduledFinishTime,
  );

// O que deve chegar a tx.relatorio_execucao.create({ data })
export const makeExecutionReportRow = (
  overrides: Partial<Prisma.relatorio_execucaoUncheckedCreateInput> = {},
): Prisma.relatorio_execucaoUncheckedCreateInput => ({
  id_usuario: 42,
  id_obra: 202,
  id_programacao: 101,
  supervisor: 'Supervisor de teste',
  liberado_ligacao_parcial: true,
  hora_inicio: new Date('1970-01-01T08:15:00.000Z'),
  hora_conclusao: new Date('1970-01-01T17:45:00.000Z'),
  contato_inicio: 'Contacto inicial',
  contato_termino: 'Contacto final',
  atraso: false,
  justificativa_atraso: 'Trânsito intenso',
  possui_equipamentos_instalados: true,
  equipamentos_aplicados: 'Transformador 75kVA',
  possui_equipamentos_retirados: true,
  equipamentos_retirados: 'Transformador 75kVA',
  alteracoes_execucao: false,
  observacoes_gerais: 'Execução concluída',
  motivo: 'Manutenção preventiva',
  chave_provisoria_instalada: true,
  referencia_chave_provisoria: 'CHV-PROV-01',
  chave_provisoria_retirada: false,
  referencia_chave_provisoria_retirada: 'CHV-PROV-02',
  potencia_equipamento_aplicado: '75kVA',
  patrimonio_equipamento_aplicado: 'PAT-0001',
  instalacao_equipamento_aplicado: 'INST-9001',
  potencia_equipamento_retirado: '75kVA',
  patrimonio_equipamento_retirado: 'PAT-0001',
  instalacao_equipamento_retirado: 'INST-9001',
  caminhos_arquivos: ['relatorios/101/foto1.jpg'],
  caminho_arquivo: 'relatorios/101/foto1.jpg',
  modificado_por: 42,
  ...overrides,
});

// ajuste o caminho

// Linha devolvida pelo Prisma com EXECUTION_REPORT_DETAIL_SELECT
export const makeExecutionReportDetailRow = (
  overrides: Partial<ExecutionReportDetailRow> = {},
): ExecutionReportDetailRow => ({
  id: 123,
  id_usuario: 42,
  criado_em: new Date('2025-06-10T20:00:00.000Z'),
  supervisor: 'Supervisor de teste',
  liberado_ligacao_parcial: true,
  hora_inicio: new Date('1970-01-01T08:15:00.000Z'),
  hora_conclusao: new Date('1970-01-01T17:45:00.000Z'),
  contato_inicio: 'Contacto inicial',
  contato_termino: 'Contacto final',
  atraso: false,
  justificativa_atraso: 'Trânsito intenso',
  possui_equipamentos_instalados: true,
  equipamentos_aplicados: 'Transformador 75kVA',
  potencia_equipamento_aplicado: '75kVA',
  patrimonio_equipamento_aplicado: 'PAT-0001',
  instalacao_equipamento_aplicado: 'INST-9001',
  possui_equipamentos_retirados: true,
  equipamentos_retirados: 'Religador antigo',
  potencia_equipamento_retirado: '15kV',
  patrimonio_equipamento_retirado: 'PAT-0002',
  instalacao_equipamento_retirado: 'INST-9002',
  alteracoes_execucao: false,
  observacoes_gerais: 'Execução concluída',
  chave_provisoria_instalada: true,
  referencia_chave_provisoria: 'CHV-PROV-01',
  chave_provisoria_retirada: false,
  referencia_chave_provisoria_retirada: 'CHV-PROV-02',
  motivo: 'Manutenção preventiva',
  caminho_arquivo: 'relatorios/101/foto1.jpg',
  caminhos_arquivos: ['relatorios/101/foto1.jpg'],
  usuario: { nome: 'Utilizador de teste' },
  obras: {
    ovnota: 'OV-1',
    ordem_dci: 'DCI-1',
    tipos: { tipo_obra: 'Ligação nova' },
    status: { status: 'Concluída' },
  },
  programacoes: {
    data_prog: new Date('2025-06-10T00:00:00.000Z'),
    prog: 3, // ⚠️ ajuste ao tipo da coluna (number, Decimal ou string)
    exec: 2,
    num_dp: 'DP-1',
    hora_ini: new Date('1970-01-01T08:00:00.000Z'),
    hora_ter: new Date('1970-01-01T18:00:00.000Z'),
    chave_provisoria: true,
  },
  ...overrides,
});

// Resultado esperado de toExecutionReportDetail para a linha acima (escrito à mão)
export const makeExecutionReportDetail = (
  overrides: Partial<ExecutionReportDetail> = {},
): ExecutionReportDetail => ({
  id: 123,
  createdAt: new Date('2025-06-10T20:00:00.000Z'),
  userId: 42,
  supervisor: 'Supervisor de teste',
  partialConnectionReleased: true,
  startTime: new Date('1970-01-01T08:15:00.000Z'),
  finishTime: new Date('1970-01-01T17:45:00.000Z'),
  startContact: 'Contacto inicial',
  endContact: 'Contacto final',
  delay: false,
  delayJustification: 'Trânsito intenso',
  hasEquipmentInstalled: true,
  appliedEquipment: 'Transformador 75kVA',
  appliedEquipmentPower: '75kVA',
  appliedEquipmentPatrimony: 'PAT-0001',
  appliedEquipmentInstallation: 'INST-9001',
  hasEquipmentRemoved: true,
  removedEquipment: 'Religador antigo',
  removedEquipmentPower: '15kV',
  removedEquipmentPatrimony: 'PAT-0002',
  removedEquipmentInstallation: 'INST-9002',
  changesExecution: false,
  generalObservation: 'Execução concluída',
  provisionalKeyInstalled: true,
  provisionalKeyReference: 'CHV-PROV-01',
  provisionalKeyWithdrawn: false,
  provisionalKeyReferenceWithdrawn: 'CHV-PROV-02',
  reason: 'Manutenção preventiva',
  legacyFilePath: 'relatorios/101/foto1.jpg',
  filePaths: ['relatorios/101/foto1.jpg'],
  userName: 'Utilizador de teste',
  work: {
    orderNumber: 'OV-1',
    dciOrder: 'DCI-1',
    type: 'Ligação nova',
    status: 'Concluída',
  },
  schedule: {
    date: new Date('2025-06-10T00:00:00.000Z'),
    planned: 3,
    executed: 2,
    dpNumber: 'DP-1',
    startTime: new Date('1970-01-01T08:00:00.000Z'),
    endTime: new Date('1970-01-01T18:00:00.000Z'),
    provisionalKey: true,
  },
  ...overrides,
});

// test/factories/executionReport.factory.ts
