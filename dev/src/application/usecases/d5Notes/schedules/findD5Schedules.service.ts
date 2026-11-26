import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5Notes/d5NotesScheduleMapper';
import type {
  D5NoteScheduleOutput,
  D5NoteTimeInfo,
  D5RejectionListItemOutput,
  D5SchedulesFilterInput,
  D5SchedulesListOutput,
  D5SchedulesTotalsOutput,
} from 'src/application/types';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import type {
  D5ScheduleFilter,
  D5ScheduleState,
  D5ScheduleWithNote,
  DateRange,
  NoteScheduledWork,
  Pagination,
} from 'src/domain/types';

const PAGE_SIZE = 200;
const PERIOD_FORMAT = 'DD/MM/YYYY';
const MAX_PROGRAMMED_PERCENT = 100;

@Injectable()
export class FindD5SchedulesService {
  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private readonly d5SchedulesRepository: ID5NotesSchedulesRepository,
    private readonly timeMetrics: TimeMetricsService,
  ) {}

  async findD5NotesSchedules(
    input: D5SchedulesFilterInput,
  ): Promise<D5SchedulesListOutput> {
    const filter = this.toFilter(input);

    const [schedules, notes] = await Promise.all([
      this.d5SchedulesRepository.get(filter, this.buildPagination(input.page)),
      this.d5SchedulesRepository.getTotals(filter),
    ]);

    return {
      d5Notes: D5NoteScheduleMapper.toListItems(schedules, (item) =>
        this.timeInfoOf(item),
      ),
      totals: this.buildTotals(notes),
    };
  }

  async findByD5NoteId(noteId: number): Promise<D5NoteScheduleOutput[]> {
    const schedules = await this.d5SchedulesRepository.getByD5NoteId(noteId);
    return D5NoteScheduleMapper.toResponseList(schedules);
  }

  async findRejectionsByD5Note(
    noteId: number,
  ): Promise<D5RejectionListItemOutput[]> {
    const rejections = await this.d5SchedulesRepository.findRejections(noteId);
    return D5NoteScheduleMapper.toRejectionsResponseList(rejections);
  }

  // ─── Output ─────────────────────────────────────────────────────────

  private timeInfoOf(item: D5ScheduleWithNote): D5NoteTimeInfo {
    const tm = this.timeMetrics.calculateTM(
      item.note.createdAt,
      item.note.completedAt,
    );
    return {
      ...tm,
      statusPrazo: this.timeMetrics.calculateStatus(tm.tmAberto),
    };
  }

  /** 6e: cálculo passa para domain/rules. */
  private buildTotals(notes: NoteScheduledWork[]): D5SchedulesTotalsOutput {
    return notes.reduce(
      (acc, note) => {
        const sum = note.progs.reduce((total, p) => total + p, 0);
        acc.total += note.progs.length;
        acc.totalMoRetida += note.moRetida;
        acc.totalMoProgramada +=
          note.moRetida *
          (Math.min(sum, MAX_PROGRAMMED_PERCENT) / MAX_PROGRAMMED_PERCENT);
        return acc;
      },
      { total: 0, totalMoRetida: 0, totalMoProgramada: 0 },
    );
  }

  // ─── Filtros (antigo buildWhereClause) ──────────────────────────────

  private toFilter(input: D5SchedulesFilterInput): D5ScheduleFilter {
    return {
      scheduledDate: this.buildPeriod(input.dataInicial, input.dataFinal),
      note: {
        regionIds: input.idRegional,
        municipalityIds: input.idMunicipio,
        groupIds: input.idGrupo,
        typeIds: input.idTipo,
        partnerIds: input.idParceira,
        workIds: input.idOvnota,
        sapStatus: input.statusSap,
      },
      noteIds: input.idNotaD5,
      scheduleIds: input.id,
      state: {
        states: this.resolveStates(input),
        // início do dia de hoje, na data local, guardado como meia-noite UTC
        today: moment.utc(moment().format('YYYY-MM-DD')).toDate(),
      },
    };
  }

  /** Sem nenhum filtro de estado: programações futuras, sem execução e não reprovadas. */
  private resolveStates(input: D5SchedulesFilterInput): D5ScheduleState[] {
    const states: D5ScheduleState[] = [];
    if (input.reprovada) states.push('rejected');
    if (input.executado) states.push('executed');
    if (input.pendente) states.push('pending');
    return states.length ? states : ['upcoming'];
  }

  /** O período só é aplicado quando as duas datas são enviadas (igual ao atual). */
  private buildPeriod(start?: string, end?: string): DateRange | undefined {
    if (!start || !end) return undefined;
    return {
      from: moment.utc(start, PERIOD_FORMAT).startOf('day').toDate(),
      toExclusive: moment
        .utc(end, PERIOD_FORMAT)
        .startOf('day')
        .add(1, 'day')
        .toDate(),
    };
  }

  private buildPagination(page?: number): Pagination | undefined {
    if (page === undefined) return undefined;
    return { skip: page * PAGE_SIZE, take: PAGE_SIZE };
  }
}
