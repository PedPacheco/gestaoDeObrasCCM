import { Inject, Injectable } from '@nestjs/common';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  IUpdateCapexRepository,
  UPDATE_CAPEX_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateCapexRepository';
import { MaterialCapexDTO } from 'src/interface/dtos/materialDTO';

export interface CalculatedValue {
  diagrama_rede: string;
  qtde_calc: number;
  qtde_pend: number;
  mo_calc: number;
  capex_mo_plan: number;
  capex_mat_plan: number;
  capex_mo_pend: number;
  capex_mat_pend: number;
}

@Injectable()
export class UpdateCapexService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    @Inject(UPDATE_CAPEX_REPOSITORY)
    private readonly updateCapexRepository: IUpdateCapexRepository,
  ) {}

  async update(data: MaterialCapexDTO[]) {
    const allMaterials = this.extractAllMaterials(data);

    const fatorMap = await this.auxiliaryBaseRepository.getFator(allMaterials);

    const deletedMaterials =
      await this.updateCapexRepository.getDeletedMaterials();

    const capexValues = this.calculateCapexValues(
      data,
      fatorMap,
      deletedMaterials,
    );

    await this.updateCapexRepository.update(capexValues);
  }

  private extractAllMaterials(validatedData: MaterialCapexDTO[]) {
    return validatedData.flatMap((item) => ({
      material: item.material,
      pep_ref: item.def_proj,
    }));
  }

  private calculateCapexValues(
    materialData: MaterialCapexDTO[],
    fatorMap: Map<string, number>,
    deletedMaterials: any[],
  ): CalculatedValue[] {
    return materialData.reduce((acc, material) => {
      const fatorKey = `${material.material}|${material.def_proj}`;
      const fator = fatorMap.get(fatorKey) ?? 0;
      const deletedSet = new Set(deletedMaterials);

      let current = acc.find(
        (item) => item.diagrama_rede === material.diagrama_rede,
      );

      if (!current) {
        current = {
          diagrama_rede: material.diagrama_rede,
          qtde_calc: 0,
          qtde_pend: 0,
          mo_calc: 0,
          capex_mat_plan: 0,
          capex_mo_plan: 0,
          capex_mo_pend: 0,
          capex_mat_pend: 0,
        };
        acc.push(current);
      }

      if (fator !== 0) {
        current.qtde_calc += material.qtd_necess / fator;

        if (material.relevancia_calculo?.trim()) {
          current.qtde_pend +=
            material.qtd_necess - material.qtd_retirada / fator;
        }
      }

      if (!deletedSet.has(material.material) && material.ctg_item === 'N') {
        current.mo_calc += material.preco_mi * material.qtd_necess;
        current.capex_mo_plan += material.preco_mi * material.qtd_necess;

        if (material.relevancia_calculo?.trim()) {
          current.capex_mo_pend +=
            material.preco_mi * (material.qtd_necess - material.qtd_faltante);
        }
      }

      if (material.ctg_item === 'L' || material.ctg_item === 'Z') {
        current.capex_mat_plan += material.qtd_necess * material.preco_mi;
        current.capex_mat_pend +=
          material.preco_mi * (material.qtd_necess - material.qtd_retirada);
      }

      return acc;
    }, [] as CalculatedValue[]);
  }
}
