import { ExecutionReportDataDTO } from 'src/interface/dtos/executionReportDTO';

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
    {
      equipment: 'Banco capacitor',
      power: '50',
      patrimony: '432534',
      installation: '23543',
    },
  ],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  generalObservation: '',
  reason: '',
  provisionalKeyInstalled: false,
  provisionalKeyReference: '',
  provisionalKeyWithdrawn: false,
  provisionalKeyReferenceWithdrawn: '',
};

export const mockUpdateExecutionReportDTO: ExecutionReportDataDTO = {
  idUser: 1,
  supervisor: 'João Silva',
  partialConnectionReleased: true,
  startTime: '08:30',
  finishTime: '12:45',
  startContact: 'Contato iniciado com responsável local.',
  endContact: 'Contato encerrado com responsável local.',
  delayJustification: 'Trânsito intenso na região.',
  hasEquipmentInstalled: true,
  appliedEquipment: [
    {
      equipment: 'Transformador',
      power: '50',
      patrimony: '123456789',
      installation: '414141',
    },
    {
      equipment: 'Relé de proteção',
      power: '30',
      patrimony: '987654321',
      installation: '343543',
    },
  ],
  hasEquipmentRemoved: false,
  equipmentRemoved: [],
  changesExecution: false,
  generalObservation: 'Execução dentro do esperado, sem intercorrências.',
  reason: 'Instalação programada',
  provisionalKeyInstalled: true,
  provisionalKeyReference: 'CHV123456',
  provisionalKeyWithdrawn: false,
  provisionalKeyReferenceWithdrawn: null,
};

export const mockExecutionReportPersistenceObject = {
  id_usuario: 1,
  id_obra: 2,
  id_programacao: 1,
  supervisor: 'João Silva',
  liberado_ligacao_parcial: true,
  hora_inicio: new Date('1970-01-01T08:30:00Z'),
  hora_conclusao: new Date('1970-01-01T12:45:00Z'),
  contato_inicio: 'Contato iniciado com responsável local.',
  contato_termino: 'Contato encerrado com responsável local.',
  atraso: false,
  justificativa_atraso: 'Trânsito intenso na região.',
  possui_equipamentos_instalados: true,
  equipamentos_aplicados: 'Transformador;Relé de proteção',
  potencia_equipamento_aplicado: '50;30',
  patrimonio_equipamento_aplicado: '123456789;987654321',
  instalacao_equipamento_aplicado: '414141;343543',
  possui_equipamentos_retirados: false,
  equipamentos_retirados: '',
  potencia_equipamento_retirado: '',
  patrimonio_equipamento_retirado: '',
  instalacao_equipamento_retirado: '',
  alteracoes_execucao: false,
  observacoes_gerais: 'Execução dentro do esperado, sem intercorrências.',
  referencia_chave_provisoria: 'CHV123456',
  chave_provisoria_retirada: false,
  motivo: 'Instalação programada',
  chave_provisoria_instalada: true,
  referencia_chave_provisoria_retirada: null,
};

export const mockExecutionReportServiceWithErrorEquipmentInstalled = {
  ...mockExecutionReportService,
  hasEquipmentInstalled: true,
  appliedEquipment: [],
};

export const mockExecutionReportServiceWithErrorProvisionalKeyReferenceWithdrawn =
  {
    ...mockExecutionReportService,
    provisionalKeyWithdrawn: true,
    provisionalKeyReferenceWithdrawn: null,
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
  motivo: '',
  chave_provisoria_instalada: false,
  referencia_chave_provisoria: '',
  chave_provisoria_retirada: false,
  referencia_chave_provisoria_retirada: '',
  potencia_equipamento_aplicado: '50',
  patrimonio_equipamento_aplicado: '432534',
  instalacao_equipamento_aplicado: '23543',
  potencia_equipamento_retirado: '',
  patrimonio_equipamento_retirado: '',
  instalacao_equipamento_retirado: '',
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
      status: { status: 'EM EMPREITAMENTO' },
    },
    programacoes: {
      data_prog: new Date('2025-06-24T08:30:00.000Z'),
      prog: 100,
      exec: 50,
      num_dp: 2135,
      hora_ini: new Date('2025-06-24T08:30:00.000Z'),
      hora_ter: new Date('2025-06-24T12:30:00.000Z'),
      chave_provisoria: true,
    },
  },
];

export const mockFindByWorkIdResponseFormatted = [
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

    // 🔽 campos achatados do objeto usuario
    nome_usuario: 'Carlos Oliveira',

    // 🔽 campos achatados do objeto obras
    ovnota: '16004316',
    ordem_dci: '170000023493',
    tipo_obra: 'Manutenção',
    status_obra: 'EM EMPREITAMENTO',

    // 🔽 campos achatados do objeto programacoes
    data_prog: new Date('2025-06-24T08:30:00.000Z'),
    prog: 100,
    exec: 50,
    num_dp: 2135,
    hora_ini: new Date('2025-06-24T08:30:00.000Z'),
    hora_ter: new Date('2025-06-24T12:30:00.000Z'),
    chave_provisoria: true,

    // 🔽 removidos pelo service
    usuario: undefined,
    obras: undefined,
    programacoes: undefined,
  },
];

export const mockFindByWorkIdResponseNull = [
  {
    supervisor: null,
    liberado_ligacao_parcial: null,
    hora_inicio: null,
    hora_conclusao: null,
    contato_inicio: null,
    contato_termino: null,
    atraso: null,
    justificativa_atraso: null,
    possui_equipamentos_instalados: null,
    equipamentos_aplicados: null,
    potencia_equipamento_aplicado: null,
    patrimonio_equipamento_aplicado: null,
    equipamentos_retirados: null,
    potencia_equipamento_retirado: null,
    patrimonio_equipamento_retirado: null,
    alteracoes_execucao: null,
    observacoes_gerais: null,
    chave_provisoria_instalada: null,
    referencia_chave_provisoria: null,
    chave_provisoria_retirada: null,
    motivo: null,

    usuario: {
      nome_usuario: null,
    },

    obras: {
      ovnota: null,
      ordem_dci: null,
      tipos: {
        tipo_obra: null,
      },
      status: {
        status: null,
      },
    },

    programacoes: {
      data_prog: null,
      prog: null,
      exec: null,
      num_dp: null,
      hora_ini: null,
      hora_ter: null,
      chave_provisoria: null,
    },
  },
];

export const mockFindByWorkIdResponseFormattedNull = [
  {
    supervisor: null,
    liberado_ligacao_parcial: null,
    hora_inicio: null,
    hora_conclusao: null,
    contato_inicio: null,
    contato_termino: null,
    atraso: null,
    justificativa_atraso: null,
    possui_equipamentos_instalados: null,
    equipamentos_aplicados: null,
    potencia_equipamento_aplicado: null,
    patrimonio_equipamento_aplicado: null,
    equipamentos_retirados: null,
    potencia_equipamento_retirado: null,
    patrimonio_equipamento_retirado: null,
    alteracoes_execucao: null,
    observacoes_gerais: null,
    chave_provisoria_instalada: null,
    referencia_chave_provisoria: null,
    chave_provisoria_retirada: null,
    motivo: null,

    // achatados
    nome_usuario: null,
    ovnota: null,
    ordem_dci: null,
    tipo_obra: null,
    status_obra: null,

    // programações achatado
    data_prog: null,
    prog: null,
    exec: null,
    num_dp: null,
    hora_ini: null,
    hora_ter: null,
    chave_provisoria: null,

    // removidos pelo formatter
    usuario: undefined,
    obras: undefined,
    programacoes: undefined,
  },
];
