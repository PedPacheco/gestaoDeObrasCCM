import { BadRequestException } from '@nestjs/common';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';
import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import type { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Module mocks
// ---------------------------------------------------------------------------

const { parseTimeToDateMock } = vi.hoisted(() => ({
  parseTimeToDateMock: vi.fn(),
}));

vi.mock('src/utils/parseTimeToDate', () => ({
  parseTimeToDate: parseTimeToDateMock,
}));

vi.mock('src/domain/entities/schedules/workSchedule.entity', () => ({
  WorkSchedule: {
    create: vi.fn((props: Record<string, unknown>) => ({
      __entity: true,
      ...props,
    })),
  },
}));

const createMock = vi.mocked(WorkSchedule.create);

// ---------------------------------------------------------------------------
// Fixtures & helpers
// ---------------------------------------------------------------------------

const START = '08:00';
const FINISH = '17:30';
const START_DATE = new Date('1970-01-01T08:00:00.000Z');
const FINISH_DATE = new Date('1970-01-01T17:30:00.000Z');

const DEFAULT_PARSED: Record<string, Date | null> = {
  [START]: START_DATE,
  [FINISH]: FINISH_DATE,
};

/** Controls what parseTimeToDate returns for each input string. */
function stubParsedTimes(overrides: Record<string, Date | null> = {}) {
  const table = { ...DEFAULT_PARSED, ...overrides };
  parseTimeToDateMock.mockImplementation((time: string) =>
    time in table ? table[time] : null,
  );
}

function catchError(fn: () => unknown): Error {
  try {
    fn();
  } catch (error) {
    return error as Error;
  }
  throw new Error('Expected the function to throw, but it did not');
}

const baseInput = {
  idWork: 10,
  dataProg: '2026-11-24T00:00:00.000Z',
  startTime: START,
  finishTime: FINISH,
  prog: 4,
};

const confirmationRow = {
  id: 1,
  id_obra: 10,
  id_status_programacao: 3,
  data_prog: '2026-11-24T00:00:00.000Z',
  hora_ini: '1970-01-01T08:00:00.000Z',
  hora_ter: new Date('1970-01-01T17:30:00.000Z'),
  prog: 5,
  exec: 2,
  reprovada: false,
};

const entity = {
  id: 1,
  workId: 10,
  dataProg: new Date('2026-11-24T00:00:00.000Z'),
  prog: 5,
  exec: 3,
  observation: 'Programming note',
  equipment: 'TR-01',
  numDp: 'DP-123',
  startTime: START_DATE,
  finishTime: FINISH_DATE,
  temporaryKey: true,
  serviceType: 'Maintenance',
  chi: 12.5,
  responsibility: 'Execution owner',
  lmTeam: 1,
  lvTeam: 2,
  regulTeam: 3,
  idExecutionRestriction: 4,
  executionObservation: 'Execution note',
  idProgRestriction1: 5,
  responsibilityProg: 'Resp 1',
  responsibleName: 'Name 1',
  responsibleArea: 'Area 1',
  restrictionStatus: 'Open',
  resolutionDate: new Date('2026-12-01T00:00:00.000Z'),
  idProgRestriction2: 6,
  responsibilityProg2: 'Resp 2',
  responsibleName2: 'Name 2',
  responsibleArea2: 'Area 2',
  restrictionStatus2: 'Closed',
  resolutionDate2: new Date('2026-12-02T00:00:00.000Z'),
  idTechnical: 7,
  observationRestriction: 'Restriction note',
  rejected: false,
  userId: 42,
} as unknown as WorkSchedule;

beforeEach(() => {
  vi.clearAllMocks();
  stubParsedTimes();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('WorkScheduleMapper', () => {
  describe('toConfirmation', () => {
    it('builds the domain entity from a database row', () => {
      const result = WorkScheduleMapper.toConfirmation(confirmationRow);

      expect(createMock).toHaveBeenCalledTimes(1);
      expect(createMock).toHaveBeenCalledWith({
        id: 1,
        workId: 10,
        statusId: 3,
        dataProg: new Date('2026-11-24T00:00:00.000Z'),
        startTime: START_DATE,
        finishTime: FINISH_DATE,
        prog: 5,
        exec: 2,
        rejected: false,
      });
      expect(result).toBe(createMock.mock.results[0].value);
    });

    it('converts string and Date columns into new Date instances', () => {
      WorkScheduleMapper.toConfirmation(confirmationRow);
      const props = createMock.mock.calls[0][0];

      expect(props.dataProg).toBeInstanceOf(Date);
      expect(props.startTime).toBeInstanceOf(Date);
      expect(props.finishTime).toBeInstanceOf(Date);
      expect(props.finishTime).not.toBe(confirmationRow.hora_ter);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('maps exec to undefined when the column is %s', (_, exec) => {
      WorkScheduleMapper.toConfirmation({ ...confirmationRow, exec });

      expect(createMock.mock.calls[0][0].exec).toBeUndefined();
    });

    it('keeps exec when it is zero', () => {
      WorkScheduleMapper.toConfirmation({ ...confirmationRow, exec: 0 });

      expect(createMock.mock.calls[0][0].exec).toBe(0);
    });

    it('forwards the rejected flag from the reprovada column', () => {
      WorkScheduleMapper.toConfirmation({
        ...confirmationRow,
        reprovada: true,
      });

      expect(createMock.mock.calls[0][0].rejected).toBe(true);
    });

    it('currently yields an Invalid Date when hora_ini is null', () => {
      WorkScheduleMapper.toConfirmation({ ...confirmationRow, hora_ini: null });

      expect(
        Number.isNaN(createMock.mock.calls[0][0].startTime.getTime()),
      ).toBe(true);
    });
  });

  describe('toPersistenceUpdate', () => {
    it('maps every entity field to its database column', () => {
      expect(WorkScheduleMapper.toPersistenceUpdate(entity)).toStrictEqual({
        id: 1,
        data_prog: entity.dataProg,
        prog: 5,
        exec: 3,
        observacao_programacao: 'Programming note',
        equip_desligado: 'TR-01',
        num_dp: 'DP-123',
        hora_ini: START_DATE,
        hora_ter: FINISH_DATE,
        chave_provisoria: true,
        tipo_servico: 'Maintenance',
        chi: 12.5,
        nome_responsavel_execucao: 'Execution owner',
        equipe_linha_morta: 1,
        equipe_linha_viva: 2,
        equipe_regularizacao: 3,
        id_restricao_execucao: 4,
        observacao_execucao: 'Execution note',
        id_restricao_prog1: 5,
        responsabilidade1: 'Resp 1',
        nome_responsavel: 'Name 1',
        area_responsavel1: 'Area 1',
        status_restricao1: 'Open',
        data_resolucao1: entity.resolutionDate,
        id_restricao_prog2: 6,
        responsabilidade2: 'Resp 2',
        nome_responsavel2: 'Name 2',
        area_responsavel2: 'Area 2',
        status_restricao2: 'Closed',
        data_resolucao2: entity.resolutionDate2,
        id_tecnico: 7,
        observacao_restricao: 'Restriction note',
        reprovada: false,
        id_usuario_ultima_atualizacao: 42,
      });
    });

    it('never changes the owning work or the creator on update', () => {
      const result = WorkScheduleMapper.toPersistenceUpdate(entity);

      expect(result).not.toHaveProperty('id_obra');
      expect(result).not.toHaveProperty('id_usuario');
    });
  });

  describe('toPersistenceCreate', () => {
    it('maps the entity to the insert payload, including work and creator', () => {
      expect(WorkScheduleMapper.toPersistenceCreate(entity)).toStrictEqual({
        id_obra: 10,
        data_prog: entity.dataProg,
        prog: 5,
        equip_desligado: 'TR-01',
        num_dp: 'DP-123',
        hora_ini: START_DATE,
        hora_ter: FINISH_DATE,
        chave_provisoria: true,
        tipo_servico: 'Maintenance',
        chi: 12.5,
        equipe_linha_morta: 1,
        equipe_linha_viva: 2,
        equipe_regularizacao: 3,
        observacao_execucao: 'Execution note',
        observacao_programacao: 'Programming note',
        id_tecnico: 7,
        id_usuario: 42,
        id_usuario_ultima_atualizacao: 42,
      });
    });

    it('does not send an id so the database can generate it', () => {
      expect(WorkScheduleMapper.toPersistenceCreate(entity)).not.toHaveProperty(
        'id',
      );
    });
  });

  describe('fromCreateInput', () => {
    it('keeps the payload fields and replaces date/time strings with Date objects', () => {
      const dto = {
        ...baseInput,
        observation: 'obs',
      } as unknown as SchedulesDataDTO;

      expect(WorkScheduleMapper.fromCreateInput(dto)).toEqual({
        ...dto,
        dataProg: new Date('2026-11-24T00:00:00.000Z'),
        startTime: START_DATE,
        finishTime: FINISH_DATE,
        rejected: false,
      });
      expect(parseTimeToDateMock).toHaveBeenNthCalledWith(1, START);
      expect(parseTimeToDateMock).toHaveBeenNthCalledWith(2, FINISH);
    });

    it('always creates the schedule as not rejected', () => {
      const dto = {
        ...baseInput,
        rejected: true,
      } as unknown as SchedulesDataDTO;

      expect(WorkScheduleMapper.fromCreateInput(dto).rejected).toBe(false);
    });

    it('does not mutate the incoming payload', () => {
      const dto = { ...baseInput } as unknown as SchedulesDataDTO;

      WorkScheduleMapper.fromCreateInput(dto);

      expect(dto).toEqual(baseInput);
    });
  });

  describe('fromUpdateInput', () => {
    it.each([true, false])(
      'takes rejected=%s from the persisted record',
      (rejected) => {
        const input = { ...baseInput, id: 99 };

        expect(
          WorkScheduleMapper.fromUpdateInput(input as never, { rejected }),
        ).toEqual({
          ...input,
          dataProg: new Date('2026-11-24T00:00:00.000Z'),
          startTime: START_DATE,
          finishTime: FINISH_DATE,
          rejected,
        });
      },
    );
  });

  describe.each([
    [
      'fromCreateInput',
      (data: object) => WorkScheduleMapper.fromCreateInput(data as never),
    ],
    [
      'fromUpdateInput',
      (data: object) =>
        WorkScheduleMapper.fromUpdateInput(data as never, { rejected: false }),
    ],
  ] as const)('date parsing on %s', (_, run) => {
    it('accepts a Date instance as dataProg and returns a copy', () => {
      const dataProg = new Date('2026-11-24T00:00:00.000Z');

      const result = run({ ...baseInput, dataProg });

      expect(result.dataProg).toEqual(dataProg);
      expect(result.dataProg).not.toBe(dataProg);
    });

    it.each([
      ['an unparseable string', 'not-a-date'],
      ['an Invalid Date instance', new Date(Number.NaN)],
    ])('throws BadRequestException when dataProg is %s', (_, dataProg) => {
      const error = catchError(() => run({ ...baseInput, dataProg }));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Data de programação inválida');
    });

    it.each([
      ['cannot be parsed', null],
      ['is parsed into an Invalid Date', new Date(Number.NaN)],
    ])('throws BadRequestException when the start time %s', (_, parsed) => {
      stubParsedTimes({ [START]: parsed });

      const error = catchError(() => run(baseInput));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Hora de início inválida');
    });

    it.each([
      ['cannot be parsed', null],
      ['is parsed into an Invalid Date', new Date(Number.NaN)],
    ])('throws BadRequestException when the finish time %s', (_, parsed) => {
      stubParsedTimes({ [FINISH]: parsed });

      const error = catchError(() => run(baseInput));

      expect(error).toBeInstanceOf(BadRequestException);
      expect(error.message).toBe('Hora de término inválida');
    });

    it('reports the invalid date before invalid times', () => {
      stubParsedTimes({ [START]: null, [FINISH]: null });

      const error = catchError(() =>
        run({ ...baseInput, dataProg: 'not-a-date' }),
      );

      expect(error.message).toBe('Data de programação inválida');
    });

    it('reports the invalid start time before the invalid finish time', () => {
      stubParsedTimes({ [START]: null, [FINISH]: null });

      const error = catchError(() => run(baseInput));

      expect(error.message).toBe('Hora de início inválida');
    });
  });
});
