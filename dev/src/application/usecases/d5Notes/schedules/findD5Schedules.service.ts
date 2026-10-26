import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { D5NotePagination } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import { D5NotesSchedulesFiltersDTO } from 'src/interface/dtos/d5NotesDTO';
import { NoteScheduledWork } from 'src/interface/types/d5notes/types';

@Injectable()
export class FindD5SchedulesService {
  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private d5SchedulesRepository: ID5NotesSchedulesRepository,
    private readonly timeMetrics: TimeMetricsService,
  ) {}

  async findD5NotesSchedules(filters: D5NotesSchedulesFiltersDTO) {
    const where = this.buildWhereClause(filters);
    const pagination = this.buildPagination(filters.page);

    const [rows, notes] = await Promise.all([
      this.d5SchedulesRepository.get(where, pagination),
      this.d5SchedulesRepository.getTotals(where),
    ]);

    return {
      d5Notes: D5NoteScheduleMapper.toListItems(rows, (row) => {
        const tm = this.timeMetrics.calculateTM(
          row.notas_d5.criado_em,
          row.notas_d5.conclusao_nota,
        );
        return {
          ...tm,
          statusPrazo: this.timeMetrics.calculateStatus(tm.tmAberto),
        };
      }),
      totals: this.buildTotals(notes),
    };
  }

  async findByD5NoteId(id: number) {
    const data = await this.d5SchedulesRepository.getByD5NoteId(id);

    return D5NoteScheduleMapper.toResponseList(data);
  }

  async findRejectionsByD5Note(id: number) {
    const data = await this.d5SchedulesRepository.findRejections(id);

    return D5NoteScheduleMapper.toRejectionsResponseList(data);
  }

  private buildWhereClause(filters: D5NotesSchedulesFiltersDTO): any {
    // Junta as condições em AND para que nenhum filtro substitua outro
    const and: any[] = [];

    // --- Filtros de lista (aplicados à tabela notas_d5) ---
    const notaD5: any = {};

    // Início do dia de hoje, na data local, guardado como meia-noite UTC
    const hoje = moment.utc(moment().format('YYYY-MM-DD')).toDate();

    // --- Período ---
    if (filters.dataInicial && filters.dataFinal) {
      and.push({
        data_prog: {
          gte: moment
            .utc(filters.dataInicial, 'DD/MM/YYYY')
            .startOf('day')
            .toDate(),
          lte: moment
            .utc(filters.dataFinal, 'DD/MM/YYYY')
            .endOf('day')
            .toDate(),
        },
      });
    }

    if (filters.idRegional?.length) {
      notaD5.municipios = { id_regional: { in: filters.idRegional } };
    }
    if (filters.idMunicipio?.length) {
      notaD5.id_municipio = { in: filters.idMunicipio };
    }
    if (filters.idGrupo?.length) {
      notaD5.tipos = { id_grupo: { in: filters.idGrupo } };
    }
    if (filters.idTipo?.length) {
      notaD5.id_tipo = { in: filters.idTipo };
    }
    if (filters.idParceira?.length) {
      notaD5.id_parceira = { in: filters.idParceira };
    }
    if (filters.idOvnota?.length) {
      notaD5.id_obra = { in: filters.idOvnota };
    }
    // Só acrescenta o filtro de relação se houver pelo menos um critério
    if (Object.keys(notaD5).length) {
      and.push({ notas_d5: { is: notaD5 } });
    }

    if (filters.idNotaD5?.length) {
      and.push({ id_nota_d5: { in: filters.idNotaD5 } });
    }

    if (filters.id?.length) {
      and.push({ id: { in: filters.id } });
    }

    // --- Filtros de estado ---
    const temFiltroDeEstado =
      filters.pendente || filters.executado || filters.reprovada;

    if (!temFiltroDeEstado) {
      // Por defeito: obras programadas, ou seja, sem execução, a partir de hoje e não reprovadas
      and.push(
        { exec: null },
        { data_prog: { gte: hoje } },
        { reprovada: false },
      );
    } else {
      if (filters.reprovada) {
        and.push({ reprovada: true });
      }
      if (filters.executado) {
        and.push({ exec: { not: null } });
      }
      if (filters.pendente) {
        // Pendente: a data já passou e a obra continua sem execução
        and.push({ exec: null }, { data_prog: { lt: hoje } });
      }
    }

    return { AND: and };
  }

  private buildPagination(page?: number): D5NotePagination {
    if (page === undefined) return undefined;

    return {
      skip: page * 200,
      take: 200,
    };
  }

  private buildTotals(data: NoteScheduledWork[]) {
    return data.reduce(
      (acc, note) => {
        const sum = note.progs.reduce((acc, p) => acc + p, 0);

        acc.total += note.progs.length;
        acc.totalMoRetida += note.moRetida;
        acc.totalMoProgramada += note.moRetida * (Math.min(sum, 100) / 100);
        return acc;
      },
      { total: 0, totalMoRetida: 0, totalMoProgramada: 0 },
    );
  }
}
