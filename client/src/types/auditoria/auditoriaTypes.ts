export type AuditStatus = 'Em andamento' | 'Pendente' | 'Concluído';

export interface AuditData {
  id: number;
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
  executadosForaPrazo?: string;
  dataGap?: string;
  scoreFinal?: string;
  evolucao?: string;
  itensPendentesNoPrazo?: string;
  itensPendentesForaDoPrazo?: string;
  observacao?: string;
  status: AuditStatus | '';
}

export interface AuditDataFromAPI {
  id: number;
  parceira: string;
  num_auditoria: string | null;
  data_inicio: string | null;
  data_fim: string | null;
  gap_anterior: string | null;
  gap_atual: string | null;
  apresentacao_interna: string | null;
  reuniao_apresentacao: string | null;
  notificacao_gestao: string | null;
  retorno_parceira: string | null;
  validacao_plano_edp: string | null;
  plano_validado: string | null;
  devolutiva_novo_plano: string | null;
  validacao_novo_plano: string | null;
  lancamento_desvios_sgs: string | null;
  inicio_acompanhamento: string | null;
  quantidade_desvios_planejados: string | null;
  quantidade_desvios_executados: string | null;
  executados_fora_prazo: string | null;
  itens_pendentes_fora_do_prazo: string | null;
  observacao: string | null;
  status: string | null;
  data_gap: string;
  score_final: string;
  evolucao: string;
  itens_pendentes_no_prazo: string;
}

export function mapApiToAuditData(api: AuditDataFromAPI): AuditData {
  return {
    id: api.id,
    parceira: api.parceira,
    numAuditoria: api.num_auditoria || '',
    dataInicio: api.data_inicio || '',
    dataFim: api.data_fim || '',
    gapAnterior: api.gap_anterior || '',
    gapAtual: api.gap_atual || '',
    apresentacaoInterna: api.apresentacao_interna || '',
    reuniaoApresentacao: api.reuniao_apresentacao || '',
    notificacaoGestao: api.notificacao_gestao || '',
    retornoParceira: api.retorno_parceira || '',
    validacaoPlanoEDP: api.validacao_plano_edp || '',
    planoValidado: (api.plano_validado as 'Sim' | 'Não' | '') || '',
    devolutivaNovoPlano: api.devolutiva_novo_plano || '',
    validacaoNovoPlano: api.validacao_novo_plano || '',
    lancamentoDesviosSGS: api.lancamento_desvios_sgs || '',
    inicioAcompanhamento: api.inicio_acompanhamento || '',
    quantidadeDesviosPlanejados: api.quantidade_desvios_planejados || '',
    quantidadeDesviosExecutados: api.quantidade_desvios_executados || '',
    executadosForaPrazo: api.executados_fora_prazo || '',
    dataGap: api.data_gap || '',
    scoreFinal: api.score_final || '',
    evolucao: api.evolucao || '',
    itensPendentesNoPrazo: api.itens_pendentes_no_prazo || '',
    itensPendentesForaDoPrazo: api.itens_pendentes_fora_do_prazo || '',
    observacao: api.observacao || '',
    status: (api.status as AuditStatus) || '',
  };
}

const FIELD_MAP: Record<keyof AuditData, string> = {
  id: 'id',
  parceira: 'parceira',
  numAuditoria: 'num_auditoria',
  dataInicio: 'data_inicio',
  dataFim: 'data_fim',
  gapAnterior: 'gap_anterior',
  gapAtual: 'gap_atual',
  apresentacaoInterna: 'apresentacao_interna',
  reuniaoApresentacao: 'reuniao_apresentacao',
  notificacaoGestao: 'notificacao_gestao',
  retornoParceira: 'retorno_parceira',
  validacaoPlanoEDP: 'validacao_plano_edp',
  planoValidado: 'plano_validado',
  devolutivaNovoPlano: 'devolutiva_novo_plano',
  validacaoNovoPlano: 'validacao_novo_plano',
  lancamentoDesviosSGS: 'lancamento_desvios_sgs',
  inicioAcompanhamento: 'inicio_acompanhamento',
  quantidadeDesviosPlanejados: 'quantidade_desvios_planejados',
  quantidadeDesviosExecutados: 'quantidade_desvios_executados',
  executadosForaPrazo: 'executados_fora_prazo',
  dataGap: 'data_gap',
  scoreFinal: 'score_final',
  evolucao: 'evolucao',
  itensPendentesNoPrazo: 'itens_pendentes_no_prazo',
  itensPendentesForaDoPrazo: 'itens_pendentes_fora_do_prazo',
  observacao: 'observacao',
  status: 'status',
};

export function camelToSnake(field: keyof AuditData): string {
  return FIELD_MAP[field] || field;
}
