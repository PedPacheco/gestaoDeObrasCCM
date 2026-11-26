export type FindWorksReposnse = {
  id: number;
  ovnota: string;
  diagrama: string | null;
  ordem_dci: string | null;
  ordem_dca: string | null;
  ordem_dcd: string | null;
  ordem_dcim: string | null;
  referencia: string | null;
  id_circuito: number;
  id_status: number;
  municipios: { municipio: string; mun: string };
  tipos: { tipo_obra: string };
  status: { status: string };
  circuitos: { circuito: string };
};

export type FindEquipmentByCodeResponse = {
  codigo_instalacao: string;
  latitude: number;
  longitude: number;
  bairro: string | null;
};

export type FindWithoutLocationRawResponse = {
  ovnota: string;
  referencia: string | null;
  executado: number | null;
  status: { status: string };
  tipos: { tipo_obra: string };
  turmas: { turma: string };
  empreendimento: { empreendimento: string };
  circuitos: {
    circuito: string;
    conjuntos: { conjunto: string };
  };
};
