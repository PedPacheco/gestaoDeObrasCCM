import { BadRequestException } from '@nestjs/common';
import {
  BaseSchedule,
  BaseScheduleProps,
} from 'src/domain/entities/schedules/baseSchedule.entity';

// ---------------------------------------------------------------------------
// Subclasse concreta mínima: a base é abstrata e o construtor é protected.
// Como a base não chama validate() no construtor, a subclasse o faz (igual
// às subclasses reais).
// ---------------------------------------------------------------------------
const specificSpy = jest.fn();

class TestSchedule extends BaseSchedule {
  constructor(props: BaseScheduleProps) {
    super(props);
    this.validate();
  }

  protected validateSpecific(): void {
    specificSpy();
  }

  // Expõe membros protected para teste
  public exposeCheckTypeOfService(): boolean {
    return this.checkTypeOfService();
  }

  public exposeBaseProps(): BaseScheduleProps {
    return this.baseProps();
  }
}

const START = new Date('2026-01-15T08:00:00.000Z');
const FINISH = new Date('2026-01-15T17:00:00.000Z');

const makeProps = (
  overrides: Partial<BaseScheduleProps> = {},
): BaseScheduleProps => ({
  dataProg: new Date('2026-01-15T00:00:00.000Z'),
  prog: 50,
  ...overrides,
});

const build = (overrides: Partial<BaseScheduleProps> = {}) =>
  new TestSchedule(makeProps(overrides));

const expectBadRequest = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(message);
};

describe('BaseSchedule', () => {
  beforeEach(() => specificSpy.mockClear());

  // -------------------------------------------------------------------------
  // Construção e valores padrão
  // -------------------------------------------------------------------------
  describe('construção', () => {
    it('deve aplicar os valores padrão quando os opcionais são omitidos', () => {
      const entity = build();

      expect(entity.lmTeam).toBe(0);
      expect(entity.regulTeam).toBe(0);
      expect(entity.lvTeam).toBe(0);
      expect(entity.temporaryKey).toBe(false);
      expect(entity.idTechnical).toBe(1);
      expect(entity.idExecutionRestriction).toBe(1);
    });

    it('deve preservar os valores informados em vez dos padrões', () => {
      const entity = build({
        id: 5,
        exec: 30,
        lmTeam: 2,
        regulTeam: 3,
        lvTeam: 4,
        temporaryKey: true,
        idTechnical: 9,
        idExecutionRestriction: 7,
        observation: 'obs',
        executionObservation: 'obs exec',
        serviceType: 'X',
        chi: 12,
        responsibility: 'resp',
      });

      expect(entity).toMatchObject({
        id: 5,
        exec: 30,
        lmTeam: 2,
        regulTeam: 3,
        lvTeam: 4,
        temporaryKey: true,
        idTechnical: 9,
        idExecutionRestriction: 7,
        observation: 'obs',
        executionObservation: 'obs exec',
        serviceType: 'X',
        chi: 12,
        responsibility: 'resp',
      });
    });

    it('não deve validar automaticamente no construtor da base', () => {
      // A base só expõe validate(); quem chama é a subclasse (aqui, TestSchedule)
      expect(() => build()).not.toThrow();
      expect(specificSpy).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------------------------
  // validate — programado
  // -------------------------------------------------------------------------
  describe('validação de prog', () => {
    it.each([
      ['negativo', -1],
      ['acima de 100', 101],
    ])('deve rejeitar prog %s', (_label, prog) => {
      expectBadRequest(
        () => build({ prog }),
        'Programado deve estar entre 0 e 100',
      );
    });

    it.each([
      ['mínimo', 0],
      ['máximo', 100],
    ])('deve aceitar prog no limite %s', (_label, prog) => {
      expect(() => build({ prog })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validate — executado
  // -------------------------------------------------------------------------
  describe('validação de exec', () => {
    it.each([
      ['negativo', -1],
      ['acima de 100', 101],
    ])('deve rejeitar exec %s', (_label, exec) => {
      expectBadRequest(
        () => build({ exec }),
        'Executado deve estar entre 0 e 100',
      );
    });

    it.each([
      ['omitido', undefined],
      ['mínimo', 0],
      ['máximo', 100],
    ])('deve aceitar exec %s', (_label, exec) => {
      expect(() => build({ exec })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validate — janela horária
  // -------------------------------------------------------------------------
  describe('validação de horários', () => {
    it('deve rejeitar fim igual ao início', () => {
      expectBadRequest(
        () => build({ startTime: START, finishTime: START }),
        'Horário de fim deve ser posterior ao início',
      );
    });

    it('deve rejeitar fim anterior ao início', () => {
      expectBadRequest(
        () => build({ startTime: FINISH, finishTime: START }),
        'Horário de fim deve ser posterior ao início',
      );
    });

    it('deve aceitar fim posterior ao início', () => {
      expect(() =>
        build({ startTime: START, finishTime: FINISH }),
      ).not.toThrow();
    });

    it.each([
      ['apenas início', { startTime: START }],
      ['apenas término', { finishTime: FINISH }],
      ['nenhum', {}],
    ])('não deve comparar horários quando há %s', (_label, times) => {
      expect(() => build(times)).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validate — tamanho do numDp
  // -------------------------------------------------------------------------
  describe('validação do tamanho de numDp', () => {
    it('deve rejeitar numDp com mais de 8 caracteres', () => {
      expectBadRequest(
        () => build({ numDp: '123456789' }),
        'Número do DP deve ter no máximo 8 caracteres',
      );
    });

    it.each([
      ['exatamente 8 caracteres (limite)', '12345678'],
      ['vazio', ''],
      ['omitido', undefined],
    ])('deve aceitar numDp %s', (_label, numDp) => {
      expect(() => build({ numDp })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validate — template method
  // -------------------------------------------------------------------------
  describe('template method', () => {
    it('deve chamar validateSpecific após as regras comuns', () => {
      build();

      expect(specificSpy).toHaveBeenCalledTimes(1);
    });

    it('não deve chamar validateSpecific quando uma regra comum falha', () => {
      expect(() => build({ prog: 101 })).toThrow(BadRequestException);
      expect(specificSpy).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------------------------
  // checkTypeOfService
  // -------------------------------------------------------------------------
  describe('checkTypeOfService', () => {
    it.each([
      ['omitido', undefined, false],
      ['vazio', '', false],
      ['sem DP', 'MANUTENCAO', false],
      ['com DP', 'DP', true],
      ['com dp em minúsculas', 'servico dp', true],
    ])('serviceType %s', (_label, serviceType, expected) => {
      expect(build({ serviceType }).exposeCheckTypeOfService()).toBe(expected);
    });
  });

  // -------------------------------------------------------------------------
  // validateDpNumber
  // -------------------------------------------------------------------------
  describe('validateDpNumber', () => {
    it.each([
      ['omitido', undefined],
      ['sem DP', 'MANUTENCAO'],
    ])('não deve exigir número do DP quando serviceType é %s', (_l, type) => {
      const entity = build({ serviceType: type, numDp: undefined });

      expect(() => entity.validateDpNumber()).not.toThrow();
    });

    it.each([
      ['omitido', undefined],
      ['vazio', ''],
      ['apenas espaços', '   '],
      ['zero', '0'],
    ])('deve exigir número quando serviço é DP e numDp é %s', (_l, numDp) => {
      const entity = build({ serviceType: 'DP', numDp });

      expectBadRequest(
        () => entity.validateDpNumber(),
        'Falta inserir número do DP',
      );
    });

    it.each([
      ['menos de 8 dígitos', '1234567'],
      ['com letras', 'ABCDEFGH'],
    ])('deve rejeitar numDp %s', (_label, numDp) => {
      const entity = build({ serviceType: 'DP', numDp });

      expectBadRequest(
        () => entity.validateDpNumber(),
        'Número do DP deve conter exatamente 8 dígitos',
      );
    });

    it('deve aceitar numDp com exatamente 8 dígitos', () => {
      const entity = build({ serviceType: 'DP', numDp: '12345678' });

      expect(() => entity.validateDpNumber()).not.toThrow();
    });

    it('deve aplicar trim antes de comparar com "0"', () => {
      // 8 caracteres (dentro do limite de validate()), mas "0" após o trim
      const entity = build({ serviceType: 'DP', numDp: '   0    ' });

      expectBadRequest(
        () => entity.validateDpNumber(),
        'Falta inserir número do DP',
      );
    });
  });

  // -------------------------------------------------------------------------
  // baseProps
  // -------------------------------------------------------------------------
  describe('baseProps', () => {
    it('deve devolver todos os campos, incluindo os padrões aplicados', () => {
      const dataProg = new Date('2026-01-15T00:00:00.000Z');
      const props = build({ dataProg, prog: 40, id: 3 }).exposeBaseProps();

      expect(props).toEqual({
        dataProg,
        prog: 40,
        id: 3,
        exec: undefined,
        startTime: undefined,
        finishTime: undefined,
        observation: undefined,
        executionObservation: undefined,
        serviceType: undefined,
        numDp: undefined,
        chi: undefined,
        lmTeam: 0,
        regulTeam: 0,
        lvTeam: 0,
        temporaryKey: false,
        idTechnical: 1,
        idExecutionRestriction: 1,
        responsibility: undefined,
      });
    });

    it('deve permitir reconstruir uma instância equivalente', () => {
      const original = build({ id: 2, exec: 10, lmTeam: 3 });
      const rebuilt = new TestSchedule(original.exposeBaseProps());

      expect(rebuilt.exposeBaseProps()).toEqual(original.exposeBaseProps());
    });
  });
});
