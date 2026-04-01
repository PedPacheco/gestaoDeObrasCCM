import { Inject, Injectable } from '@nestjs/common';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  IUpdateCapexRepository,
  UPDATE_CAPEX_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateCapexRepository';
import { GetAuxiliaryBaseMaterialsInterface } from 'src/interface/types/works/capexInterface';

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

@Injectable()
export class UpdateCapexService {
  private readonly CAPEX_DIAGRAM_PREFIXES = ['170', '180', '200'];

  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    @Inject(UPDATE_CAPEX_REPOSITORY)
    private readonly updateCapexRepository: IUpdateCapexRepository,
  ) {}

  async update() {
    try {
      const materials =
        await this.auxiliaryBaseRepository.getAuxiliaryBaseCN52N();

      const allMaterials = this.extractAllMaterials(materials);

      const fatorMap =
        await this.auxiliaryBaseRepository.getFator(allMaterials);

      const deletedMaterials =
        await this.updateCapexRepository.getDeletedMaterials();

      const capexValues = this.calculateCapexValues(
        materials,
        fatorMap,
        deletedMaterials,
      );

      await this.updateCapexRepository.update(capexValues);
    } catch (error) {
      throw error;
    }
  }

  private extractAllMaterials(
    validatedData: GetAuxiliaryBaseMaterialsInterface[],
  ) {
    return validatedData.flatMap((item) => ({
      material: item.material,
      pep_ref: item.def_proj,
    }));
  }

  private calculateCapexValues(
    materialData: GetAuxiliaryBaseMaterialsInterface[],
    fatorMap: Map<string, number>,
    deletedMaterials: any[],
  ): CalculatedValue[] {
    const deletedSet = new Set(
      deletedMaterials.map((item) => item.material?.trim()).filter(Boolean),
    );

    const capexMap = new Map<number, CalculatedValue>();

    for (const material of materialData) {
      if (!material.id_obra) continue;

      const fatorKey = `${material.material}|${material.def_proj}`;
      const fator = fatorMap.get(fatorKey) ?? 0;

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

      /** 🔹 Quantidades */
      if (fator > 0) {
        current.qtde_calc += material.qtd_necessaria / fator;

        if (material.reserva?.trim()) {
          current.qtde_pend += material.qtd_retirada / fator;
        }
      }

      /** 🔹 MO (independente de CAPEX) */
      if (deletedSet.has(material.material.trim()) && material.cti === 'N') {
        current.mo_calc += material.preco * material.qtd_necessaria;
        current.mo_exec += material.preco * material.qtd_recebida;
        current.mo_pend += material.preco * material.qtd_falta;
      }

      /** 🔥 CAPEX MO */
      const canIncludeCapex = this.canIncludeCapex(
        material.diagrama_rede,
        material.elemento_pep,
      );

      if (
        deletedSet.has(material.material.trim()) &&
        material.cti === 'N' &&
        canIncludeCapex
      ) {
        current.capex_mo_plan += material.preco * material.qtd_necessaria;

        if (material.reserva?.trim()) {
          current.capex_mo_pend += material.preco * material.qtd_falta;
        }
      }

      /** 🔥 CAPEX MATERIAL */
      if (material.cti === 'L' && canIncludeCapex) {
        current.capex_mat_plan += material.qtd_necessaria * material.preco;

        if (material.reserva?.trim()) {
          current.capex_mat_pend +=
            material.preco * (material.qtd_necessaria - material.qtd_retirada);
        }
      }
    }

    return Array.from(capexMap.values());
  }

  private canIncludeCapex(diagramaRede: string, elementoPep?: string): boolean {
    if (!diagramaRede) return false;

    if (diagramaRede.startsWith('200')) {
      return !!elementoPep && elementoPep.includes('-2');
    }

    return this.CAPEX_DIAGRAM_PREFIXES.some((prefix) =>
      diagramaRede.startsWith(prefix),
    );
  }
}
