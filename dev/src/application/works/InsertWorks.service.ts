import { MarketWork, NoteWorks } from 'src/domain/entities/works.entity';
import {
  IInsertWorksRepository,
  INSERT_WORKS_REPOSITORY,
} from 'src/domain/repositories/works/IInsertWorksRepository';
import { InsertMarketWorksDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { NotesEntriesInterface } from 'src/interface/types/works/insertNotesInterface';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { AuxiliaryBaseService } from '../auxiliaryBase/auxiliaryBase.service';
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

    const existingOvsSet = new Set(existingOvs.map((o) => o.ovnota));

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
      skipped: existingOvs.map((o) => o.ovnota),
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

      const entity = NoteWorks.create({
        obra: work.obra,
        pep: work.pep,
        entrada: dataEntries.entrada,
        prazoTexto: dataEntries.prazo,
        equipeNumPedido: dataEntries.referencia,
        idMunicipio: dataEntries.aux_gpm,
        idTipo: dataEntries.aux_tipo,
        idParceira: dataEntries.aux_turma,
        idCircuito: dataEntries.aux_circuito,
        dci: work.dci,
        dcd: work.dcd,
        dca: work.dca,
        dcim: work.dcim,
        referencia: dataEntries.referencia,
        qtdePlanejada: work.qtde_plan,
        moPlanejada: work.mo_plan,
        idEmpreendimento: dataEntries.aux_empreendimento,
        idGrupo: group.id_grupo,
        capexMoPlan: work.capex_mo_plan,
        capexMatPlan: work.capex_mat_plan,
        anoPlan: dataEntries.anoplan,
      });

      return entity;
    });

    await this.insertWorksRepository.insertNotes(notes);
  }
}
