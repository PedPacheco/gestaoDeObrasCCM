import { BadRequestException } from '@nestjs/common';
import { toD5NoteInScheduleOutput } from 'src/application/mappers/d5Notes/d5NotesMapper';
import {
  D5NoteScheduleMapper,
  type D5ScheduleUpdateContext,
} from 'src/application/mappers/d5Notes/d5NotesScheduleMapper';
import type {
  CreateD5ScheduleInput,
  D5NoteTimeInfo,
  UpdateD5ScheduleInput,
} from 'src/application/types';
import type { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import { isDocumentMissing } from 'src/domain/services/requireDpNumber.service';
import type {
  D5ScheduleDetail,
  D5ScheduleRejection,
  D5ScheduleRejectionSource,
  D5ScheduleWithNote,
} from 'src/domain/types';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/application/mappers/d5Notes/d5NotesMapper', () => ({
  toD5NoteInScheduleOutput: vi.fn(),
}));

vi.mock('src/domain/services/requireDpNumber.service', () => ({
  isDocumentMissing: vi.fn(),
}));

vi.mock('src/utils/parseTimeToDate', () => ({
  parseTimeToDate: vi.fn(),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

/** Converte "HH:mm" numa data fixa em UTC, sem depender do fuso. */
const timeOf = (hhmm: string) => new Date(`2026-01-01T${hhmm}:00.000Z`);

const CURRENT_DATE = new Date('2026-11-10T00:00:00.000Z');
const CURRENT_START = timeOf('07:00');
const CURRENT_FINISH = timeOf('11:00');

const currentProps = {
  id: 5,
  d5NoteId: 10,
  creatorUserId: 3,
  modifyingUserId: 3,
  dataProg: CURRENT_DATE,
  startTime: CURRENT_START,
  finishTime: CURRENT_FINISH,
  prog: 50,
  exec: null,
  observation: 'current observation',
  numDp: 'DP-1',
  serviceType: 'LV',
  lmTeam: 1,
  lvTeam: 0,
  regulTeam: 0,
  temporaryKey: false,
  idTechnical: 7,
  idExecutionRestriction: 8,
  responsibility: 'Current owner',
  rejected: true,
  fiscalization: false,
  filePaths: ['old.pdf'],
};

const makeCurrent = () =>
  ({
    ...currentProps,
    toPublicProps: vi.fn(() => ({ ...currentProps })),
  }) as unknown as D5NoteSchedule;

const makeContext = (current = makeCurrent()): D5ScheduleUpdateContext => ({
  id: 5,
  d5NoteId: 10,
  creatorUserId: 3,
  modifyingUserId: 9,
  filePaths: ['kept.pdf', 'new.pdf'],
  current,
});

const scheduleFields = {
  scheduledDate: new Date('2026-11-20T00:00:00.000Z'),
  startTime: timeOf('08:00'),
  endTime: timeOf('12:00'),
  planned: 40,
  executed: 30,
  lmTeams: 1,
  lvTeams: 2,
  regTeams: 3,
  provisionalKey: true,
  chi: 120,
  dpNumber: 'DP-9',
  serviceType: 'LM',
  scheduleNote: 'schedule note',
};

const TIME_INFO: D5NoteTimeInfo = {
  tmAberto: 5,
  tmExecucao: 2,
  statusPrazo: 'NO PRAZO',
};

// ─── Suite ────────────────────────────────────────────────────────────

describe('D5NoteScheduleMapper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(parseTimeToDate).mockImplementation(((value?: string) =>
      value ? timeOf(value) : undefined) as never);
    vi.mocked(isDocumentMissing).mockReturnValue(false);
    vi.mocked(toD5NoteInScheduleOutput).mockImplementation(
      (note, time) => ({ id: note.id, nota_d5: 'NOTE', ...time }) as never,
    );
  });

  // ═══ fromCreateInput ════════════════════════════════════════════════

  describe('fromCreateInput', () => {
    const input = {
      d5NoteId: 10,
      scheduledDate: '2026-11-20',
      prog: 40,
      startTime: '08:00',
      endTime: '12:00',
      lmTeam: 1,
      serviceType: 'LV',
      technicalId: 7,
      restrictionId: 8,
      restrictionResponsible: 'Owner',
      creatorUserId: 3,
      modifyingUserId: 3,
    } as CreateD5ScheduleInput;

    it('maps the input to the entity props with converted dates and renamed fields', () => {
      const result = D5NoteScheduleMapper.fromCreateInput(input);

      expect(result).toEqual({
        d5NoteId: 10,
        prog: 40,
        lmTeam: 1,
        serviceType: 'LV',
        creatorUserId: 3,
        modifyingUserId: 3,
        dataProg: new Date('2026-11-20'),
        startTime: timeOf('08:00'),
        finishTime: timeOf('12:00'),
        idTechnical: 7,
        idExecutionRestriction: 8,
        responsibility: 'Owner',
        rejected: false,
        filePaths: [],
      });
      expect(parseTimeToDate).toHaveBeenCalledWith('08:00');
      expect(parseTimeToDate).toHaveBeenCalledWith('12:00');
    });

    it('drops the input-only field names from the props', () => {
      const result = D5NoteScheduleMapper.fromCreateInput(input);

      for (const key of [
        'scheduledDate',
        'endTime',
        'technicalId',
        'restrictionId',
        'restrictionResponsible',
      ]) {
        expect(result).not.toHaveProperty(key);
      }
    });

    it('leaves the schedule date undefined when it is empty', () => {
      const result = D5NoteScheduleMapper.fromCreateInput({
        ...input,
        scheduledDate: '',
      });

      expect(result.dataProg).toBeUndefined();
    });

    it('throws BadRequestException when the schedule date is invalid', () => {
      expect(() =>
        D5NoteScheduleMapper.fromCreateInput({
          ...input,
          scheduledDate: 'not-a-date',
        }),
      ).toThrow(new BadRequestException('Data de programação inválida'));
    });
  });

  // ═══ fromUpdateInput ════════════════════════════════════════════════

  describe('fromUpdateInput', () => {
    it('keeps every current value when the input is empty', () => {
      const context = makeContext();

      const result = D5NoteScheduleMapper.fromUpdateInput({}, context);

      expect(context.current.toPublicProps).toHaveBeenCalledTimes(1);
      expect(result).toEqual({
        ...currentProps,
        id: 5,
        d5NoteId: 10,
        creatorUserId: 3,
        modifyingUserId: 9,
        filePaths: ['kept.pdf', 'new.pdf'],
        dataProg: CURRENT_DATE,
        startTime: CURRENT_START,
        finishTime: CURRENT_FINISH,
        idTechnical: 7,
        idExecutionRestriction: 8,
        responsibility: 'Current owner',
        rejected: false,
      });
      expect(parseTimeToDate).not.toHaveBeenCalled();
    });

    it('applies every field sent in the input', () => {
      const input: UpdateD5ScheduleInput = {
        scheduledDate: '2026-12-01',
        startTime: '09:00',
        endTime: '13:00',
        technicalId: 70,
        restrictionId: 80,
        restrictionResponsible: 'New owner',
        rejected: true,
        prog: 90,
        observation: 'new observation',
      };

      const result = D5NoteScheduleMapper.fromUpdateInput(input, makeContext());

      expect(result).toMatchObject({
        dataProg: new Date('2026-12-01'),
        startTime: timeOf('09:00'),
        finishTime: timeOf('13:00'),
        idTechnical: 70,
        idExecutionRestriction: 80,
        responsibility: 'New owner',
        rejected: true,
        prog: 90,
        observation: 'new observation',
      });
    });

    it('takes the identifiers, users and files from the context, not from the current props', () => {
      const result = D5NoteScheduleMapper.fromUpdateInput(
        {},
        {
          ...makeContext(),
          id: 99,
          d5NoteId: 77,
          creatorUserId: undefined,
          modifyingUserId: 11,
          filePaths: [],
        },
      );

      expect(result).toMatchObject({
        id: 99,
        d5NoteId: 77,
        creatorUserId: undefined,
        modifyingUserId: 11,
        filePaths: [],
      });
    });

    it('ignores undefined fields instead of overwriting the current values', () => {
      const result = D5NoteScheduleMapper.fromUpdateInput(
        { prog: undefined, observation: 'only this changes' },
        makeContext(),
      );

      expect(result.prog).toBe(50);
      expect(result.observation).toBe('only this changes');
    });

    it('falls back to the current date when the schedule date is empty', () => {
      const result = D5NoteScheduleMapper.fromUpdateInput(
        { scheduledDate: '' },
        makeContext(),
      );

      expect(result.dataProg).toBe(CURRENT_DATE);
    });

    it('throws BadRequestException when the schedule date is invalid', () => {
      expect(() =>
        D5NoteScheduleMapper.fromUpdateInput(
          { scheduledDate: 'invalid' },
          makeContext(),
        ),
      ).toThrow(new BadRequestException('Data de programação inválida'));
    });

    it('resets the rejected flag to false when it is not sent', () => {
      const result = D5NoteScheduleMapper.fromUpdateInput(
        { prog: 60 },
        makeContext(),
      );

      expect(result.rejected).toBe(false);
    });

    it('does not carry the kept files list into the entity props', () => {
      const result = D5NoteScheduleMapper.fromUpdateInput(
        { keptFiles: ['kept.pdf'] },
        makeContext(),
      );

      expect(result).not.toHaveProperty('keptFiles');
      expect(result.filePaths).toEqual(['kept.pdf', 'new.pdf']);
    });
  });

  // ═══ toRejectionData ════════════════════════════════════════════════

  describe('toRejectionData', () => {
    it('copies the schedule fields and adds the rejection context', () => {
      const source = {
        ...scheduleFields,
        d5NoteId: 10,
      } as D5ScheduleRejectionSource;

      const result = D5NoteScheduleMapper.toRejectionData(source, {
        restrictionId: 4,
        description: 'Missing team',
        rejectingUserId: 12,
      });

      expect(result).toEqual({
        d5NoteId: 10,
        description: 'Missing team',
        scheduledDate: scheduleFields.scheduledDate,
        planned: 40,
        startTime: scheduleFields.startTime,
        endTime: scheduleFields.endTime,
        lmTeams: 1,
        lvTeams: 2,
        regTeams: 3,
        provisionalKey: true,
        chi: 120,
        dpNumber: 'DP-9',
        serviceType: 'LM',
        scheduleNote: 'schedule note',
        rejectedByUserId: 12,
        restrictionId: 4,
      });
    });
  });

  // ═══ toResponse / toResponseList ════════════════════════════════════

  describe('toResponse', () => {
    const detail = {
      ...scheduleFields,
      id: 5,
      d5NoteId: 10,
      createdAt: new Date('2026-11-01T10:00:00.000Z'),
      executionNote: 'done',
      restrictionOwner: 'Owner',
      creatorName: 'Ana',
      modifierName: 'Rui',
      restriction: { id: 8, name: 'Weather' },
      technician: { id: 7, name: 'João' },
      filePaths: ['a.pdf'],
      rejected: false,
      inspection: true,
    } as D5ScheduleDetail;

    it('maps the schedule detail to the API format', () => {
      expect(D5NoteScheduleMapper.toResponse(detail)).toEqual({
        id: 5,
        id_nota_d5: 10,
        criado_em: detail.createdAt,
        data_prog: scheduleFields.scheduledDate,
        hora_ini: scheduleFields.startTime,
        hora_ter: scheduleFields.endTime,
        prog: 40,
        exec: 30,
        equipe_lm: 1,
        equipe_lv: 2,
        equipe_reg: 3,
        chave_provisoria: true,
        chi: 120,
        num_dp: 'DP-9',
        tipo_servico: 'LM',
        observacao_execucao: 'done',
        observacao_programacao: 'schedule note',
        usuarioModificador: 'Rui',
        usuarioCriador: 'Ana',
        idTecnico: 7,
        tecnico: 'João',
        idRestricao: 8,
        restricao: 'Weather',
        responsavel_restricao: 'Owner',
        caminhos_arquivos: ['a.pdf'],
        reprovada: false,
        fiscalizacao: true,
      });
    });

    it('returns null for the technician and restriction when they are missing', () => {
      const result = D5NoteScheduleMapper.toResponse({
        ...detail,
        technician: null,
        restriction: null,
      });

      expect(result).toMatchObject({
        idTecnico: null,
        tecnico: null,
        idRestricao: null,
        restricao: null,
      });
    });

    it('maps a list of schedule details', () => {
      const result = D5NoteScheduleMapper.toResponseList([
        detail,
        { ...detail, id: 6 },
      ]);

      expect(result.map((r) => r.id)).toEqual([5, 6]);
    });

    it('returns an empty list for no schedules', () => {
      expect(D5NoteScheduleMapper.toResponseList([])).toEqual([]);
    });
  });

  // ═══ toListItem / toListItems ═══════════════════════════════════════

  describe('toListItem', () => {
    const item = {
      ...scheduleFields,
      technicianName: 'João',
      note: { id: 10 },
    } as unknown as D5ScheduleWithNote;

    it('combines the schedule fields with the note output', () => {
      const result = D5NoteScheduleMapper.toListItem(item, TIME_INFO);

      expect(isDocumentMissing).toHaveBeenCalledWith('DP-9', 'LM');
      expect(toD5NoteInScheduleOutput).toHaveBeenCalledWith(
        item.note,
        TIME_INFO,
      );
      expect(result).toEqual({
        data_prog: scheduleFields.scheduledDate,
        hora_ini: scheduleFields.startTime,
        hora_ter: scheduleFields.endTime,
        prog: 40,
        exec: 30,
        equipe_lm: 1,
        equipe_lv: 2,
        equipe_reg: 3,
        chave_provisoria: true,
        chi: 120,
        num_dp: 'DP-9',
        tipo_servico: 'LM',
        observacao_programacao: 'schedule note',
        precisaDp: false,
        tecnico: 'João',
        id: 10,
        nota_d5: 'NOTE',
        ...TIME_INFO,
      });
    });

    it('flags the schedule when the DP document is missing', () => {
      vi.mocked(isDocumentMissing).mockReturnValue(true);

      expect(D5NoteScheduleMapper.toListItem(item, TIME_INFO).precisaDp).toBe(
        true,
      );
    });

    it('computes the time metrics for each item of the list', () => {
      const second = {
        ...item,
        note: { id: 11 },
      } as unknown as D5ScheduleWithNote;
      const getTimeMetrics = vi.fn((i: D5ScheduleWithNote) => ({
        ...TIME_INFO,
        tmAberto: (i.note as { id: number }).id,
      }));

      const result = D5NoteScheduleMapper.toListItems(
        [item, second],
        getTimeMetrics,
      );

      expect(getTimeMetrics).toHaveBeenNthCalledWith(1, item);
      expect(getTimeMetrics).toHaveBeenNthCalledWith(2, second);
      expect(result.map((r) => r.tmAberto)).toEqual([10, 11]);
    });

    it('returns an empty list without computing metrics', () => {
      const getTimeMetrics = vi.fn();

      expect(D5NoteScheduleMapper.toListItems([], getTimeMetrics)).toEqual([]);
      expect(getTimeMetrics).not.toHaveBeenCalled();
    });
  });

  // ═══ toRejectionResponse / toRejectionsResponseList ═════════════════

  describe('toRejectionResponse', () => {
    const rejection = {
      id: 3,
      rejectedAt: new Date('2026-11-15T09:00:00.000Z'),
      scheduledDate: scheduleFields.scheduledDate,
      startTime: scheduleFields.startTime,
      endTime: scheduleFields.endTime,
      planned: 40,
      description: 'Missing team',
      lmTeams: 1,
      lvTeams: 2,
      regTeams: 3,
      serviceType: 'LM',
      provisionalKey: true,
      chi: 120,
      dpNumber: 'DP-9',
      scheduleNote: 'schedule note',
      restriction: 'Weather',
      rejectedBy: 'Rui',
    } as D5ScheduleRejection;

    it('maps the rejection to the API format', () => {
      expect(D5NoteScheduleMapper.toRejectionResponse(rejection)).toEqual({
        id: 3,
        dataReprovacao: rejection.rejectedAt,
        dataProgramacao: scheduleFields.scheduledDate,
        horaInicio: scheduleFields.startTime,
        horaTermino: scheduleFields.endTime,
        programacao: 40,
        descricao: 'Missing team',
        tipoServico: 'LM',
        chaveProvisoria: true,
        chi: 120,
        numDp: 'DP-9',
        observacaoProgramacao: 'schedule note',
        equipeLm: 1,
        equipeLv: 2,
        equipeReg: 3,
        restricao: 'Weather',
        reprovadoPor: 'Rui',
      });
    });

    it('maps a list of rejections', () => {
      const result = D5NoteScheduleMapper.toRejectionsResponseList([
        rejection,
        { ...rejection, id: 4, rejectedBy: null },
      ]);

      expect(result.map((r) => [r.id, r.reprovadoPor])).toEqual([
        [3, 'Rui'],
        [4, null],
      ]);
    });
  });
});
