import moment from 'moment';
import { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import { DeadlineStatus } from 'src/domain/services/deadlineStatus.service';

const FIXED_NOW = new Date('2026-10-22T10:00:00.000Z');

describe('TimeMetricsService', () => {
  let service: TimeMetricsService;

  beforeEach(() => {
    vi.useFakeTimers().setSystemTime(FIXED_NOW);
    service = new TimeMetricsService();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  // ---------------------------------------------------------------------------
  // calculateTM
  // ---------------------------------------------------------------------------
  describe('calculateTM', () => {
    describe('sem data inicial', () => {
      it.each([
        ['null', null],
        ['undefined', undefined],
        ['string vazia', ''],
      ])('deve devolver nulls quando initialDate é %s', (_label, value) => {
        expect(service.calculateTM(value as any, null)).toEqual({
          tmAberto: null,
          tmExecucao: null,
        });
      });

      it('deve devolver nulls mesmo quando há data de execução', () => {
        expect(
          service.calculateTM(null, new Date('2026-10-20T00:00:00Z')),
        ).toEqual({ tmAberto: null, tmExecucao: null });
      });
    });

    describe('nota em aberto (sem data de execução)', () => {
      it('deve calcular os dias desde a data inicial até hoje', () => {
        expect(
          service.calculateTM(new Date('2026-10-16T00:00:00Z'), null),
        ).toEqual({ tmAberto: 6, tmExecucao: null });
      });

      it.each([
        ['null', null],
        ['undefined', undefined],
      ])(
        'deve tratar executionDate %s como nota em aberto',
        (_label, value) => {
          expect(
            service.calculateTM(new Date('2026-10-16T00:00:00Z'), value),
          ).toEqual({ tmAberto: 6, tmExecucao: null });
        },
      );

      it('deve devolver 0 quando a nota foi aberta hoje', () => {
        expect(
          service.calculateTM(new Date('2026-10-22T08:00:00Z'), null),
        ).toEqual({ tmAberto: 0, tmExecucao: null });
      });

      it('deve contar dias de calendário e ignorar a hora', () => {
        // Aberta ontem às 23:59 e consultada hoje às 10:00: conta como 1 dia
        expect(
          service.calculateTM(new Date('2026-10-21T23:59:59Z'), null),
        ).toEqual({ tmAberto: 1, tmExecucao: null });
      });

      it('deve usar referenceDate quando é informada', () => {
        expect(
          service.calculateTM(
            new Date('2026-10-16T00:00:00Z'),
            null,
            new Date('2026-10-30T15:00:00Z'),
          ),
        ).toEqual({ tmAberto: 14, tmExecucao: null });
      });

      it('deve devolver valor negativo quando a data inicial é futura', () => {
        expect(
          service.calculateTM(new Date('2026-10-25T00:00:00Z'), null),
        ).toEqual({ tmAberto: -3, tmExecucao: null });
      });
    });

    describe('nota concluída (com data de execução)', () => {
      it('deve calcular os dias entre a data inicial e a de execução', () => {
        expect(
          service.calculateTM(
            new Date('2026-01-01T00:00:00Z'),
            new Date('2026-01-06T18:45:00Z'),
          ),
        ).toEqual({ tmAberto: null, tmExecucao: 5 });
      });

      it('deve devolver 0 quando é concluída no mesmo dia', () => {
        expect(
          service.calculateTM(
            new Date('2026-10-10T08:00:00Z'),
            new Date('2026-10-10T22:00:00Z'),
          ),
        ).toEqual({ tmAberto: null, tmExecucao: 0 });
      });

      it('deve ignorar a data atual e a referenceDate', () => {
        expect(
          service.calculateTM(
            new Date('2026-01-01T00:00:00Z'),
            new Date('2026-01-03T00:00:00Z'),
            new Date('2030-01-01T00:00:00Z'),
          ),
        ).toEqual({ tmAberto: null, tmExecucao: 2 });
      });

      it('deve devolver valor negativo quando a execução é anterior à data inicial', () => {
        expect(
          service.calculateTM(
            new Date('2026-01-10T00:00:00Z'),
            new Date('2026-01-08T00:00:00Z'),
          ),
        ).toEqual({ tmAberto: null, tmExecucao: -2 });
      });
    });

    describe('formatos e fuso horário', () => {
      it.each([
        ['Date', new Date('2026-10-16T00:00:00Z')],
        ['string ISO', '2026-10-16T00:00:00Z'],
        ['string só com data', '2026-10-16'],
        ['moment', moment.utc('2026-10-16')],
        ['timestamp', Date.UTC(2026, 9, 16)],
      ])('deve aceitar initialDate como %s', (_label, value) => {
        expect(service.calculateTM(value, null).tmAberto).toBe(6);
      });

      it('deve calcular o dia em UTC e não no fuso local', () => {
        // 21/10 às 23:30 em -03:00 corresponde a 22/10 às 02:30 em UTC
        expect(
          service.calculateTM('2026-10-21T23:30:00-03:00', null).tmAberto,
        ).toBe(0);
      });

      it('deve devolver NaN quando a data inicial é inválida', () => {
        expect(
          service.calculateTM(new Date('data-invalida'), null).tmAberto,
        ).toBeNaN();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // calculateStatus
  // ---------------------------------------------------------------------------
  describe('calculateStatus', () => {
    it.each([
      [0, `${DeadlineStatus.ON_TIME}: 0 dia(s) restante(s)`],
      [1, `${DeadlineStatus.ON_TIME}: 1 dia(s) restante(s)`],
      [3, `${DeadlineStatus.ON_TIME}: 3 dia(s) restante(s)`],
      [4, `${DeadlineStatus.ATTENTION}: 4 dia(s) restante(s)`],
      [5, `${DeadlineStatus.ATTENTION}: 5 dia(s) restante(s)`],
      [6, `${DeadlineStatus.CRITICAL}: 6 dia(s) restante(s)`],
      [7, `${DeadlineStatus.CRITICAL}: 7 dia(s) restante(s)`],
      [8, `${DeadlineStatus.OVERDUE}: 8 dia(s) acima do prazo`],
      [30, `${DeadlineStatus.OVERDUE}: 30 dia(s) acima do prazo`],
      [365, `${DeadlineStatus.OVERDUE}: 365 dia(s) acima do prazo`],
    ])('tmAberto %i deve devolver "%s"', (tmAberto, expected) => {
      expect(service.calculateStatus(tmAberto)).toBe(expected);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['NaN', NaN],
    ])('deve devolver null quando tmAberto é %s', (_label, value) => {
      expect(service.calculateStatus(value)).toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // getDeadlineInfo
  // ---------------------------------------------------------------------------
  describe('getDeadlineInfo', () => {
    it('deve devolver TM e status para uma nota em aberto', () => {
      expect(
        service.getDeadlineInfo(new Date('2026-10-16T00:00:00Z'), null),
      ).toEqual({
        tmAberto: 6,
        tmExecucao: null,
        statusPrazo: `${DeadlineStatus.CRITICAL}: 6 dia(s) restante(s)`,
      });
    });

    it('deve devolver statusPrazo null para uma nota concluída', () => {
      expect(
        service.getDeadlineInfo(
          new Date('2026-10-01T00:00:00Z'),
          new Date('2026-10-05T00:00:00Z'),
        ),
      ).toEqual({ tmAberto: null, tmExecucao: 4, statusPrazo: null });
    });

    it('deve devolver tudo null quando não há data inicial', () => {
      expect(service.getDeadlineInfo(null, null)).toEqual({
        tmAberto: null,
        tmExecucao: null,
        statusPrazo: null,
      });
    });

    it('deve devolver statusPrazo null quando a data inicial é inválida', () => {
      const result = service.getDeadlineInfo(new Date('data-invalida'), null);

      expect(result.tmAberto).toBeNaN();
      expect(result.statusPrazo).toBeNull();
    });

    it.each([
      [
        '2026-10-22T00:00:00Z',
        0,
        `${DeadlineStatus.ON_TIME}: 0 dia(s) restante(s)`,
      ],
      [
        '2026-10-19T00:00:00Z',
        3,
        `${DeadlineStatus.ON_TIME}: 3 dia(s) restante(s)`,
      ],
      [
        '2026-10-18T00:00:00Z',
        4,
        `${DeadlineStatus.ATTENTION}: 4 dia(s) restante(s)`,
      ],
      [
        '2026-10-17T00:00:00Z',
        5,
        `${DeadlineStatus.ATTENTION}: 5 dia(s) restante(s)`,
      ],
      [
        '2026-10-16T00:00:00Z',
        6,
        `${DeadlineStatus.CRITICAL}: 6 dia(s) restante(s)`,
      ],
      [
        '2026-10-15T00:00:00Z',
        7,
        `${DeadlineStatus.CRITICAL}: 7 dia(s) restante(s)`,
      ],
      [
        '2026-10-14T00:00:00Z',
        8,
        `${DeadlineStatus.OVERDUE}: 8 dia(s) acima do prazo`,
      ],
    ])(
      'nota aberta em %s deve ter tmAberto %i e status "%s"',
      (criadoEm, expectedTm, expectedStatus) => {
        expect(service.getDeadlineInfo(criadoEm, null)).toEqual({
          tmAberto: expectedTm,
          tmExecucao: null,
          statusPrazo: expectedStatus,
        });
      },
    );

    it('deve mudar de status com a passagem do tempo', () => {
      vi.useFakeTimers();
      vi.setSystemTime(new Date('2026-10-19T00:00:00Z'));

      const criadoEm = new Date('2026-10-19T00:00:00Z');

      expect(service.getDeadlineInfo(criadoEm, null).statusPrazo).toBe(
        `${DeadlineStatus.ON_TIME}: 0 dia(s) restante(s)`,
      );

      vi.setSystemTime(new Date('2026-10-23T10:00:00Z'));

      expect(service.getDeadlineInfo(criadoEm, null).statusPrazo).toBe(
        `${DeadlineStatus.ATTENTION}: 4 dia(s) restante(s)`,
      );

      vi.useRealTimers();
    });

    it('deve delegar em calculateTM e calculateStatus', () => {
      const calculateTM = vi
        .spyOn(service, 'calculateTM')
        .mockReturnValue({ tmAberto: 9, tmExecucao: null });
      const calculateStatus = vi
        .spyOn(service, 'calculateStatus')
        .mockReturnValue(DeadlineStatus.OVERDUE);

      const initial = new Date('2026-10-01T00:00:00Z');
      const result = service.getDeadlineInfo(initial, null);

      expect(calculateTM).toHaveBeenCalledWith(initial, null);
      expect(calculateStatus).toHaveBeenCalledWith(9);
      expect(result).toEqual({
        tmAberto: 9,
        tmExecucao: null,
        statusPrazo: DeadlineStatus.OVERDUE,
      });
    });
  });
});
