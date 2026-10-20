// NOTA: local sugerido — src/domain/services/serviceType.util.ts (ou junto de
// outros helpers de domínio já existentes no projeto).
//
// Antes desta extração, "isso é material ou serviço?" era decidido de 3
// formas diferentes em pontos distintos do código:
//   - `!service.id_material`                    (worksServices.service.ts)
//   - `item.servicos?.materiais === null`        (worksServices.service.ts)
//   - `service.materiais?.codigo ? 'M' : 'S'`    (queriesServices/exportServices)
//
// `id_material` (FK) e a relação `materiais` carregada deveriam ser sempre
// equivalentes, mas cada query seleciona um subconjunto de campos diferente
// — então este helper aceita ambas as formas e usa a mais confiável
// disponível (a FK, quando presente), caindo para a relação como fallback.

// NOTA: local sugerido — src/domain/constants/scheduleAndWorkStatus.constants.ts
// (ajustar o caminho/nome de acordo com a convenção real do projeto; os nomes
// abaixo são inferidos a partir do uso atual e devem ser confirmados/renomeados
// conforme o vocabulário de domínio já usado no restante do sistema).

export interface ServiceTypeFields {
  id_material?: number | null;
  materiais?: { codigo?: string | null; descricao?: string } | null;
}

/**
 * Retorna `true` quando o item representa um material, `false` quando
 * representa um serviço (contrato de serviço).
 */
export function isMaterial(entity: ServiceTypeFields): boolean {
  // Prioriza a FK quando disponível
  if (entity.id_material !== undefined) {
    return entity.id_material !== null;
  }

  // Fallback para a relação carregada
  return Boolean(entity.materiais?.codigo);
}

/** Rótulo usado nas respostas/relatórios: 'M' para material, 'S' para serviço. */
export function serviceTypeLabel(entity: ServiceTypeFields): 'M' | 'S' {
  return isMaterial(entity) ? 'M' : 'S';
}

/**
 * Status da tabela `programacoes`, referenciados por
 * `id_status_programacao` / `updateScheduleStatus`.
 */
export enum ScheduleStatus {
  /** Programação aberta/aprovada. scheduleServices define 1 ao sair de PENDENTE_REVISAO. */
  APROVADA = 1,
  VALIDADA = 2,
  CONFIRMADA = 3,
  /** Executada: exec >= prog. */
  EXECUTADA = 4,
  /** Nada foi executado (exec = 0) — itens liberados para nova programação. */
  REAGENDADA = 5,
  /** Executada parcialmente (0 < exec < prog). */
  PARCIAL = 6,
  /** Estava com status 7: reprovada/pendente, some ao entrar novo agendamento. */
  PENDENTE_REVISAO = 7,
}

/**
 * Status da tabela `obras`, referenciados por `updateStatusWorks`.
 */
export enum WorkStatus {
  /** Viabilidade aprovada (aguardando programação). */
  VIABILIDADE_APROVADA = 1,
  CONCLUIDA = 2,
  /** Programações confirmadas / tudo programado. */
  CONFIRMADA = 35,
  /** Serviços reagendados / execução pendente ou parcial. */
  SERVICOS_REAGENDADOS = 36,
  VALIDADA = 37,
  PROGRAMADA = 43,
}

export const FINALIZED_SCHEDULE_STATUSES: number[] = [
  ScheduleStatus.EXECUTADA,
  ScheduleStatus.REAGENDADA,
  ScheduleStatus.PARCIAL,
];

/** Id da parceira que trabalha com programação ponto a ponto. */
export const PONTO_A_PONTO_PARTNER_ID = 3;
