export type GetEquipmentInput = {
  ovnota?: string;
  ordemDiagrama?: string;
};

export type EquipmentOutput = {
  id: number;
  ovnota: string | null;
  ordemDiagrama: string | null;
  referencia: string | null;
  tipo_obra: string | null;
  status: string | null;
  municipio: string | null;
  circuito: string | null;
  bairro: string | null;
  latitude: number | null;
  longitude: number | null;
};

export type GetEquipmentOutput = {
  data: EquipmentOutput[];
  total: number;
};

export type EquipmentWithoutLocationOutput = {
  ovnota: string;
  referencia: string;
  status: string;
  conjunto: string;
  circuito: string;
  empreiteira: string;
  tipo_obra: string;
  executado: number;
  empreendimento: string;
};
