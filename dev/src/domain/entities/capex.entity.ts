/**
 * Entidades do fluxo de CAPEX.
 *
 * Vivem no domínio para que os contratos de repositório (domain) e as
 * implementações (infra) não dependam de services da camada de aplicação
 * nem de tipos da camada de interface.
 */

/** Linha da planilha CN52N já normalizada (strings aparadas, números finitos). */
export interface CapexRow {
  diagrama_rede: string | null;
  def_proj: string | null;
  material: string | null;
  texto_breve: string | null;
  centro: string | null;
  dep: string | null;
  cti: string | null;
  elemento_pep: string | null;
  und: string | null;
  preco: number | null;
  qtd_necessaria: number | null;
  qtd_retirada: number | null;
  qtd_recebida: number | null;
  qtd_falta: number | null;
  reserva: string | null;
}

/** Linha pronta para inserir em cn52n: já vinculada a uma obra. */
export interface CapexInsertItem extends CapexRow {
  id_obra: number;
}

/** Linha lida de cn52n (join com obras) usada no cálculo do CAPEX. */
export interface GetAuxiliaryBaseMaterialsInterface {
  ovnota: string;
  ordem_diagrama: string;
  diagrama_rede: string;
  elemento_pep: string;
  def_proj: string;
  material: string;
  cti: string;
  preco: number;
  qtd_necessaria: number;
  qtd_retirada: number;
  qtd_recebida: number;
  qtd_falta: number;
  reserva: string;
  id_obra: number;
}

/** Valores de CAPEX calculados para uma obra. */
export interface CalculatedValue {
  id: number;
  qtde_calc: number;
  qtde_pend: number;
  mo_calc: number;
  mo_exec: number;
  mo_pend: number;
  capex_mo_plan: number;
  capex_mat_plan: number;
  capex_mo_pend: number;
  capex_mat_pend: number;
}
