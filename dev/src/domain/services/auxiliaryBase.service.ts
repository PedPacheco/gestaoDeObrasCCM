import {
  InsertBaseAuxiliaryMarketDTO,
  InsertBaseAuxiliaryNotesDTO,
  NotesDTO,
} from 'src/interface/dtos/auxiliaryBaseDTO';
import { InsertNotes } from 'src/interface/types/works/insertNotesInterface';

import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { MarketWork } from '../entities/works.entity';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from '../repositories/IAuxiliaryBaseRepository';
import { FindExistingWorksService } from './works/findExistingWorks.service';

type calculatedValuesType = {
  diagrama_rede: string;
  qtde_calc: number;
  mo_calc: number;
  capex_mat_calc: number;
};

export interface DataAuxiliaryNotes {
  notesData: NotesDTO[];
  calculatedValues: calculatedValuesType[];
}

@Injectable()
export class AuxiliaryBaseService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async getNotes(idRegional?: number): Promise<InsertNotes[]> {
    const notes =
      await this.auxiliaryBaseRepository.getAuxiliaryBaseNotes(idRegional);

    return notes.map((note) => ({
      obra: note.obra,
      pep: note.pep,
      dci: note.dci,
      dcd: note.dcd,
      dca: note.dca,
      dcim: note.dcim,
      entrada: note.entrada,
      prazo: note.prazo,
      referencia: note.referencia,
      mo_plan: note.mo_plan,
      qtde_plan: note.qtde_plan,
      municipio: note.aux_gpm,
      empreendimento: note.aux_empreendimento,
      tipo: note.aux_tipo,
      parceira: note.aux_turma,
      circuito: note.aux_circuito,
      tecnico: note.aux_tecnico,
      capex_mo_plan: note.capex_mo_plan,
      capex_mat_plan: note.capex_mat_plan,
      anoplan: note.anoplan,
    }));
  }

  async getMarket(idRegional?: number): Promise<any> {
    const works =
      await this.auxiliaryBaseRepository.getAuxiliaryBaseMarket(idRegional);

    return works.map((work: MarketWork) => ({
      obra: work.obra,
      pep: work.pep,
      diagrama: work.diagrama,
      entrada: work.entrada,
      municipio: work.idMunicipio,
      tipo: work.idTipo,
      parceira: work.idParceira,
      circuito: work.idCircuito,
      prazo: work.prazo,
      prazoTotal: work.prazoTotal,
      prazoTexto: work.prazoTexto,
      moPlanejada: work.moPlanejada,
      referencia: work.referencia,
      observacao: work.observacao,
      statusOv: work.statusOv,
      statusPep: work.statusPep,
      statusDiagrama: work.statusDiagrama,
      equipeNumPedido: work.equipeNumPedido,
    }));
  }

  async delete(tableToDelete: string): Promise<void> {
    const result = await this.auxiliaryBaseRepository.delete(tableToDelete);

    if (result.count === 0) {
      throw new NotFoundException('Nenhum dado encontrado para exclusão.');
    }
  }

  async insertAuxiliaryBaseNotes(data: InsertBaseAuxiliaryNotesDTO[]): Promise<{
    insertedCount: number;
    skippedNotes: string[];
    skippedOrders: string[];
  }> {
    const validatedData: InsertBaseAuxiliaryNotesDTO[] = [];
    const skippedNotes: string[] = [];
    const skippedOrders: string[] = [];

    if (!data.length)
      return { insertedCount: 0, skippedNotes: [], skippedOrders: [] };

    const allOrderingFields = data.map(
      (item) => item.notesData.campo_ordenacao,
    );

    const [existingNotes, existingOrders] = await Promise.all([
      this.findExistingWorksService.findExistingWorks(allOrderingFields),
      this.findExistingWorksService.findExistingOrders(
        data.map((item) => ({
          ordem_dci: item.notesData.ordem_dci,
          ordem_dcd: item.notesData.ordem_dcd,
          ordem_dca: item.notesData.ordem_dca,
          ordem_dcim: item.notesData.ordem_dcim,
        })),
      ),
    ]);

    const existingNotesSet = new Set(existingNotes);
    const existingOrdersSet = new Set(existingOrders);

    for (let item of data) {
      const { notesData } = item;
      const noteExists = existingNotesSet.has(notesData.campo_ordenacao);
      const orderExists = [
        notesData.ordem_dci,
        notesData.ordem_dcd,
        notesData.ordem_dca,
        notesData.ordem_dcim,
      ]
        .filter(Boolean)
        .some((order) => existingOrdersSet.has(order));

      if (noteExists || orderExists) {
        if (noteExists) skippedNotes.push(notesData.campo_ordenacao);
        if (orderExists) skippedOrders.push(notesData.campo_ordenacao);
        continue;
      }

      validatedData.push(item);
    }

    const allMaterials = validatedData.flatMap((item) =>
      item.materialData.map((material) => ({
        material: material.material,
        pep_ref: material.def_proj,
      })),
    );

    const fatorMap = await this.auxiliaryBaseRepository.getFator(allMaterials);

    const notesData = validatedData.map((item) => item.notesData);
    const calculatedValues = validatedData.map((item) => {
      const { materialData, notesData } = item;

      return materialData.reduce(
        (acc, material) => {
          const fator =
            fatorMap.get(`${material.material}|${material.def_proj}`) ?? 0;

          acc.diagrama_rede = notesData.campo_ordenacao;

          if (fator !== 0) {
            acc.qtde_calc += material.qtd_necess / fator;
          }

          if (
            material.ctg_item === 'N' &&
            material.um_registro === 'SRV' &&
            !material.texto_material.toUpperCase().includes('ENTREGA')
          ) {
            acc.mo_calc += material.preco_mi * material.qtd_necess;
          }

          if (material.ctg_item === 'L') {
            acc.capex_mat_calc += material.qtd_necess * material.preco_mi;
          }

          return acc;
        },
        { diagrama_rede: '', qtde_calc: 0, mo_calc: 0, capex_mat_calc: 0 },
      );
    });

    if (validatedData.length === 0) {
      return { insertedCount: 0, skippedNotes: [], skippedOrders: [] };
    }

    await this.auxiliaryBaseRepository.insertNotes({
      notesData,
      calculatedValues,
    });

    return {
      insertedCount: validatedData.length,
      skippedNotes,
      skippedOrders,
    };
  }

  async insertAuxiliaryBaseMarket(data: InsertBaseAuxiliaryMarketDTO[]) {
    if (data.length === 0) return;

    const marketEntry = [...new Set(data.map((item) => item.obra))];

    const existingOvs =
      await this.findExistingWorksService.findExistingWorks(marketEntry);

    const existingOvsSet = new Set(existingOvs);

    const newData = data.filter((item) => !existingOvsSet.has(item.obra));

    if (newData.length === 0) {
      throw new BadRequestException(
        `Todas as obras já existem no banco de dados: ${existingOvs.join(', ')}`,
      );
    }

    await this.auxiliaryBaseRepository.insertMarket(newData);
  }
}
