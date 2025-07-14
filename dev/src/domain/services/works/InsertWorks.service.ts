import { MarketWork, NoteWorks } from 'src/domain/entities/works.entity';
import {
  IInsertWorksRepository,
  INSERT_WORKS_REPOSITORY,
} from 'src/domain/repositories/works/IInsertWorksRepository';
import { InsertMarketWorksDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { NotesEntriesInterface } from 'src/interface/types/works/insertNotesInterface';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AuxiliaryBaseService } from '../auxiliaryBase.service';
import { FindExistingWorksService } from './findExistingWorks.service';

@Injectable()
export class InsertWorksService {
  constructor(
    @Inject(INSERT_WORKS_REPOSITORY)
    private readonly insertWorksRepository: IInsertWorksRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
    private readonly auxiliaryBaseService: AuxiliaryBaseService,
  ) {}

  async insertMarketWorks(params: InsertMarketWorksDTO[]): Promise<{
    message: string;
    insertedCount: any;
    skipped: string[];
  }> {
    const works = params.map(
      (work: InsertMarketWorksDTO) =>
        new MarketWork(
          work.obra,
          work.pep,
          work.entrada,
          work.prazoTexto,
          work.equipeNumPedido,
          work.idMunicipio,
          work.idTipo,
          work.idParceira,
          work.idCircuito,
          work.diagrama,
          work.observacao,
          work.statusOv,
          work.statusDiagrama,
          work.statusPep,
          work.moCliente,
          work.moEmpresa,
        ),
    );

    if (works.length === 0) {
      throw new BadRequestException('Nenhuma obra fornecida para inserção.');
    }

    const marketEntry = [...new Set(works.map((item) => item.obra))];

    const existingOvs =
      await this.findExistingWorksService.findExistingWorks(marketEntry);

    const existingOvsSet = new Set(existingOvs);

    const newData = works.filter((item) => !existingOvsSet.has(item.obra));

    if (newData.length === 0) {
      throw new BadRequestException(
        `Todas as obras já existem no banco de dados: ${existingOvs.join(', ')}`,
      );
    }

    await this.insertWorksRepository.insertMarketWorks(newData);

    return {
      message: 'Inserção concluída com sucesso.',
      insertedCount: newData,
      skipped: existingOvs,
    };
  }

  async insertNotes(noteEntries: NotesEntriesInterface[]) {
    const [data, groups] = await Promise.all([
      this.auxiliaryBaseService.getNotes(),
      this.insertWorksRepository.getGroup(),
    ]);

    const notes = data.map((work) => {
      const group = groups.find((group) => group.id === work.tipo);
      const dataEntries = noteEntries.find((item) => item.obra === work.obra);

      const entity = new NoteWorks(
        work.obra,
        work.pep,
        dataEntries.entrada,
        dataEntries.prazo,
        dataEntries.referencia,
        dataEntries.aux_gpm,
        dataEntries.aux_tipo,
        dataEntries.aux_turma,
        dataEntries.aux_circuito,
        work.dci,
        work.dcd,
        work.dca,
        work.dcim,
        dataEntries.referencia,
        work.qtde_plan,
        work.mo_plan,
        dataEntries.aux_empreendimento,
        group.id_grupo,
        work.capex_mat_plan,
        work.capex_mo_plan,
        dataEntries.anoplan,
      );

      entity.validateNota();

      return entity;
    });

    await this.insertWorksRepository.insertNotes(notes);
  }
}
