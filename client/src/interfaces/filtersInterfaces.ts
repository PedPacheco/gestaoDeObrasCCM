export interface FiltersInterface {
  regional?: { id: string; regional: string }[];
  parceira?: { id: string; turma: string }[];
  tipo?: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio?: { id: string; municipio: string; id_regional: number }[];
  grupo?: { id: string; grupo: string }[];
  status?: { id: string; status: string }[];
  statusSap?: { id: string; codigo_sap: string }[];
  circuito?: { id: string; circuito: string }[];
  empreendimento?: {
    id: string;
    empreendimento: string;
    id_regional: number;
    id_grupo: number;
  }[];
  conjunto?: { id: string; conjunto: string }[];
}
