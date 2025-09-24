import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  InsertBaseAuxiliaryMarketDTO,
  InsertBaseAuxiliaryNotesDTO,
  NotesDTO,
} from 'src/interface/dtos/auxiliaryBaseDTO';
import { InsertNotes } from 'src/interface/types/works/insertNotesInterface';

import { Inject, Injectable } from '@nestjs/common';
import { MarketWork } from 'src/domain/entities/works.entity';
import { AuxiliaryNotesInsertService } from './auxiliaryBaseInsertNotes.service';
import { AuxiliaryMarketInsertService } from './auxiliaryBaseInsertMarket.service';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';

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
    private readonly auxiliaryNotesInsertService: AuxiliaryNotesInsertService,
    private readonly auxiliaryMarketInsertService: AuxiliaryMarketInsertService,
  ) {}

  async getNotes(idRegional?: number): Promise<InsertNotes[]> {
    const notes =
      await this.auxiliaryBaseRepository.getAuxiliaryBaseNotes(idRegional);

    return notes.map((note) => ({
      id: note.id,
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
      id: work.id,
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

  async delete(tableToDelete: string, id: number): Promise<void> {
    await this.auxiliaryBaseRepository.delete(tableToDelete, id);
  }

  async insertAuxiliaryBaseNotes(
    data: InsertBaseAuxiliaryNotesDTO[],
    operation: OperationType,
  ): Promise<{
    insertedCount: number;
    skippedNotes: string[];
    skippedOrders: string[];
  }> {
    return this.auxiliaryNotesInsertService.execute(data, operation);
  }

  async insertAuxiliaryBaseMarket(
    data: InsertBaseAuxiliaryMarketDTO[],
    operation: OperationType,
  ) {
    return this.auxiliaryMarketInsertService.execute(data, operation);
  }
}
