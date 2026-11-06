export type RejectionOfSchedulesGetOutput = {
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  descricao: string;
  equip_desligado: string;
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
  tipo_servico: string;
  observacao_programacao: string;
  motivo: string;
};
