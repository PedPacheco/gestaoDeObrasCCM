import * as ExcelJS from 'exceljs';
import { MarketWork } from 'src/domain/entities/works.entity';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  InsertBaseAuxiliaryMarketDTO,
  NotesDTO,
} from 'src/interface/dtos/auxiliaryBaseDTO';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';
import { InsertNotes } from 'src/interface/types/works/insertNotesInterface';

import { Inject, Injectable } from '@nestjs/common';

import { AuxiliaryMarketInsertService } from './auxiliaryBaseInsertMarket.service';
import { AuxiliaryNotesInsertService } from './auxiliaryBaseInsertNotes.service';

export interface DataAuxiliaryNotes {
  notesData: NotesDTO[];
}

@Injectable()
export class AuxiliaryBaseService {
  private obraCache = new Map<string, number>();

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
      ehRda: note.eh_rda,
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
      moEmpresa: work.moEmpresa,
      moCliente: work.moCliente,
      moPlanejada: work.moPlanejada,
      referencia: work.referencia,
      observacao: work.observacao,
      statusOv: work.statusOv,
      statusPep: work.statusPep,
      statusDiagrama: work.statusDiagrama,
      equipeNumPedido: work.equipeNumPedido,
    }));
  }

  async delete(tableToDelete: string, id?: number): Promise<void> {
    await this.auxiliaryBaseRepository.delete(tableToDelete, id);
  }

  async insertAuxiliaryBaseNotes(
    data: NotesDTO[],
    operation: OperationType,
  ): Promise<{
    insertedCount: number;
    skippedNotes: string[];
  }> {
    return this.auxiliaryNotesInsertService.execute(data, operation);
  }

  async insertAuxiliaryBaseMarket(
    data: InsertBaseAuxiliaryMarketDTO[],
    operation: OperationType,
  ) {
    return this.auxiliaryMarketInsertService.execute(data, operation);
  }

  async processCapexFile(filePath: string) {
    try {
      // 🔥 melhor manter aqui (antes do processamento)
      await this.auxiliaryBaseRepository.truncateCN52N();

      const workbook = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
        entries: 'emit',
        sharedStrings: 'cache',
        hyperlinks: 'emit',
        worksheets: 'emit',
      });

      const BATCH_SIZE = 5000;
      let batch: any[] = [];

      for await (const worksheet of workbook) {
        for await (const row of worksheet) {
          if (row.number <= 2) continue;

          const values = row.values as any[];

          const item = {
            diagrama_rede: values[2].toString(),
            def_proj: values[3],
            material: values[4].toString(),
            texto_breve: values[5],
            centro: values[6],
            dep: values[7],
            cti: values[8],
            elemento_pep: values[9],
            und: values[10],
            preco: values[11],
            qtd_necessaria: values[12],
            qtd_retirada: values[13],
            qtd_recebida: values[14],
            qtd_falta: values[15],
            reserva: values[17],
          };

          batch.push(item);

          if (batch.length >= BATCH_SIZE) {
            await this.processBatch(batch);
            batch = [];
          }
        }
      }

      // flush final
      if (batch.length) {
        await this.processBatch(batch);
      }
    } catch (error) {
      console.error('Erro no processamento CAPEX', error);
      throw error;
    } finally {
      // 🧹 cleanup obrigatório
      await import('fs').then((fs) =>
        fs.promises.unlink(filePath).catch(() => {}),
      );
    }
  }

  private async processBatch(batch: any[]) {
    const uniqueDiagramas = [
      ...new Set(batch.map((item) => item.diagrama_rede)),
    ];

    // 🔥 busca apenas os que ainda não estão no cache
    const missingDiagramas = uniqueDiagramas.filter(
      (d) => !this.obraCache.has(d),
    );

    if (missingDiagramas.length) {
      const obraIdsMap =
        await this.auxiliaryBaseRepository.getObraIdsByDiagramas(
          missingDiagramas,
        );

      obraIdsMap.forEach((value, key) => {
        this.obraCache.set(key, value);
      });
    }

    const dataWithObraId = batch.map((item) => ({
      ...item,
      id_obra: this.obraCache.get(item.diagrama_rede) ?? null,
    }));

    await this.auxiliaryBaseRepository.insertCapex(dataWithObraId);
  }
}
