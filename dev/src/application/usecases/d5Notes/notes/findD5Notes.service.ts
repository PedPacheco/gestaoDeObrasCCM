import { Inject, Injectable } from '@nestjs/common';
import {
  D5_NOTES_REPOSITORY,
  D5NotePagination,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { D5NotesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';
import { FindD5NotesQueryResult } from 'src/interface/types/d5notes/types';

@Injectable()
export class FindD5NotesService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async get(filters: D5NotesFiltersDTO) {
    const where = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page);
    const d5NotesData = await this.d5NotesRepository.get(where, pagination);

    const totals = this.calculateTotals(d5NotesData);

    const d5NotesFormatted = d5NotesData.map(
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

  private calculateTotals(data: FindD5NotesQueryResult[]) {
    return data.reduce(
      (acc, item) => {
        acc.totalNotas += 1;
        acc.totalMoPlanejado += Number(item.mo_planejada);
        return acc;
      },
      { totalNotas: 0, totalMoPlanejado: 0 },
    );
  }
}
