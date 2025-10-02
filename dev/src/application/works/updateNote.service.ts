import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { FindExistingWorksService } from './findExistingWorks.service';
import {
  IInsertWorksRepository,
  INSERT_WORKS_REPOSITORY,
} from 'src/domain/repositories/works/IInsertWorksRepository';
import { NoteWorks } from 'src/domain/entities/works.entity';
import { UpdateNotesDTO } from 'src/interface/dtos/worksDto';
import {
  IUpdateNoteRepository,
  UPDATE_NOTE_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateNoteRepository';

interface WorksInterface {
  ovnota: string;
  ordem_dci?: string;
  ordem_dcd?: string;
  ordem_dca?: string;
  ordem_dcim?: string;
}

@Injectable()
export class UpdateNoteService {
  constructor(
    @Inject(INSERT_WORKS_REPOSITORY)
    private readonly insertWorksRepository: IInsertWorksRepository,
    @Inject(UPDATE_NOTE_REPOSITORY)
    private readonly updateNoteRepository: IUpdateNoteRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async update(data: UpdateNotesDTO[]) {
    if (!data?.length) {
      throw new BadRequestException('Nenhum dado enviado.');
    }

    const normalizeKey = (work: any) =>
      [
        work.ovnota,
        work.ordem_dci ?? '',
        work.ordem_dcd ?? '',
        work.ordem_dca ?? '',
        work.ordem_dcim ?? '',
      ].join('|');

    const dataToSearch = data.map((work) => ({
      ovnota: work.obra,
      ordem_dci: work.ordem_dci === '' ? null : work.ordem_dci,
      ordem_dcd: work.ordem_dcd === '' ? null : work.ordem_dcd,
      ordem_dca: work.ordem_dca === '' ? null : work.ordem_dca,
      ordem_dcim: work.ordem_dcim === '' ? null : work.ordem_dcim,
    }));

    const filters = this.buildFilters(dataToSearch);

    const [groups, existingWorks] = await Promise.all([
      this.insertWorksRepository.getGroup(),
      this.findExistingWorksService.findExistingNotes(filters),
    ]);

    const groupsById = new Map(groups.map((g) => [g.id, g]));

    const existingMap = new Map(
      existingWorks.map((ov) => [
        normalizeKey({
          ovnota: ov.ovnota,
          ordem_dci: ov.ordemDci,
          ordem_dcd: ov.ordemDcd,
          ordem_dca: ov.ordemDca,
          ordem_dcim: ov.ordemDcim,
        }),
        ov,
      ]),
    );

    const notes = data.map((work) => {
      const key = normalizeKey({
        ovnota: work.obra,
        ordem_dci: work.ordem_dci,
        ordem_dcd: work.ordem_dcd,
        ordem_dca: work.ordem_dca,
        ordem_dcim: work.ordem_dcim,
      });

      const matchedWork = existingMap.get(key);
      if (!matchedWork) return;

      const group = groupsById.get(work.idTipo);
      if (!group) return;

      return NoteWorks.create({
        id: matchedWork.id,
        obra: work.obra,
        pep: work.pep,
        entrada: work.entrada,
        prazoTexto: work.prazo,
        equipeNumPedido: work.referencia,
        idMunicipio: work.idMunicipio,
        idTipo: work.idTipo,
        idParceira: work.idTurma,
        idCircuito: work.idCircuito,
        dci: work.ordem_dci,
        dcd: work.ordem_dcd,
        dca: work.ordem_dca,
        dcim: work.ordem_dcim,
        qtdePlanejada: work.qtdePlan,
        moPlanejada: work.moPlan,
        idEmpreendimento: work.idEmpreendimento,
        idGrupo: group.id_grupo,
        anoPlan: work.anoplan,
      }).toPrismaUpdate();
    });

    await this.updateNoteRepository.update(notes);
  }

  buildFilters(works: WorksInterface[]): any[] {
    return works.map((work) => {
      let filter: Record<string, any> = {};

      filter.ovnota = work.ovnota;

      if (work.ordem_dci) {
        filter.ordem_dci = work.ordem_dci;
      }
      if (work.ordem_dcd) {
        filter.ordem_dcd = work.ordem_dcd;
      }
      if (work.ordem_dca) {
        filter.ordem_dca = work.ordem_dca;
      }
      if (work.ordem_dcim) {
        filter.ordem_dcim = work.ordem_dcim;
      }

      return filter;
    });
  }
}
