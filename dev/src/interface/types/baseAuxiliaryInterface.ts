export type OperationType = 'insert' | 'update';

export interface InsertNotesInterface {
  campo_ordenacao: string;
  pep: string;
  ordem_dci: string;
  ordem_dcd: string;
  ordem_dca: string;
  ordem_dcim: string;
  conjunto: string;
  texto_breve: string;
  grp_plnj_pm: string;
  denominacao: string;
  ehRda: boolean;
}
