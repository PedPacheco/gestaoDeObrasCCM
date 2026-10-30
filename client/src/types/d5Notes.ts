export type schedulesDataType = {
  id: number;
  id_nota_d5: number;
  criado_em: string;
  data_prog: string;
  hora_ini: string;
  hora_ter: string;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuarioCriador: string | null;
  usuarioModificador: string | null;
  restricao: string;
  tecnico: string;
  responsavel_restricao: string | null;
  idTecnico: number;
  idRestricao: number;
  caminhos_arquivos: string[];
  reprovada: boolean;
  fiscalizacao: boolean;
};

export type D5NotesRejectionsDataType = {
  id: number;
  dataReprovacao: string;
  dataProgramacao: string;
  horaInicio: string;
  horaTermino: string;
  programacao: number;
  descricao: string;
  tipoServico: string | null;
  chaveProvisoria: boolean | null;
  chi: number | null;
  numDp: string | null;
  observacaoProgramacao: string | null;
  equipeLm: number | null;
  equipeLv: number | null;
  equipeReg: number | null;
  restricao: string;
  reprovadoPor: string | null;
};

export type RejectD5SchedulePayload = {
  id: number;
  reason: string;
  description: string;
};

export type TechnicianOption = {
  id: number;
  tecnico: string;
};

export type RestrictionOption = {
  id: number;
  restricao: string;
  tipo_restricao: string;
  responsabilidade: string;
};
