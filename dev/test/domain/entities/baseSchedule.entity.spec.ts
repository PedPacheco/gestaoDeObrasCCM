import { BadRequestException } from '@nestjs/common';
import {
  BaseSchedule,
  BaseScheduleProps,
} from 'src/domain/entities/schedules/baseSchedule.entity';

// ---------------------------------------------------------------------------
// Test double: expõe os membros protegidos sem acrescentar regras próprias
// ---------------------------------------------------------------------------
class TestSchedule extends BaseSchedule {
  public specificCalls = 0;
  public specificError?: Error;

  constructor(props: BaseScheduleProps) {
    super(props);
  }

  protected validateSpecific(): void {
    this.specificCalls += 1;
    if (this.specificError) throw this.specificError;
  }

  // Aberturas para teste
  public runValidate(): void {
    this.validate();
  }

  public runBaseProps(): BaseScheduleProps {
    return this.baseProps();
  }

  public runCheckTypeOfService(): boolean {
    return this.checkTypeOfService();
  }
}

const makeProps = (
  overrides: Partial<BaseScheduleProps> = {},
): BaseScheduleProps =>
  ({
    dataProg: new Date('2026-02-10T00:00:00.000Z'),
    prog: 50,
    ...overrides,
  }) as BaseScheduleProps;

const make = (overrides: Partial<BaseScheduleProps> = {}) =>
  new TestSchedule(makeProps(overrides));

const expectBadRequest = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(message);
};

describe('BaseSchedule', () => {
  // =========================================================================
  // Construção
  // =========================================================================
  describe('construção', () => {
    it('deve atribuir os campos obrigatórios', () => {
      const dataProg = new Date('2026-05-01T00:00:00.000Z');
      const entity = make({ dataProg, prog: 75 });

      expect(entity.dataProg).toBe(dataProg);
      expect(entity.prog).toBe(75);
    });

    it('não deve validar no construtor (validação delegada à subclasse)', () => {
      // prog inválido não lança porque validate() não corre aqui
      expect(() => make({ prog: 999 })).not.toThrow();
      expect(make().specificCalls).toBe(0);
    });

    it.each([
      ['lmTeam', 'lmTeam', 0],
      ['regulTeam', 'regulTeam', 0],
      ['lvTeam', 'lvTeam', 0],
      ['idTechnical', 'idTechnical', 1],
      ['idExecutionRestriction', 'idExecutionRestriction', 1],
    ])('deve aplicar o valor por omissão de %s', (_l, key, expected) => {
      expect((make() as any)[key]).toBe(expected);
    });

    it('deve assumir temporaryKey como false por omissão', () => {
      expect(make().temporaryKey).toBe(false);
    });

    it('deve respeitar temporaryKey explicitamente true', () => {
      expect(make({ temporaryKey: true }).temporaryKey).toBe(true);
    });

    it('deve preservar o valor zero das equipas em vez do padrão', () => {
      const entity = make({ lmTeam: 0, regulTeam: 5, lvTeam: 9 });

      expect(entity.lmTeam).toBe(0);
      expect(entity.regulTeam).toBe(5);
      expect(entity.lvTeam).toBe(9);
    });

    it('deve preservar os valores informados de técnico e restrição', () => {
      const entity = make({ idTechnical: 8, idExecutionRestriction: 3 });

      expect(entity.idTechnical).toBe(8);
      expect(entity.idExecutionRestriction).toBe(3);
    });

    it('deve manter os campos opcionais indefinidos quando omitidos', () => {
      const entity = make();

      expect(entity.id).toBeUndefined();
      expect(entity.exec).toBeUndefined();
      expect(entity.startTime).toBeUndefined();
      expect(entity.finishTime).toBeUndefined();
      expect(entity.observation).toBeUndefined();
      expect(entity.executionObservation).toBeUndefined();
      expect(entity.serviceType).toBeUndefined();
      expect(entity.numDp).toBeUndefined();
      expect(entity.chi).toBeUndefined();
      expect(entity.responsibility).toBeUndefined();
    });

    it('deve atribuir todos os campos opcionais quando informados', () => {
      const startTime = new Date('2026-02-10T08:00:00.000Z');
      const finishTime = new Date('2026-02-10T17:00:00.000Z');

      const entity = make({
        id: 10,
        exec: 80,
        startTime,
        finishTime,
        observation: 'obs',
        executionObservation: 'exec obs',
        serviceType: 'Manutenção',
        numDp: '12345678',
        chi: 42,
        responsibility: 'Equipa A',
      });

      expect(entity).toMatchObject({
        id: 10,
        exec: 80,
        startTime,
        finishTime,
        observation: 'obs',
        executionObservation: 'exec obs',
        serviceType: 'Manutenção',
        numDp: '12345678',
        chi: 42,
        responsibility: 'Equipa A',
      });
    });
  });

  // =========================================================================
  // validate — prog
  // =========================================================================
  describe('validate — prog', () => {
    it.each([
      ['negativo', -1],
      ['acima de 100', 101],
    ])('deve rejeitar prog %s', (_label, prog) => {
      expectBadRequest(
        () => make({ prog }).runValidate(),
        'Programado deve estar entre 0 e 100',
      );
    });

    it.each([
      ['limite inferior', 0],
      ['valor intermédio', 50],
      ['limite superior', 100],
    ])('deve aceitar prog no %s', (_label, prog) => {
      expect(() => make({ prog }).runValidate()).not.toThrow();
    });

    it('deve aceitar prog decimal dentro do intervalo', () => {
      expect(() => make({ prog: 33.33 }).runValidate()).not.toThrow();
    });
  });

  // =========================================================================
  // validate — exec
  // =========================================================================
  describe('validate — exec', () => {
    it('deve ignorar a validação quando exec é undefined', () => {
      expect(() => make({ exec: undefined }).runValidate()).not.toThrow();
    });

    it.each([
      ['negativo', -1],
      ['acima de 100', 101],
    ])('deve rejeitar exec %s', (_label, exec) => {
      expectBadRequest(
        () => make({ exec }).runValidate(),
        'Executado deve estar entre 0 e 100',
      );
    });

    it.each([
      ['limite inferior', 0],
      ['valor intermédio', 60],
      ['limite superior', 100],
    ])('deve aceitar exec no %s', (_label, exec) => {
      expect(() => make({ exec }).runValidate()).not.toThrow();
    });

    it('deve validar exec zero em vez de o tratar como ausente', () => {
      // 0 !== undefined, logo entra na verificação e passa
      expect(() => make({ exec: 0 }).runValidate()).not.toThrow();
    });

    it('deve avaliar prog antes de exec', () => {
      expectBadRequest(
        () => make({ prog: -1, exec: -1 }).runValidate(),
        'Programado deve estar entre 0 e 100',
      );
    });
  });

  // =========================================================================
  // validate — janela horária
  // =========================================================================
  describe('validate — janela horária', () => {
    const inicio = new Date('2026-02-10T08:00:00.000Z');
    const fim = new Date('2026-02-10T17:00:00.000Z');

    it('deve aceitar fim posterior ao início', () => {
      expect(() =>
        make({ startTime: inicio, finishTime: fim }).runValidate(),
      ).not.toThrow();
    });

    it('deve rejeitar fim anterior ao início', () => {
      expectBadRequest(
        () => make({ startTime: fim, finishTime: inicio }).runValidate(),
        'Horário de fim deve ser posterior ao início',
      );
    });

    it('deve rejeitar horários iguais (comparação >=)', () => {
      expectBadRequest(
        () =>
          make({
            startTime: inicio,
            finishTime: new Date(inicio),
          }).runValidate(),
        'Horário de fim deve ser posterior ao início',
      );
    });

    it('deve aceitar uma diferença de um milissegundo', () => {
      expect(() =>
        make({
          startTime: inicio,
          finishTime: new Date(inicio.getTime() + 1),
        }).runValidate(),
      ).not.toThrow();
    });

    it.each([
      ['apenas startTime', { startTime: inicio }],
      ['apenas finishTime', { finishTime: fim }],
      ['nenhum dos dois', {}],
    ])('deve ignorar a comparação com %s', (_label, overrides) => {
      expect(() => make(overrides).runValidate()).not.toThrow();
    });
  });

  // =========================================================================
  // validate — template method
  // =========================================================================
  describe('validate — template method', () => {
    it('deve invocar validateSpecific após as regras comuns', () => {
      const entity = make();

      entity.runValidate();

      expect(entity.specificCalls).toBe(1);
    });

    it('não deve invocar validateSpecific quando uma regra comum falha', () => {
      const entity = make({ prog: -5 });

      expect(() => entity.runValidate()).toThrow(BadRequestException);
      expect(entity.specificCalls).toBe(0);
    });

    it('deve propagar os erros da subclasse', () => {
      const entity = make();
      entity.specificError = new BadRequestException('regra da subclasse');

      expectBadRequest(() => entity.runValidate(), 'regra da subclasse');
    });
  });

  // =========================================================================
  // baseProps
  // =========================================================================
  describe('baseProps', () => {
    it('deve expor todos os campos base, já normalizados', () => {
      const props = make({ id: 3, exec: 90 }).runBaseProps();

      expect(props).toMatchObject({
        prog: 50,
        id: 3,
        exec: 90,
        lmTeam: 0,
        regulTeam: 0,
        lvTeam: 0,
        temporaryKey: false,
        idTechnical: 1,
        idExecutionRestriction: 1,
      });
    });

    it('deve conter exatamente as chaves do contrato base', () => {
      expect(Object.keys(make().runBaseProps()).sort()).toEqual(
        [
          'chi',
          'dataProg',
          'exec',
          'executionObservation',
          'finishTime',
          'id',
          'idExecutionRestriction',
          'idTechnical',
          'lmTeam',
          'lvTeam',
          'numDp',
          'observation',
          'prog',
          'regulTeam',
          'responsibility',
          'serviceType',
          'startTime',
          'temporaryKey',
        ].sort(),
      );
    });

    it('deve permitir reconstruir uma entidade equivalente', () => {
      const original = make({ id: 1, exec: 70, serviceType: 'DP' });
      const rebuilt = new TestSchedule(original.runBaseProps());

      expect(rebuilt.runBaseProps()).toEqual(original.runBaseProps());
    });

    it('deve devolver um novo objeto a cada chamada', () => {
      const entity = make();

      expect(entity.runBaseProps()).not.toBe(entity.runBaseProps());
    });

    it('deve partilhar a referência das datas (cópia superficial)', () => {
      const dataProg = new Date('2026-02-10T00:00:00.000Z');

      expect(make({ dataProg }).runBaseProps().dataProg).toBe(dataProg);
    });
  });

  // =========================================================================
  // checkTypeOfService
  // =========================================================================
  describe('checkTypeOfService', () => {
    it.each([
      ['undefined', undefined],
      ['string vazia', ''],
    ])('deve devolver false quando serviceType é %s', (_l, serviceType) => {
      expect(make({ serviceType }).runCheckTypeOfService()).toBe(false);
    });

    it.each([
      ['maiúsculas', 'DP'],
      ['minúsculas', 'dp'],
      ['capitalizado', 'Dp'],
      ['com prefixo', 'SERVIÇO DP'],
      ['com sufixo', 'dp programado'],
      ['no meio', 'tipo dp urgente'],
    ])('deve devolver true para %s', (_label, serviceType) => {
      expect(make({ serviceType }).runCheckTypeOfService()).toBe(true);
    });

    it('deve devolver false para tipos sem DP', () => {
      expect(make({ serviceType: 'Manutenção' }).runCheckTypeOfService()).toBe(
        false,
      );
    });

    it('deve detetar DP em substrings acidentais', () => {
      // comportamento atual: includes, não igualdade
      expect(make({ serviceType: 'ADPT' }).runCheckTypeOfService()).toBe(true);
    });
  });

  // =========================================================================
  // validateDpNumber
  // =========================================================================
  describe('validateDpNumber', () => {
    it('não deve validar quando o serviço não é DP', () => {
      expect(() =>
        make({
          serviceType: 'Manutenção',
          numDp: undefined,
        }).validateDpNumber(),
      ).not.toThrow();
    });

    it('não deve validar quando serviceType é ausente', () => {
      expect(() => make({ numDp: 'abc' }).validateDpNumber()).not.toThrow();
    });

    it.each([
      ['ausente', undefined],
      ['string vazia', ''],
      ['apenas espaços', '   '],
      ['zero', '0'],
    ])('deve exigir o número do DP quando %s', (_label, numDp) => {
      expectBadRequest(
        () => make({ serviceType: 'DP', numDp }).validateDpNumber(),
        'Falta inserir número do DP',
      );
    });

    it.each([
      ['menos de 8 dígitos', '1234567'],
      ['mais de 8 dígitos', '123456789'],
      ['com letras', '1234567a'],
      ['com separadores', '1234-567'],
      ['com espaço interno', '1234 567'],
      ['decimal', '12345.67'],
    ])('deve rejeitar DP com %s', (_label, numDp) => {
      expectBadRequest(
        () => make({ serviceType: 'DP', numDp }).validateDpNumber(),
        'Número do DP deve conter exatamente 8 dígitos',
      );
    });

    it('deve aceitar exatamente 8 dígitos', () => {
      expect(() =>
        make({ serviceType: 'DP', numDp: '12345678' }).validateDpNumber(),
      ).not.toThrow();
    });

    it('deve aceitar 8 dígitos com espaços envolventes (trim)', () => {
      expect(() =>
        make({ serviceType: 'DP', numDp: '  12345678  ' }).validateDpNumber(),
      ).not.toThrow();
    });

    it('deve aceitar DP iniciado por zeros', () => {
      expect(() =>
        make({ serviceType: 'DP', numDp: '00001234' }).validateDpNumber(),
      ).not.toThrow();
    });

    it('deve rejeitar "0" mesmo com espaços', () => {
      expectBadRequest(
        () => make({ serviceType: 'DP', numDp: ' 0 ' }).validateDpNumber(),
        'Falta inserir número do DP',
      );
    });

    it('deve aceitar "00000000" como DP válido', () => {
      // 8 dígitos: passa o guard de "0" e a regex
      expect(() =>
        make({ serviceType: 'DP', numDp: '00000000' }).validateDpNumber(),
      ).not.toThrow();
    });

    it('deve ser independente de validate()', () => {
      const entity = make({ serviceType: 'DP', numDp: '12345678' });

      entity.validateDpNumber();

      expect(entity.specificCalls).toBe(0);
    });
  });
});
