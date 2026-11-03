import { Injectable } from '@nestjs/common';
import {
  CalculatedValue,
  GetAuxiliaryBaseMaterialsInterface,
} from 'src/domain/entities/capex.entity';

/**
 * Regras de cálculo do CAPEX por obra. Serviço puro: sem I/O, sem progresso,
 * o que o torna trivial de testar e de reaproveitar.
 */
@Injectable()
export class CapexCalculatorService {
  private readonly CAPEX_DIAGRAM_PREFIXES = ['170', '180', '200'];

  /**
   * @param materialData      Linhas de cn52n já vinculadas a uma obra
   * @param fatorMap          Fator de conversão por "material|pep_ref"
   * @param contractMaterials Materiais de servicos_contratos (tratados como mão de obra)
   */
  calculate(
    materialData: GetAuxiliaryBaseMaterialsInterface[],
    fatorMap: Map<string, number>,
    contractMaterials: { material: string | null }[],
  ): CalculatedValue[] {
    const deletedSet = new Set<string>(
      contractMaterials
        .map((item) => item.material?.trim())
        .filter((material): material is string => !!material),
    );

    const capexMap = new Map<number, CalculatedValue>();

    for (const material of materialData) {
      if (!material.id_obra) continue;

      const fatorKey = `${material.material}|${material.def_proj}`;
      const fator = fatorMap.get(fatorKey) ?? 0;

      // material pode vir nulo da importação: não deve derrubar o cálculo todo
      const isDeletedMaterial = deletedSet.has(material.material?.trim() ?? '');

      let current = capexMap.get(material.id_obra);
      if (!current) {
        current = {
          id: material.id_obra,
          qtde_calc: 0,
          qtde_pend: 0,
          mo_calc: 0,
          mo_exec: 0,
          mo_pend: 0,
          capex_mat_plan: 0,
          capex_mo_plan: 0,
          capex_mo_pend: 0,
          capex_mat_pend: 0,
        };
        capexMap.set(material.id_obra, current);
      }

      if (fator > 0) {
        current.qtde_calc += material.qtd_necessaria / fator;

        if (material.reserva?.trim()) {
          current.qtde_pend +=
            (material.qtd_necessaria - material.qtd_retirada) / fator;
        }
      }

      if (isDeletedMaterial && material.cti === 'N') {
        current.mo_calc += material.preco * material.qtd_necessaria;
        current.mo_exec += material.preco * material.qtd_recebida;
        current.mo_pend += material.preco * material.qtd_falta;
      }

      const canIncludeCapex = this.canIncludeCapex(
        material.diagrama_rede,
        material.elemento_pep,
      );

      if (isDeletedMaterial && material.cti === 'N' && canIncludeCapex) {
        current.capex_mo_plan += material.preco * material.qtd_necessaria;

        if (material.reserva?.trim()) {
          current.capex_mo_pend += Math.max(
            0,
            material.preco * material.qtd_falta,
          );
        }
      }

      if (material.cti === 'L' && canIncludeCapex) {
        current.capex_mat_plan += material.qtd_necessaria * material.preco;

        if (material.reserva?.trim()) {
          current.capex_mat_pend += Math.max(
            0,
            material.preco * (material.qtd_necessaria - material.qtd_retirada),
          );
        }
      }
    }

    return Array.from(capexMap.values());
  }

  canIncludeCapex(diagramaRede: string, elementoPep?: string): boolean {
    if (!diagramaRede) return false;

    if (diagramaRede.startsWith('200')) {
      return !!elementoPep && elementoPep.includes('-2');
    }

    return this.CAPEX_DIAGRAM_PREFIXES.some((prefix) =>
      diagramaRede.startsWith(prefix),
    );
  }
}
