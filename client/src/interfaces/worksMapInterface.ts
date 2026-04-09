// ─── Tipos compartilhados do domínio Mapa de Obras ───────────────────────────
// Centralizar tipos evita duplicação entre subcomponentes e facilita refatorações futuras.

export interface ObraPin {
  id: number;
  ovnota: string;
  ordemDiagrama: string;
  referencia: string | null;
  tipo_obra: string | null;
  status: string | null;
  municipio: string | null;
  circuito: string | null;
  bairro: string | null;
  latitude: number;
  longitude: number;
}

export interface SelectedFilters {
  idRegional: string[];
  idMunicipio: string[];
  idGrupo: string[];
  idTipo: string[];
  idTurma: string[];
  idStatus: string[];
}

export const EMPTY_FILTERS: SelectedFilters = {
  idRegional: [],
  idMunicipio: [],
  idGrupo: [],
  idTipo: [],
  idTurma: [],
  idStatus: [],
};
