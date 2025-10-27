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
  ovnota: string;
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

  async update() {
    const materials =
      await this.auxiliaryBaseRepository.getAuxiliaryBaseCN52N();

    const allMaterials = this.extractAllMaterials(materials);

    const fatorMap = await this.auxiliaryBaseRepository.getFator(allMaterials);

    const deletedMaterials =
      await this.updateCapexRepository.getDeletedMaterials();

    const capexValues = this.calculateCapexValues(
      materials,
      fatorMap,
      deletedMaterials,
    );

    await this.updateCapexRepository.update(capexValues);
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
      deletedMaterials.map((item) => item.codigo_material?.trim()),
    );

    return materialData.reduce((acc, material) => {
      const fatorKey = `${material.material}|${material.def_proj}`;
      const fator = fatorMap.get(fatorKey) ?? 0;

      let current = acc.find(
        (item) =>
          item.ovnota === material.ovnota &&
          item.diagrama_rede === material.ordem_diagrama,
      );

      if (!current) {
        current = {
          ovnota: material.ovnota,
          diagrama_rede: material.ordem_diagrama,
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

      if (fator > 0) {
        current.qtde_calc += material.qtd_necessaria / fator;

        if (material.reserva?.trim()) {
          current.qtde_pend += material.qtd_falta / fator;
        }
      }

      if (!deletedSet.has(material.material.trim()) && material.cti === 'N') {
        current.mo_calc += material.preco * material.qtd_necessaria;

        if (
          material.diagrama_rede.startsWith('170') ||
          material.diagrama_rede.startsWith('180')
        ) {
          current.capex_mo_plan += material.preco * material.qtd_necessaria;

          if (material.reserva?.trim()) {
            current.capex_mo_pend += material.preco * material.qtd_falta;
          }
        }
      }

      if (
        material.cti === 'L' &&
        (material.diagrama_rede.startsWith('170') ||
          material.diagrama_rede.startsWith('180'))
      ) {
        current.capex_mat_plan += material.qtd_necessaria * material.preco;
        current.capex_mat_pend += material.preco * material.qtd_retirada;
      }

      return acc;
    }, [] as CalculatedValue[]);
  }
}
