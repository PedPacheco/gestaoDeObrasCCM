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
  materiais?: { codigo?: string | null } | null;
}

/**
 * Retorna `true` quando o item representa um material, `false` quando
 * representa um serviço (contrato de serviço).
 */
export function isMaterial(entity: ServiceTypeFields | null): boolean {
  if (!entity) return false;

  console.log(entity);

  if (entity.id_material !== undefined) {
    return entity.id_material !== null;
  }

  return Boolean(entity.materiais?.codigo);
}

/** Rótulo usado nas respostas/relatórios: 'M' para material, 'S' para serviço. */
export function serviceTypeLabel(
  entity: ServiceTypeFields | null | undefined,
): 'M' | 'S' {
  return isMaterial(entity) ? 'M' : 'S';
}

/**
 * Status da tabela `programacoes`, referenciados por
 * `id_status_programacao` / `updateScheduleStatus`.
 */
export enum ScheduleStatus {
  /** Estava com status 7: reprovada/pendente, some ao entrar novo agendamento. */
  PENDENTE_REVISAO = 7,
  /** scheduleServices define 1 quando sai do status PENDENTE_REVISAO. */
  APROVADA = 1,
  /** Usado por reascheduleServices ao reabrir uma programação. */
  REAGENDADA = 5,
}

/**
 * Status da tabela `obras`, referenciados por `updateStatusWorks`.
 */
export enum WorkStatus {
  /** Usado por reascheduleServices quando serviços voltam a ficar em aberto. */
  SERVICOS_REAGENDADOS = 36,
}
