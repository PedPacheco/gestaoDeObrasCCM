import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import moment from 'moment';
import {
  D5_NOTES_REPOSITORY,
  D5NotePagination,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

@Injectable()
export class FindD5NotesService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async get(filters: D5NotesFiltersDTO) {
    const where = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page);

    const [rows, totals] = await Promise.all([
      this.d5NotesRepository.get(where, pagination),
      this.d5NotesRepository.getTotals(where),
    ]);

    const d5NotesFormatted = rows.map(
      ({
        obras,
        municipios,
        tipos,
        turmas,
        status,
        novo_tabela_usuarios,
        ...rest
      }) => ({
        ...rest,
        ordemDiagrama:
          obras?.diagrama ??
          obras?.ordem_dci ??
          obras?.ordem_dca ??
          obras?.ordem_dcd ??
          obras?.ordem_dcim,
        obra: obras?.ovnota ?? null,
        municipio: municipios.mun_minusculo,
        regional: municipios.regionais.regional,
        parceira: turmas.turma,
        tipoObra: tipos.tipo_obra,
        status: status.status,
        usuarioModificador: novo_tabela_usuarios?.nome ?? null,
      }),
    );

    return { d5Notes: d5NotesFormatted, totals };
  }

  async getById(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    const response = await this.d5NotesRepository.getById(id);

    if (!response) {
      throw new NotFoundException('Obra não encontrada');
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
    } = response;

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
      prazo: moment(rest.criado_em).add(7, 'days').toDate(),
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

  private buildWhereClause(filters: D5NotesFiltersDTO) {
    const where: any = {};

    if (filters.idRegional?.length) {
      where.municipios = {
        ...where.municipios,
        id_regional: { in: filters.idRegional },
      };
    }

    if (filters.idMunicipio?.length) {
      where.id_municipio = { in: filters.idMunicipio };
    }

    if (filters.idGrupo?.length) {
      where.id_turma = { in: filters.idGrupo };
    }

    if (filters.idTipo?.length) {
      where.id_tipo = { in: filters.idTipo };
    }

    if (filters.idParceira?.length) {
      where.id_parceira = { in: filters.idParceira };
    }

    return where;
  }

  private buildPagination(page?: number): D5NotePagination {
    if (page === undefined) return undefined;

    return {
      skip: page * 200,
      take: 200,
    };
  }
}
