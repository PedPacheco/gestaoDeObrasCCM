// ============================================================
// Tipos compartilhados entre os serviços de importação e
// atualização do CAPEX. Vivem na camada de aplicação para
// que tanto os use-cases quanto os repositórios possam
// importar sem violar a hierarquia de dependências.
// ============================================================

export type CapexItem = {
  diagrama_rede: string;
  def_proj: string;
  material: string;
  texto_breve: string;
  centro: string;
  dep: string;
  cti: string;
  elemento_pep: string;
  und: string;
  preco: number;
  qtd_necessaria: number;
  qtd_retirada: number;
  qtd_recebida: number;
  qtd_falta: number;
  reserva: string;
};

export type CapexInsertItem = CapexItem & {
  id_obra: number;
};

export type CapexPhase =
  | 'reading' // Lendo e parseando o xlsx via stream
  | 'processing' // Inserindo registros na tabela cn52n em batches
  | 'completed'
  | 'loading' // Buscando materiais, fatores e contratos do banco
  | 'calculating' // Calculando os valores CAPEX em memória
  | 'updating' // Gravando os valores calculados nas obras
  | 'done'
  | 'error';

export interface CapexProgressPayload {
  phase: CapexPhase;
  processed: number;
  percentage: number;
  message: string;
}

/**
 * Callback injetado nos serviços e repositórios para reportar
 * progresso sem acoplá-los diretamente ao WebSocket.
 * O controller/orquestrador é quem fornece a implementação concreta.
 */
export type ProgressEmitter = (payload: CapexProgressPayload) => void;
