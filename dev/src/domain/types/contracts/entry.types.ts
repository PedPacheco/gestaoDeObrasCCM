type TiposEntryDay = {
  tipo_obra: string;
  grupos: { grupo: string };
};

type TurmasEntryDay = {
  turma: string;
};

type MunicipiosEntryDay = {
  mun: string;
};

export type EntryDayResponse = {
  id: number;
  ovnota: string;
  pep: string;
  diagrama: string | null;
  ordem_dci: string;
  ordem_dcd: string;
  ordem_dca: string | null;
  ordem_dcim: string | null;
  entrada: Date;
  prazo: number;
  qtde_planejada: number;
  mo_planejada: number;
  mo_pend: number;
  observ_obra: string | null;
  tipos: TiposEntryDay;
  turmas: TurmasEntryDay;
  municipios: MunicipiosEntryDay;
};

export type ValuesFromEntryResponse = {
  ovnota: string;
  mo_pend: number;
  mo_planejada: number;
  entrada: Date;
  tipos: {
    tipo_obra: string;
    grupos: {
      grupo: string;
    };
  };
};
