import { NoteWorks } from 'src/domain/entities/works.entity';
import {
  IInsertWorksRepository,
  INSERT_WORKS_REPOSITORY,
} from 'src/domain/repositories/works/IInsertWorksRepository';
import {
  IUpdateNoteRepository,
  UPDATE_NOTE_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateNoteRepository';
import { UpdateNotesDTO } from 'src/interface/dtos/worksDto';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { FindExistingWorksService } from './findExistingWorks.service';

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

    const filters = data.map((work) => ({ ovnota: work.obra }));

    const [groups, existingWorks] = await Promise.all([
      this.insertWorksRepository.getGroup(),
      this.findExistingWorksService.findExistingNotes(filters),
    ]);

    const groupsById = new Map(groups.map((g) => [g.id, g]));

    const existingMap = new Map(
      existingWorks.flatMap((ov) => {
        const fullKey = normalizeKey({
          ovnota: ov.ovnota,
          ordem_dci: ov.ordemDci,
          ordem_dcd: ov.ordemDcd,
          ordem_dca: ov.ordemDca,
          ordem_dcim: ov.ordemDcim,
        });

        const simpleKey = ov.ovnota;

        return [
          [fullKey, ov],
          [simpleKey, ov],
        ];
      }),
    );

    const notes = data.map((work) => {
      const fullKey = normalizeKey({
        ovnota: work.obra,
        ordem_dci: work.ordem_dci,
        ordem_dcd: work.ordem_dcd,
        ordem_dca: work.ordem_dca,
        ordem_dcim: work.ordem_dcim,
      });

      const simpleKey = work.obra;

      let matchedWork: any = null;

      if (work.ordem_dcim) {
        matchedWork = Array.from(existingMap.values()).find(
          (ov) => ov.ovnota === work.obra && ov.ordemDcim && work.ordem_dcim,
        );
      }

      if (!matchedWork) {
        matchedWork = existingMap.get(fullKey) ?? existingMap.get(simpleKey);
      }

      if (!matchedWork) return;

      const group = groupsById.get(work.idTipo);
      if (!group) return;

      return NoteWorks.create({
        id: matchedWork.id,
        obra: work.obra,
        pep: work.pep,
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
}
