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

    const dataToSearch = data.map((work) => ({
      ovnota: work.obra,
      ordem_dci: work.ordem_dci,
      ordem_dcd: work.ordem_dcd,
      ordem_dca: work.ordem_dca,
      ordem_dcim: work.ordem_dcim,
    }));

    const filters = this.buildFilters(dataToSearch);

    const [groups, existingWorks] = await Promise.all([
      this.insertWorksRepository.getGroup(),
      this.findExistingWorksService.findExistingNotes(filters),
    ]);

    const notes = data.reduce((acc, work) => {
      const group = groups.find((group) => group.id === work.idTipo);

      const matchedWork = existingWorks.find((ov) => {
        if (work.obra && work.obra !== ov.ovnota) return false;
        if (work.ordem_dci && work.ordem_dci !== ov.ordemDci) return false;
        if (work.ordem_dcd && work.ordem_dcd !== ov.ordemDcd) return false;
        if (work.ordem_dca && work.ordem_dca !== ov.ordemDca) return false;
        if (work.ordem_dcim && work.ordem_dcim !== ov.ordemDcim) return false;
        return true;
      });

      if (matchedWork) {
        const entity = NoteWorks.create({
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
          referencia: work.referencia,
          qtdePlanejada: work.qtdePlan,
          moPlanejada: work.moPlan,
          idEmpreendimento: work.idEmpreendimento,
          idGrupo: group.id_grupo,
          capexMoPlan: work.capexMoPlan,
          capexMatPlan: work.capexMatPlan,
          anoPlan: work.anoplan,
        }).toPrismaUpdate();

        acc.push(entity);
      }

      return acc;
    }, []);

    await this.updateNoteRepository.update(notes);
  }

  buildFilters(works: WorksInterface[]): any[] {
    if (!works.length) return [];

    const conditions = works.map((work) => {
      let filter: Record<string, any> = {};

      if (work.ovnota) {
        filter.ovnota = work.ovnota;
      }
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

    return conditions;
  }
}
