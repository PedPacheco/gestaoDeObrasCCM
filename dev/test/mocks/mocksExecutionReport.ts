export const mockExecutionReportService = {
  idSchedule: 1,
  idUser: 1,
  idWork: 1,
  supervisor: '',
  partialConnectionReleased: false,
  startTime: '08:00',
  finishTime: '12:00',
  startContact: '',
  endContact: '',
  delayJustification: '',
  hasEquipmentInstalled: true,
  appliedEquipment: [
    { equipment: 'Banco capacitor', power: '50', patrimony: '432534' },
  ],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  generalObservation: '',
  workSituation: '',
  reason: '',
  provisionalKeyInstalled: false,
  provisionalKeyReference: '',
  provisionalKeyWithdrawn: false,
};

export const mockExecutionReportServiceWithErrorEquipmentInstalled = {
  ...mockExecutionReportService,
  hasEquipmentInstalled: true,
  appliedEquipment: [],
};

export const mockExecutionReportServiceWithErrorEquipmentRemoved = {
  ...mockExecutionReportService,
  hasEquipmentRemoved: true,
};

export const mockExecutionReportServiceWithErrorProvisionalKeyReference = {
  ...mockExecutionReportService,
  provisionalKeyInstalled: true,
};

export const mockExecutionReportRepository = {
  id_usuario: 1,
  id_obra: 1,
  id_programacao: 1,
  supervisor: '',
  liberado_ligacao_parcial: false,
  hora_conclusao: new Date('1970-01-01T12:00:00.000Z'),
  hora_inicio: new Date('1970-01-01T08:00:00.000Z'),
  contato_inicio: '',
  contato_termino: '',
  atraso: false,
  justificativa_atraso: '',
  possui_equipamentos_instalados: true,
  equipamentos_aplicados: 'Banco capacitor',
  possui_equipamentos_retirados: false,
  equipamentos_retirados: '',
  alteracoes_execucao: false,
  observacoes_gerais: '',
  situacao_obra: '',
  motivo: '',
  chave_provisoria_instalada: false,
  referencia_chave_provisoria: '',
  chave_provisoria_retirada: false,
  potencia_equipamento_aplicado: '50',
  patrimonio_equipamento_aplicado: '432534',
  potencia_equipamento_retirado: '',
  patrimonio_equipamento_retirado: '',
};

export const mockFindByWorkIdResponse = [
  {
    supervisor: 'João Silva',
    liberado_ligacao_parcial: true,
    hora_inicio: new Date('2025-06-24T08:30:00.000Z'),
    hora_conclusao: new Date('2025-06-24T12:45:00.000Z'),
    contato_inicio: 'Contato iniciado com responsável local.',
    contato_termino: 'Contato encerrado com responsável local.',
    atraso: true,
    justificativa_atraso: 'Trânsito intenso na região.',
    possui_equipamentos_instalados: true,
    equipamentos_aplicados: 'Transformador, Relé de proteção',
    potencia_equipamento_aplicado: '50, 30',
    patrimonio_equipamento_aplicado: '123456789, 987654321',
    equipamentos_retirados: '',
    potencia_equipamento_retirado: '',
    patrimonio_equipamento_retirado: '',
    alteracoes_execucao: false,
    observacoes_gerais: 'Execução dentro do esperado, sem intercorrências.',
    chave_provisoria_instalada: true,
    referencia_chave_provisoria: 'CHV123456',
    chave_provisoria_retirada: false,
    motivo: 'Instalação programada',
    usuario: {
      nome_usuario: 'Carlos Oliveira',
    },
    obras: {
      ovnota: '16004316',
      ordem_dci: '170000023493',
      tipos: {
        tipo_obra: 'Manutenção',
      },
    },
  },
];
