/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Nucleo {
  id: string;
  // 1. Informações Gerais
  regional: string;
  municipio: string;
  nucleo: string;
  tipoRede: string;
  tecnologia: string;

  // 2. Status e Entrega
  statusNucleo: string; // ex: "Planejado", "Em Construção", "Regularização", "Ativo", "Aguardando Desativação", "Suspenso"
  dataEntregaPerdas: string; // data
  respEntrega: string;

  // 3. Parceiras
  parceiraSigo: string;
  parceiraResponsavel: string;

  // 4. Pendências e Relatório Final
  envioPendenciaRelatorioFinal: string; // data
  prazoConclusaoPendenciasRelatorioFinal: string; // data

  // 5. Ligações
  ligacoesExecutadasCampo: number;
  ligacoesNotasBaixadas: number;

  // 6. Restrições (Meio Ambiente, Poder Público, CHI)
  meioAmbienteStatus: string; // ex: "Liberado", "Pendente", "N/A"
  meioAmbienteRestricaoClientes: number;
  poderPublicoStatus: string; // ex: "Liberado", "Pendente", "N/A"
  poderPublicoRestricaoClientes: number;
  chiStatus: string; // ex: "Liberado", "Pendente", "N/A"
  chiRestricaoClientes: number;

  // 7. Conjunto & CHI
  conjunto: string;
  chiNecessario: number;
  chiDisponivelBtZero: number;
  chiLimiteBtzero: number;
  chiConsumidoBtzero: number;
  oportunidadeChi: string; // "Sim", "Não", "Em Análise"

  // 8. Progresso de Obras % e Prazos
  statusAndamentoConstrucao: number; // 0 - 100
  prazoConclusaoConstrucao: string; // data
  statusAndamentoRegularizacao: number; // 0 - 100
  prazoConclusaoRegularizacao: string; // data
  statusAndamentoDesativacao: number; // 0 - 100
  prazoConclusaoDesativacao: string; // data
  prioridadeFinalizacao: 'Alta' | 'Média' | 'Baixa';
  observacoesGerais: string;
}

export type GroupColumnType = 
  | 'geral' 
  | 'status' 
  | 'parceiras' 
  | 'pendencias' 
  | 'ligacoes' 
  | 'restricoes' 
  | 'conjunto' 
  | 'progresso';
