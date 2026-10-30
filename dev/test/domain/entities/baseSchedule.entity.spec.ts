import {
  BaseSchedule,
  BaseScheduleProps,
} from 'src/domain/entities/schedules/baseSchedule.entity';
import { describe, expect, it } from 'vitest';

// Subclasse concreta apenas para testes
class TestSchedule extends BaseSchedule {
  constructor(props: BaseScheduleProps) {
    super(props);
  }

  protected validateSpecific(): void {
    this.validateDpFormat();
  }

  public validateForTest(): void {
    this.validate();
  }

  public getDocumentRuleForTest() {
    return this.getDocumentRule();
  }

  public basePropsForTest(): BaseScheduleProps {
    return this.baseProps();
  }
}

const makeProps = (
  overrides: Partial<BaseScheduleProps> = {},
): BaseScheduleProps => ({
  dataProg: new Date('2026-01-15T10:00:00.000Z'),
  prog: 50,
  rejected: false,
  ...overrides,
});

const makeSchedule = (
  overrides: Partial<BaseScheduleProps> = {},
): TestSchedule => new TestSchedule(makeProps(overrides));

describe('BaseSchedule', () => {
  describe('construção e baseProps', () => {
    it('deve copiar as propriedades fornecidas', () => {
      const dataProg = new Date('2026-02-01T09:00:00.000Z');
      const schedule = makeSchedule({
        dataProg,
        prog: 75,
        id: 123,
        exec: 50,
        serviceType: 'dp',
        numDp: '12345678',
        rejected: true,
      });

      expect(schedule.dataProg).toBe(dataProg);
      expect(schedule.prog).toBe(75);
      expect(schedule.id).toBe(123);
      expect(schedule.exec).toBe(50);
      expect(schedule.serviceType).toBe('dp');
      expect(schedule.numDp).toBe('12345678');
      expect(schedule.rejected).toBe(true);
    });

    it('deve aplicar os valores predefinidos às propriedades opcionais', () => {
      const schedule = makeSchedule();

      expect(schedule.lmTeam).toBe(0);
      expect(schedule.regulTeam).toBe(0);
      expect(schedule.lvTeam).toBe(0);
      expect(schedule.temporaryKey).toBe(false);
      expect(schedule.idTechnical).toBe(1);
      expect(schedule.idExecutionRestriction).toBe(1);
      expect(schedule.rejected).toBe(false);
    });

    it('deve devolver as propriedades com os valores predefinidos aplicados', () => {
      const props = makeProps({
        id: 10,
        exec: 80,
        serviceType: 'lv',
        numDp: 'BRA-123456789',
        responsibility: 'Equipa técnica',
      });

      const schedule = makeSchedule(props);

      expect(schedule.basePropsForTest()).toEqual({
        ...props,
        lmTeam: 0,
        regulTeam: 0,
        lvTeam: 0,
        temporaryKey: false,
        idTechnical: 1,
        idExecutionRestriction: 1,
      });
    });
  });

  describe('getDocumentRule', () => {
    it.each([
      ['dp', 'DP'],
      ['regularização', 'DP'],
      ['desativação rd', 'DP'],
      ['lv', 'BRA'],
      ['lv + obra livre', 'BRA'],
      ['dp + lv', 'DP_OR_BRA'],
    ] as const)(
      'deve devolver a regra %s para o tipo de serviço "%s"',
      (serviceType, expectedRule) => {
        const schedule = makeSchedule({ serviceType });

        expect(schedule.getDocumentRuleForTest()).toBe(expectedRule);
      },
    );

    it('deve normalizar maiúsculas e espaços extra no tipo de serviço', () => {
      const schedule = makeSchedule({
        serviceType: '  DP  +   LV  ',
      });

      expect(schedule.getDocumentRuleForTest()).toBe('DP_OR_BRA');
    });

    it.each([undefined, '', 'outro serviço'])(
      'deve devolver null para um tipo de serviço não abrangido: %s',
      (serviceType) => {
        const schedule = makeSchedule({ serviceType });

        expect(schedule.getDocumentRuleForTest()).toBeNull();
      },
    );
  });

  describe('validate()', () => {
    it('deve aceitar prog nos limites permitidos', () => {
      expect(() => makeSchedule({ prog: 0 }).validateForTest()).not.toThrow();
      expect(() => makeSchedule({ prog: 100 }).validateForTest()).not.toThrow();
    });

    it.each([-1, 101])('deve rejeitar prog fora do intervalo: %i', (prog) => {
      expect(() => makeSchedule({ prog }).validateForTest()).toThrow(
        'Programado deve estar entre 0 e 100',
      );
    });

    it('deve aceitar exec nos limites permitidos', () => {
      expect(() => makeSchedule({ exec: 0 }).validateForTest()).not.toThrow();

      expect(() => makeSchedule({ exec: 100 }).validateForTest()).not.toThrow();
    });

    it.each([-1, 101])('deve rejeitar exec fora do intervalo: %i', (exec) => {
      expect(() => makeSchedule({ exec }).validateForTest()).toThrow(
        'Executado deve estar entre 0 e 100',
      );
    });

    it('deve aceitar quando exec não está definido', () => {
      expect(() =>
        makeSchedule({ exec: undefined }).validateForTest(),
      ).not.toThrow();
    });

    it('deve aceitar horários em que o fim é posterior ao início', () => {
      expect(() =>
        makeSchedule({
          startTime: new Date('2026-01-15T10:00:00.000Z'),
          finishTime: new Date('2026-01-15T11:00:00.000Z'),
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve rejeitar quando o fim é igual ao início', () => {
      const time = new Date('2026-01-15T10:00:00.000Z');

      expect(() =>
        makeSchedule({
          startTime: time,
          finishTime: time,
        }).validateForTest(),
      ).toThrow('Horário de fim deve ser posterior ao início');
    });

    it('deve rejeitar quando o fim é anterior ao início', () => {
      expect(() =>
        makeSchedule({
          startTime: new Date('2026-01-15T11:00:00.000Z'),
          finishTime: new Date('2026-01-15T10:00:00.000Z'),
        }).validateForTest(),
      ).toThrow('Horário de fim deve ser posterior ao início');
    });

    it('deve rejeitar mais de 8 caracteres para um tipo sem BRA', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '123456789',
        }).validateForTest(),
      ).toThrow("Número do DP deve conter exatamente 8 dígitos");
    });

    it('deve permitir mais de 8 caracteres para um serviço BRA', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: 'BRA-123456789',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve permitir mais de 8 caracteres para dp + lv', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: 'BRA-123456789',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('não deve tornar o número obrigatório durante validate()', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: undefined,
        }).validateForTest(),
      ).not.toThrow();
    });
  });

  describe('validateDpFormat()', () => {
    it('deve aceitar DP com exatamente 8 dígitos', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '12345678',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve rejeitar DP com caracteres não numéricos', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '1234AB78',
        }).validateForTest(),
      ).toThrow('Número do DP deve conter exatamente 8 dígitos');
    });

    it('deve rejeitar DP com menos de 8 dígitos', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '1234567',
        }).validateForTest(),
      ).toThrow('Número do DP deve conter exatamente 8 dígitos');
    });

    it('deve aceitar BRA com pelo menos 12 caracteres', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: 'BRA-123456789',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve rejeitar BRA com menos de 12 caracteres', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: 'BRA-123456',
        }).validateForTest(),
      ).toThrow('Número do BRA deve conter no mínimo 12 caracteres');
    });

    it('deve aceitar DP ou BRA válido para "dp + lv"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: '12345678',
        }).validateForTest(),
      ).not.toThrow();

      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: 'BRA-123456789',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve rejeitar valor que não seja DP nem BRA válido para "dp + lv"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: '1234567',
        }).validateForTest(),
      ).toThrow(
        'Número inválido: o DP deve conter exatamente 8 dígitos e o BRA no mínimo 12 caracteres',
      );
    });

    it('deve ignorar espaços à volta do valor antes de validar', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: ' 12345678 ',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('deve ignorar o formato quando o número está vazio ou só tem espaços', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '   ',
        }).validateForTest(),
      ).not.toThrow();
    });

    it('para tipos fora da lista, deve aplicar a validação de DP se houver valor', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'outro serviço',
          numDp: '1234567',
        }).validateForTest(),
      ).toThrow('Número do DP deve conter exatamente 8 dígitos');
    });
  });

  describe('requireDpNumber()', () => {
    it('deve exigir DP para o serviço "dp"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: undefined,
        }).requireDpNumber(),
      ).toThrow('Falta inserir número do DP');
    });

    it('deve considerar "0" como DP em falta', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '0',
        }).requireDpNumber(),
      ).toThrow('Falta inserir número do DP');
    });

    it('deve aceitar DP válido', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '12345678',
        }).requireDpNumber(),
      ).not.toThrow();
    });

    it('deve rejeitar DP com formato inválido', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: '1234567',
        }).requireDpNumber(),
      ).toThrow('Número do DP deve conter exatamente 8 dígitos');
    });

    it('deve exigir BRA para o serviço "lv"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: undefined,
        }).requireDpNumber(),
      ).toThrow('Falta inserir número do BRA');
    });

    it('deve aceitar BRA com pelo menos 12 caracteres', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: 'BRA-123456789',
        }).requireDpNumber(),
      ).not.toThrow();
    });

    it('deve rejeitar BRA com menos de 12 caracteres', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'lv',
          numDp: 'BRA-123456',
        }).requireDpNumber(),
      ).toThrow('Número do BRA deve conter no mínimo 12 caracteres');
    });

    it('deve aceitar um DP ou um BRA válido para "dp + lv"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: '12345678',
        }).requireDpNumber(),
      ).not.toThrow();

      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: 'BRA-123456789',
        }).requireDpNumber(),
      ).not.toThrow();
    });

    it('deve rejeitar valor inválido para "dp + lv"', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp + lv',
          numDp: '1234567',
        }).requireDpNumber(),
      ).toThrow(
        'Número inválido: o DP deve conter exatamente 8 dígitos e o BRA no mínimo 12 caracteres',
      );
    });

    it('não deve exigir documento para tipos fora da lista', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'outro serviço',
          numDp: undefined,
        }).requireDpNumber(),
      ).not.toThrow();
    });

    it('deve aceitar espaços à volta de um DP válido', () => {
      expect(() =>
        makeSchedule({
          serviceType: 'dp',
          numDp: ' 12345678 ',
        }).requireDpNumber(),
      ).not.toThrow();
    });
  });
});
