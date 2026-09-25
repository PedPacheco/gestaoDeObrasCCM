export type ResultadoBucket = "procedente" | "improcedente" | "analise" | "outros";

export interface ReclamacaoRow {
  id: string;
  nota: string;
  concluidoPor: string;
  status: string;
  area: string;
  empreiteira: string;
  notaOv: string;
  canalEntrada: string;
  categoria: string;
  observacao: string;
  tipoReclamacao: string;
  causaRaiz: string;
  siglaResultado: string;
  resultadoLabel: string;
  resultadoBucket: ResultadoBucket;
  regiao: string;
  regional: string;
  municipio: string;
  instalacao: string;
  dataAbertura: string | null;
  dataVencimento: string | null;
  dataConclusao: string | null;
  dataMedida: string | null;
  valorMulta: number | null;
  transgressao: string;
  statusPrazo: string;
  tempoReport: number | null;
  origem: string;
  go: string;
}
