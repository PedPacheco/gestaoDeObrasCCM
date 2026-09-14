export type GetAllWorksItem = {
  id: number;
  ovnota: string;
  ordemdiagrama: string;
  status_ov_sap: number | null;
  pep: string | null;
  status_pep: string | null;
  diagrama: string | null;
  status_diagrama: string | null;
  ordem_dci: string | null;
  status_170: string | null;
  status_usuario_170: string | null;
  ordem_dcd: string | null;
  status_190: string | null;
  status_usuario_190: string | null;
  ordem_dca: string | null;
  status_150: string | null;
  status_usuario_150: string | null;
  ordem_dcim: string | null;
  status_180: string | null;
  status_usuario_180: string | null;
  mun: string;
  tipo_obra: string;
  entrada: Date | null;
  prazo_fim: Date | null;
  qtde_planejada: number | null;
  mo_planejada: number | null;
  mo_final: number | null;
  turma: string;
  executado: number | null;
  data_conclusao: Date | null;
  last_data_prog: Date | null;
  status: string;
  observ_obra: string | null;
  referencia: string | null;
};

export type GetAllWorksRepositoryResponse = {
  works: GetAllWorksItem[];
  total: {
    total_obras: number;
  }[];
};
