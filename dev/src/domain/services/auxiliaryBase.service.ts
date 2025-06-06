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

  // Promise<{
  //   insertedCount: number;
  //   skippedNotes: string[];
  //   skippedOrders: string[];
  // }>

  async insertAuxiliaryBaseNotes(
    data: InsertBaseAuxiliaryNotesDTO[],
  ): Promise<any> {
    const validatedData: NotesDTO[] = [];
    const skippedNotes: string[] = [];
    const skippedOrders: string[] = [];

    const calculatedMap = new Map<string, calculatedValuesType>();

    for (let item of data) {
      const { notesData, materialData } = item;
      const [existingNotesList, existingOrdersList] = await Promise.all([
        this.findExistingWorksService.findExistingNotes(
          notesData.campo_ordenacao,
        ),
        this.findExistingWorksService.findExistingOrders({
          ordem_dci: notesData.ordem_dci,
          ordem_dcd: notesData.ordem_dcd,
          ordem_dca: notesData.ordem_dca,
          ordem_dcim: notesData.ordem_dcim,
        }),
      ]);

      const existingNotes = new Set(existingNotesList);
      const existingOrders = new Set(existingOrdersList);

      const noteExists = existingNotes.has(notesData.campo_ordenacao);
      const orderExists = [
        notesData.ordem_dci,
        notesData.ordem_dcd,
        notesData.ordem_dca,
        notesData.ordem_dcim,
      ]
        .filter(Boolean)
        .some((order) => existingOrders.has(order));

      if (noteExists || orderExists) {
        if (noteExists) skippedNotes.push(notesData.campo_ordenacao);
        if (orderExists) skippedOrders.push(notesData.campo_ordenacao);
        continue;
      }

      validatedData.push(notesData);

      const uniqueFatorKeys = Array.from(
        new Set(materialData.map((m) => `${m.material}|${m.def_proj}`)),
      );

      const fatorInput = uniqueFatorKeys.map((key) => {
        const [material, pep_ref] = key.split('|');
        return { material, pep_ref };
      });

      const fatorMap = await this.auxiliaryBaseRepository.getFator(fatorInput);

      const mapKey = notesData.campo_ordenacao;

      let qtde_calc = 0;
      let mo_calc = 0;
      let capex_mat_calc = 0;

      for (const material of materialData) {
        const fator =
          fatorMap.get(`${material.material}|${material.def_proj}`) ?? 0;

        if (fator !== 0) {
          qtde_calc += material.qtd_necess / fator;
        }

        if (
          material.ctg_item === 'N' &&
          material.um_registro === 'SRV' &&
          !material.texto_material.toUpperCase().includes('ENTREGA')
        ) {
          mo_calc += material.preco_mi * material.qtd_necess;
        }

        if (material.ctg_item === 'L') {
          capex_mat_calc += material.qtd_necess * material.preco_mi;
        }
      }

      const current = calculatedMap.get(mapKey);

      if (!current) {
        calculatedMap.set(mapKey, {
          diagrama_rede: notesData.campo_ordenacao,
          qtde_calc,
          mo_calc,
          capex_mat_calc,
        });
      } else {
        current.qtde_calc += qtde_calc;
        current.mo_calc += mo_calc;
        current.capex_mat_calc += capex_mat_calc;
      }
    }

    if (validatedData.length === 0) {
      return {
        skippedNotes,
      };
    }

    await this.auxiliaryBaseRepository.insertNotes({
      notesData: validatedData,
      calculatedValues: Array.from(calculatedMap.values()),
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
      await this.findExistingWorksService.findExistingMarketWorks(marketEntry);

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
