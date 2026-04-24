// ============================================================
// Tipos compartilhados entre os serviços de importação e
// atualização do CAPEX. Vivem na camada de aplicação para
// que tanto os use-cases quanto os repositórios possam
// importar sem violar a hierarquia de dependências.
// ============================================================

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
