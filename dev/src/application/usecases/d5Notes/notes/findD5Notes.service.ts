import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import moment from 'moment';
import {
  toD5NoteDetailOutput,
  toD5NoteListItemOutput,
} from 'src/application/mappers/d5Notes/d5NotesMapper';

import type {
  D5NoteDetailOutput,
  D5NoteListItemOutput,
  D5NoteScheduleTotals,
  D5NotesFilterInput,
  D5NotesListOutput,
} from 'src/application/types/usecases/d5Notes/d5Notes.types';
import {
  D5_NOTES_REPOSITORY,
  ID5NotesRepository,
} from 'src/domain/contracts/d5Notes/ID5notesRepository';
import { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import type {
  D5NoteDetail,
  D5NoteFilter,
  D5NoteListItem,
  DateRange,
  Pagination,
} from 'src/domain/types';

const PAGE_SIZE = 200;

@Injectable()
export class FindD5NotesService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
    private readonly timeMetrics: TimeMetricsService,
  ) {}

  async get(input: D5NotesFilterInput): Promise<D5NotesListOutput> {
    const filter = this.toFilter(input);

    const [notes, totals] = await Promise.all([
      this.d5NotesRepository.get(filter, this.buildPagination(input.page)),
      this.d5NotesRepository.getTotals(filter),
    ]);

    return {
      d5Notes: notes.map((note) => this.toListItem(note)),
      totals,
    };
  }

  async getById(id: number): Promise<D5NoteDetailOutput> {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    const note = await this.d5NotesRepository.getById(id);
    if (!note) {
      throw new NotFoundException('Obra não encontrada');
    }

    return toD5NoteDetailOutput(note, this.sumSchedules(note.schedules));
  }

  // ─── Output ─────────────────────────────────────────────────────────

  private toListItem(note: D5NoteListItem): D5NoteListItemOutput {
    const { tmAberto, tmExecucao } = this.timeMetrics.getDeadlineInfo(
      note.createdAt,
      note.completedAt,
    );
    return toD5NoteListItemOutput(note, {
      tmAberto,
      tmExecucao,
      statusPrazo: this.timeMetrics.calculateStatus(tmAberto),
    });
  }

  /** 6e: cálculo passa para domain/rules. */
  private sumSchedules(
    schedules: D5NoteDetail['schedules'],
  ): D5NoteScheduleTotals {
    return schedules.reduce(
      (acc, s) => ({
        totalProgramado: acc.totalProgramado + s.planned,
        totalExecutado: acc.totalExecutado + s.executed,
      }),
      { totalProgramado: 0, totalExecutado: 0 },
    );
  }

  // ─── Filtros (antigo buildWhereClause) ──────────────────────────────

  private toFilter(input: D5NotesFilterInput): D5NoteFilter {
    return {
      regionIds: input.idRegional,
      statusIds: input.idStatus,
      municipalityIds: input.idMunicipio,
      groupIds: input.idGrupo,
      typeIds: input.idTipo,
      partnerIds: input.idParceira,
      workIds: input.idOvnota,
      noteIds: input.idNotaD5,
      sapStatus: input.statusD5Sap,
      createdAt: this.buildDateRange(
        'criação',
        input.dataCriacaoInicial,
        input.dataCriacaoFinal,
      ),
      completedAt: this.buildDateRange(
        'conclusão',
        input.dataConclusaoInicial,
        input.dataConclusaoFinal,
      ),
    };
  }

  private buildPagination(page?: number): Pagination | undefined {
    if (page === undefined) return undefined;
    return { skip: page * PAGE_SIZE, take: PAGE_SIZE };
  }

  private buildDateRange(
    label: string,
    start?: string,
    end?: string,
  ): DateRange | undefined {
    if (!start && !end) return undefined;

    const range: DateRange = {};
    if (start) {
      range.from = moment(start).startOf('day').toDate();
    }
    if (end) {
      // dia seguinte, exclusivo: garante que o dia final é incluído por inteiro
      range.toExclusive = moment(end).startOf('day').add(1, 'day').toDate();
    }
    if (range.from && range.toExclusive && range.from >= range.toExclusive) {
      throw new BadRequestException(
        `A data inicial de ${label} não pode ser posterior à data final`,
      );
    }
    return range;
  }
}
