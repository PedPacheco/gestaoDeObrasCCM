export interface UndefinedItemsResponse {
  id: number;
  ovnota: string;
  data_conclusao: Date;
  municipios: { municipio: string };
  tipos: { tipo_obra: string };
  turmas: { turma: string };
  circuitos: { circuito: string };
}

export interface ScheduleErrorResponse {
  id: number;
  ovnota: string;
  turmas: { turma: string };
  executado: number;
  programacoes: { prog: number }[];
}
