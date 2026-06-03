export type AuditStatus = 'Em andamento' | 'Pendente' | 'Concluído';

export interface AuditData {
  id: string;
  parceira: string;
  numAuditoria: string;
  dataInicio: string;
  dataFim: string;
  gapAnterior: string;
  gapAtual: string;
  apresentacaoInterna: string;
  reuniaoApresentacao: string;
  notificacaoGestao: string;
  retornoParceira: string;
  validacaoPlanoEDP: string;
  planoValidado: 'Sim' | 'Não' | '';
  devolutivaNovoPlano: string;
  validacaoNovoPlano: string;
  lancamentoDesviosSGS: string;
  inicioAcompanhamento: string;
  quantidadeDesviosPlanejados: string;
  quantidadeDesviosExecutados: string;
  dataGap?: string;
  scoreFinal?: string;
  itensPendentesNoPrazo?: string;
  itensPendentesForaDoPrazo?: string;
  observacao?: string;
  status: AuditStatus | '';
}
