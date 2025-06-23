export const mockAddSchedulesServiceData = {
  idWork: 3146044,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  startTime: '08:00',
  finishTime: '09:00',
  serviceType: 'Inspeção Elétrica',
  prog: 100,
};

export const mockAddSchedulesServiceDataNotTimeValid = {
  idWork: 3146044,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  startTime: '08:00',
  finishTime: '07:00',
  serviceType: 'Inspeção Elétrica',
  prog: 100,
};

export const mockAddSchedulesServiceDataWithoutIdWork = {
  idWork: undefined,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  startTime: '08:00',
  finishTime: '07:00',
  serviceType: 'Inspeção Elétrica',
  prog: 100,
};

export const mockAddSchedulesServiceDataWithWrongProg = {
  idWork: 3146044,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  startTime: '08:00',
  finishTime: '07:00',
  serviceType: 'Inspeção Elétrica',
  prog: 105,
};

export const mockAddSchedulesServiceFormattedData = {
  id_obra: 3146044,
  data_prog: new Date('2025-06-10T00:00:00.000Z'),
  prog: 100,
  exec: undefined,
  observ_programacao: undefined,
  num_dp: undefined,
  hora_ini: new Date('1970-01-01T08:00:00.000Z'),
  hora_ter: new Date('1970-01-01T09:00:00.000Z'),
  equipe_linha_morta: 0,
  equipe_linha_viva: 0,
  equipe_regularizacao: 0,
  chave_provisoria: false,
  tipo_servico: 'Inspeção Elétrica',
  chi: undefined,
  nome_responsavel_execucao: undefined,
  id_restricao_execucao: 1,
  observacao_execucao: undefined,
  id_tecnico: 1,
};

export const mockUpdateSchedulesService = {
  id: 1,
  idUser: 1,
  idWork: 3146044,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  prog: 100,
  exec: undefined,
  equipment: undefined,
  numDp: undefined,
  startTime: '08:00',
  finishTime: '09:00',
  lmTeam: 0,
  lvTeam: 0,
  regulTeam: 0,
  temporaryKey: false,
  serviceType: 'Inspeção Elétrica',
  chi: undefined,
  responsibility: undefined,
  idExecutionRestriction: 1,
  observation: undefined,
  idTechnical: 1,
};

export const mockUpdateSchedulesServiceWithoutIdWork = {
  id: 1,
  idUser: 1,
  idWork: undefined,
  dataProg: new Date('2025-06-10T00:00:00.000Z'),
  prog: 100,
  exec: undefined,
  equipment: undefined,
  startTime: '08:00',
  finishTime: '09:00',
};

export const mockUpdateSchedulesServiceFormattedData = {
  id: 1,
  id_obra: 3146044,
  data_prog: new Date('2025-06-10T00:00:00.000Z'),
  prog: 100,
  exec: undefined,
  observ_programacao: undefined,
  num_dp: undefined,
  hora_ini: new Date('1970-01-01T08:00:00.000Z'),
  hora_ter: new Date('1970-01-01T09:00:00.000Z'),
  equipe_linha_morta: 0,
  equipe_linha_viva: 0,
  equipe_regularizacao: 0,
  chave_provisoria: false,
  tipo_servico: 'Inspeção Elétrica',
  chi: undefined,
  nome_responsavel_execucao: undefined,
  id_restricao_execucao: 1,
  observacao_execucao: undefined,
  id_tecnico: 1,
};
