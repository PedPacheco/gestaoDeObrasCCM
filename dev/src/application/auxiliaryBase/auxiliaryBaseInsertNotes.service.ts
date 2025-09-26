import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { InsertBaseAuxiliaryNotesDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';

interface InsertNotesResult {
  insertedCount: number;
  skippedNotes: string[];
}

interface ValidationResult {
  validatedData: InsertBaseAuxiliaryNotesDTO[];
  skippedNotes: string[];
}

interface CalculatedValue {
  diagrama_rede: string;
  qtde_calc: number;
  mo_calc: number;
  capex_mat_calc: number;
}

interface OrderData {
  ordem_dci: string;
  ordem_dcd: string;
  ordem_dca: string;
  ordem_dcim: string;
}

@Injectable()
export class AuxiliaryNotesInsertService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async execute(
    data: InsertBaseAuxiliaryNotesDTO[],
    operation: OperationType,
  ): Promise<InsertNotesResult> {
    if (!data?.length) {
      return { insertedCount: 0, skippedNotes: [] };
    }

    const validationResult = await this.validateAndFilterExistingData(
      data,
      operation,
    );

    if (validationResult.validatedData.length === 0) {
      return {
        insertedCount: 0,
        skippedNotes: validationResult.skippedNotes,
      };
    }

    const { notesData, calculatedValues } = await this.processCalculations(
      validationResult.validatedData,
    );

    await this.auxiliaryBaseRepository.insertNotes({
      notesData,
      calculatedValues,
    });

    return {
      insertedCount: validationResult.validatedData.length,
      skippedNotes: validationResult.skippedNotes,
    };
  }

  private async validateAndFilterExistingData(
    data: InsertBaseAuxiliaryNotesDTO[],
    operation: OperationType,
  ): Promise<ValidationResult> {
    const validatedData: InsertBaseAuxiliaryNotesDTO[] = [];
    const skippedNotes: string[] = [];

    const orderingFields = this.extractOrderingFields(data);
    const orderData = this.extractOrderData(data);

    const [existingNotes, existingOrders] = await Promise.all([
      this.findExistingWorksService.findExistingWorks(orderingFields),
      this.findExistingWorksService.findExistingOrders(orderData),
    ]);

    const existingNotesSet = new Set(existingNotes.map((note) => note.ovnota));
    const existingOrdersSet = new Set(existingOrders);

    for (const item of data) {
      const { notesData } = item;
      const skipResult = this.shouldSkipItem(
        notesData,
        existingNotesSet,
        existingOrdersSet,
      );

      if (operation === 'insert') {
        if (skipResult.noteExists || skipResult.orderExists) {
          skippedNotes.push(notesData.campo_ordenacao);
          continue;
        }
      } else {
        if (!skipResult.noteExists || !skipResult.orderExists) {
          skippedNotes.push(notesData.campo_ordenacao);
          continue;
        }
      }

      validatedData.push(item);
    }

    if (operation === 'update' && skippedNotes.length) {
      throw new BadRequestException(
        `Não foi possível atualizar. Obras não encontradas: ${skippedNotes.join(
          ', ',
        )}`,
      );
    }

    return { validatedData, skippedNotes };
  }

  private extractOrderingFields(data: InsertBaseAuxiliaryNotesDTO[]): string[] {
    return data.map((item) => item.notesData.campo_ordenacao);
  }

  private extractOrderData(data: InsertBaseAuxiliaryNotesDTO[]): OrderData[] {
    return data.map((item) => ({
      ordem_dci: item.notesData.ordem_dci,
      ordem_dcd: item.notesData.ordem_dcd,
      ordem_dca: item.notesData.ordem_dca,
      ordem_dcim: item.notesData.ordem_dcim,
    }));
  }

  private shouldSkipItem(
    notesData: any,
    existingNotesSet: Set<string>,
    existingOrdersSet: Set<string>,
  ): { noteExists: boolean; orderExists: boolean } {
    const noteExists = existingNotesSet.has(notesData.campo_ordenacao);

    const orders = [
      notesData.ordem_dci,
      notesData.ordem_dcd,
      notesData.ordem_dca,
      notesData.ordem_dcim,
    ].filter(Boolean);

    const orderExists = orders.some((order) => existingOrdersSet.has(order));

    return {
      noteExists,
      orderExists,
    };
  }

  private async processCalculations(
    validatedData: InsertBaseAuxiliaryNotesDTO[],
  ) {
    const allMaterials = this.extractAllMaterials(validatedData);

    const fatorMap = await this.auxiliaryBaseRepository.getFator(allMaterials);

    const notesData = validatedData.map((item) => item.notesData);
    const calculatedValues = validatedData.map((item) =>
      this.calculateItemValues(item, fatorMap),
    );

    return { notesData, calculatedValues };
  }

  private extractAllMaterials(validatedData: InsertBaseAuxiliaryNotesDTO[]) {
    return validatedData.flatMap((item) =>
      item.materialData.map((material) => ({
        material: material.material,
        pep_ref: material.def_proj,
      })),
    );
  }

  private calculateItemValues(
    item: InsertBaseAuxiliaryNotesDTO,
    fatorMap: Map<string, number>,
  ): CalculatedValue {
    const { materialData, notesData } = item;

    return materialData.reduce(
      (acc, material) => {
        const fatorKey = `${material.material}|${material.def_proj}`;
        const fator = fatorMap.get(fatorKey) ?? 0;

        acc.diagrama_rede = notesData.campo_ordenacao;

        if (fator !== 0) {
          acc.qtde_calc += material.qtd_necess / fator;
        }

        if (this.isMoCalculationApplicable(material)) {
          acc.mo_calc += material.preco_mi * material.qtd_necess;
        }

        if (material.ctg_item === 'L') {
          acc.capex_mat_calc += material.qtd_necess * material.preco_mi;
        }

        return acc;
      },
      { diagrama_rede: '', qtde_calc: 0, mo_calc: 0, capex_mat_calc: 0 },
    );
  }

  private isMoCalculationApplicable(material: any): boolean {
    return (
      material.ctg_item === 'N' &&
      material.um_registro === 'SRV' &&
      !material.texto_material.toUpperCase().includes('ENTREGA')
    );
  }
}
