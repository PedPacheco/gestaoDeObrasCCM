export interface NucleoSmcRow {
  id: string;
  regional: string;
  municipio: string;
  nucleo: string;
  tipoRede: string;
  tecnologia: string;
  statusNucleo: string;
  dataEntregaPerdas: string;
  respEntrega: string;
  parceiraSigo: string;
  parceiraResponsavel: string;
  ucsPlanejadasPriorizador: number | null;
  ucsPlanejadasConstrucaoMtBt: number | null;
  ligacoesExecutadasCampo: number | null;
  ligacoesNotasBaixadas: number | null;
  meioAmbienteStatus: string;
  meioAmbienteRestricaoClientes: number | null;
  poderPublicoStatus: string;
  poderPublicoRestricaoClientes: number | null;
  chiStatus: string;
  chiRestricaoClientes: string;
  conjunto: string;
  chiNecessario: string;
  chiDisponivelBtZero: string;
  chiLimiteBtzero: number | null;
  chiConsumidoBtzero: number | null;
  oportunidadeChi: string;
  statusAndamentoConstrucao: number | null;
  prazoConclusaoConstrucao: string;
  statusAndamentoRegularizacao: number | null;
  prazoConclusaoRegularizacao: string;
  statusAndamentoDesativacao: number | null;
  prazoConclusaoDesativacao: string;
  prioridadeFinalizacao: string;
  envioPendenciaRelatorioFinal: string;
  prazoConclusaoPendenciasRelatorioFinal: string;
  observacoesGerais: string;
}

export type ControleSmcColumnGroup =
  | "geral"
  | "status"
  | "parceiras"
  | "ligacoes"
  | "restricoes"
  | "conjunto"
  | "progresso"
  | "pendencias";

export type ControleSmcColumnType = "text" | "number" | "percent" | "date";

export type ControleSmcColumnEditor = "text" | "number" | "select" | "textarea";

export interface ControleSmcColumn {
  key: keyof Omit<NucleoSmcRow, "id">;
  header: string;
  group: ControleSmcColumnGroup;
  type: ControleSmcColumnType;
  editor: ControleSmcColumnEditor;
  width: number;
  align?: "right";
}
