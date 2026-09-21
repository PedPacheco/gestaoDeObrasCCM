import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  D5_NOTES_REPOSITORY,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';

@Injectable()
export class FindD5NoteByIdService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async getById(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    const {
      obras,
      municipios,
      tipos,
      turmas,
      status,
      novo_tabela_usuarios,
      programacoes_d5,
      ...rest
    } = await this.d5NotesRepository.getById(id);

    const { totalExecutado, totalProgramado } =
      this.calculateCostPointByPointSchedule(programacoes_d5);

    return {
      ...rest,
      obra: obras?.ovnota ?? null,
      ordemDiagrama:
        obras?.diagrama ??
        obras?.ordem_dci ??
        obras?.ordem_dca ??
        obras?.ordem_dcd ??
        obras?.ordem_dcim,
      municipio: municipios.mun_minusculo,
      regional: municipios.regionais.regional,
      parceira: turmas.turma,
      tipoObra: tipos.tipo_obra,
      status: status.status,
      usuarioModificador: novo_tabela_usuarios?.nome ?? null,
      totalProgramado,
      totalExecutado,
    };
  }

  private calculateCostPointByPointSchedule(
    data: { prog: number; exec: number }[],
  ) {
    return data.reduce(
      (acc, item) => {
        acc.totalProgramado += item.prog;
        acc.totalExecutado += item.exec;

        return acc;
      },
      {
        totalProgramado: 0,
        totalExecutado: 0,
      },
    );
  }
}
