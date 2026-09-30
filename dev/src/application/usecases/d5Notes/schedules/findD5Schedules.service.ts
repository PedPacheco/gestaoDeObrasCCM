import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { D5NotePagination } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { D5NotesSchedulesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';

@Injectable()
export class FindD5SchedulesService {
  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private d5SchedulesRepository: ID5NotesSchedulesRepository,
  ) {}

  async findD5NotesSchedules(filters: D5NotesSchedulesFiltersDTO) {
    const where = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page);

    const [rows, totals] = await Promise.all([
      this.d5SchedulesRepository.get(where, pagination),
      this.d5SchedulesRepository.getTotals(where),
    ]);

    return { d5Notes: D5NoteScheduleMapper.toListItems(rows), totals };
  }

  async findByD5NoteId(id: number) {
    const data = await this.d5SchedulesRepository.getByD5NoteId(id);

    return D5NoteScheduleMapper.toResponseList(data);
  }

  private buildWhereClause(filters: D5NotesSchedulesFiltersDTO) {
    const where: any = {};

    if (filters.dataFinal && filters.dataInicial) {
      where.data_prog = {
        gte: moment
          .utc(filters.dataInicial, 'DD/MM/YYYY')
          .startOf('day')
          .toDate(),
        lte: moment.utc(filters.dataFinal, 'DD/MM/YYYY').endOf('day').toDate(),
      };
    }

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
