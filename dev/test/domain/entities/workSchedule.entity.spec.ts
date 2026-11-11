import { BadRequestException } from '@nestjs/common';
import {
  WorkSchedule,
  WorkScheduleProps,
} from 'src/domain/entities/schedules/workSchedule.entity';

// ---------------------------------------------------------------------------
// Factory: props mínimas válidas
// ---------------------------------------------------------------------------
const START = new Date('2026-02-10T08:00:00.000Z');
const FINISH = new Date('2026-02-10T17:00:00.000Z');

const makeProps = (
  overrides: Partial<WorkScheduleProps> = {},
): WorkScheduleProps =>
  ({
    idWork: 1,
    dataProg: new Date('2026-02-10T00:00:00.000Z'),
    startTime: START,
    finishTime: FINISH,
    ...overrides,
  }) as WorkScheduleProps;

const expectBadRequest = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(message);
};

/** Acesso ao método privado, para validar o contrato de serialização. */
const toProps = (entity: WorkSchedule): WorkScheduleProps =>
  (entity as any).toProps();

describe('WorkSchedule', () => {
  // =========================================================================
  // Construção e valores por omissão
  // =========================================================================
  describe('construção', () => {
    it('deve criar uma instância válida', () => {
      const entity = new WorkSchedule(makeProps());

      expect(entity).toBeInstanceOf(WorkSchedule);
      expect(entity.idWork).toBe(1);
      expect(entity.startTime).toBe(START);
      expect(entity.finishTime).toBe(FINISH);
    });

    it.each([
      ['idScheduleStatus', 'idScheduleStatus', 1],
      ['idProgRestriction1', 'idProgRestriction1', 1],
      ['idProgRestriction2', 'idProgRestriction2', 1],
    ])('deve aplicar o valor por omissão de %s', (_l, key, expected) => {
      const entity = new WorkSchedule(makeProps({ [key]: undefined } as any));
      expect((entity as any)[key]).toBe(expected);
    });

    it('deve assumir rejected como false por omissão', () => {
      expect(new WorkSchedule(makeProps()).rejected).toBe(false);
    });

    it('deve respeitar rejected explicitamente true', () => {
      expect(new WorkSchedule(makeProps({ rejected: true })).rejected).toBe(
        true,
      );
    });

    it('deve respeitar rejected explicitamente false', () => {
      expect(new WorkSchedule(makeProps({ rejected: false })).rejected).toBe(
        false,
      );
    });

    it('deve preservar os valores informados em vez dos padrões', () => {
      const entity = new WorkSchedule(
        makeProps({
          idScheduleStatus: 3,
          idProgRestriction1: 5,
          idProgRestriction2: 9,
        }),
      );

      expect(entity.idScheduleStatus).toBe(3);
      expect(entity.idProgRestriction1).toBe(5);
      expect(entity.idProgRestriction2).toBe(9);
    });

    it('deve manter os campos opcionais indefinidos quando omitidos', () => {
      const entity = new WorkSchedule(makeProps());

      expect(entity.equipment).toBeUndefined();
      expect(entity.observationRestriction).toBeUndefined();
      expect(entity.idUser).toBeUndefined();
      expect(entity.responsibilityProg).toBeUndefined();
      expect(entity.resolutionDate).toBeUndefined();
      expect(entity.responsibilityProg2).toBeUndefined();
      expect(entity.resolutionDate2).toBeUndefined();
    });

    it('deve atribuir integralmente o bloco da restrição 1', () => {
      const resolutionDate = new Date('2026-03-01T00:00:00.000Z');
      const entity = new WorkSchedule(
        makeProps({
          idProgRestriction1: 2,
          responsibilityProg: 'Equipa A',
          responsibleName: 'Ana',
          responsibleArea: 'Operações',
          restrictionStatus: 'Aberta',
          resolutionDate,
        }),
      );

      expect(entity).toMatchObject({
        idProgRestriction1: 2,
        responsibilityProg: 'Equipa A',
        responsibleName: 'Ana',
        responsibleArea: 'Operações',
        restrictionStatus: 'Aberta',
        resolutionDate,
      });
    });

    it('deve atribuir integralmente o bloco da restrição 2', () => {
      const resolutionDate2 = new Date('2026-03-05T00:00:00.000Z');
      const entity = new WorkSchedule(
        makeProps({
          idProgRestriction2: 4,
          responsibilityProg2: 'Equipa B',
          responsibleName2: 'Bruno',
          responsibleArea2: 'Manutenção',
          restrictionStatus2: 'Fechada',
          resolutionDate2,
        }),
      );

      expect(entity).toMatchObject({
        idProgRestriction2: 4,
        responsibilityProg2: 'Equipa B',
        responsibleName2: 'Bruno',
        responsibleArea2: 'Manutenção',
        restrictionStatus2: 'Fechada',
        resolutionDate2,
      });
    });

    it('deve atribuir os campos antes de validar', () => {
      // idWork inválido só é detetado na validação, que corre no fim
      expectBadRequest(
        () => new WorkSchedule(makeProps({ idWork: 0 })),
        'ID da obra é obrigatório',
      );
    });
  });

  // =========================================================================
  // validateSpecific
  // =========================================================================
  describe('validação', () => {
    describe('idWork', () => {
      it.each([
        ['ausente', undefined],
        ['zero', 0],
        ['negativo', -10],
      ])('deve rejeitar idWork %s', (_label, value) => {
        expectBadRequest(
          () => new WorkSchedule(makeProps({ idWork: value as number })),
          'ID da obra é obrigatório',
        );
      });

      it('deve aceitar idWork positivo', () => {
        expect(() => new WorkSchedule(makeProps({ idWork: 1 }))).not.toThrow();
      });
    });

    describe('janela horária', () => {
      it.each([
        ['startTime ausente', { startTime: undefined }],
        ['finishTime ausente', { finishTime: undefined }],
        ['ambos ausentes', { startTime: undefined, finishTime: undefined }],
      ])('deve rejeitar %s', (_label, overrides) => {
        expectBadRequest(
          () => new WorkSchedule(makeProps(overrides as any)),
          'Horário de início e fim são obrigatórios',
        );
      });

      it('deve aceitar ambos os horários preenchidos', () => {
        expect(() => new WorkSchedule(makeProps())).not.toThrow();
      });
    });

    describe('idScheduleStatus', () => {
      it.each([
        ['zero', 0],
        ['negativo', -1],
      ])('deve rejeitar status %s', (_label, value) => {
        expectBadRequest(
          () =>
            new WorkSchedule(makeProps({ idScheduleStatus: value as number })),
          'Status da programação inválido',
        );
      });

      it('deve aceitar status positivo', () => {
        expect(
          () => new WorkSchedule(makeProps({ idScheduleStatus: 2 })),
        ).not.toThrow();
      });

      it('deve aceitar o status padrão quando omitido', () => {
        const entity = new WorkSchedule(
          makeProps({ idScheduleStatus: undefined }),
        );
        expect(entity.idScheduleStatus).toBe(1);
      });
    });

    it('deve avaliar idWork antes dos horários', () => {
      // ambos inválidos: prevalece a mensagem do idWork
      expectBadRequest(
        () =>
          new WorkSchedule(
            makeProps({ idWork: 0, startTime: undefined } as any),
          ),
        'ID da obra é obrigatório',
      );
    });
  });

  // =========================================================================
  // clearRejection
  // =========================================================================
  describe('clearRejection', () => {
    it('deve devolver a própria instância quando não está reprovada', () => {
      const entity = new WorkSchedule(makeProps({ rejected: false }));

      expect(entity.clearRejection()).toBe(entity);
    });

    it('deve devolver a própria instância quando rejected é omitido', () => {
      const entity = new WorkSchedule(makeProps());

      expect(entity.clearRejection()).toBe(entity);
    });

    it('deve devolver nova instância com rejected false quando reprovada', () => {
      const entity = new WorkSchedule(makeProps({ rejected: true }));
      const cleared = entity.clearRejection();

      expect(cleared).not.toBe(entity);
      expect(cleared).toBeInstanceOf(WorkSchedule);
      expect(cleared.rejected).toBe(false);
      expect(entity.rejected).toBe(true); // original intacto
    });

    it('deve preservar os restantes campos ao limpar a reprovação', () => {
      const entity = new WorkSchedule(
        makeProps({
          rejected: true,
          idWork: 42,
          equipment: 'Escavadora',
          idScheduleStatus: 3,
          responsibleName: 'Ana',
        }),
      );

      expect(entity.clearRejection()).toMatchObject({
        idWork: 42,
        equipment: 'Escavadora',
        idScheduleStatus: 3,
        responsibleName: 'Ana',
        rejected: false,
      });
    });

    it('deve ser idempotente', () => {
      const cleared = new WorkSchedule(
        makeProps({ rejected: true }),
      ).clearRejection();

      expect(cleared.clearRejection()).toBe(cleared);
    });
  });

  // =========================================================================
  // withChanges
  // =========================================================================
  describe('withChanges', () => {
    it('deve devolver nova instância sem mutar a original', () => {
      const original = new WorkSchedule(makeProps({ equipment: 'Grua' }));
      const updated = original.withChanges({ equipment: 'Escavadora' });

      expect(updated).not.toBe(original);
      expect(updated.equipment).toBe('Escavadora');
      expect(original.equipment).toBe('Grua');
    });

    it('deve manter os valores originais quando não há alterações', () => {
      const original = new WorkSchedule(makeProps());

      expect(toProps(original.withChanges({}))).toEqual(toProps(original));
    });

    it('deve permitir alterar múltiplos campos em simultâneo', () => {
      const novaData = new Date('2026-04-01T09:00:00.000Z');
      const updated = new WorkSchedule(makeProps()).withChanges({
        idScheduleStatus: 4,
        rejected: true,
        finishTime: novaData,
      });

      expect(updated).toMatchObject({
        idScheduleStatus: 4,
        rejected: true,
        finishTime: novaData,
      });
    });

    it('deve revalidar as regras de negócio', () => {
      const original = new WorkSchedule(makeProps());

      expectBadRequest(
        () => original.withChanges({ idWork: 0 }),
        'ID da obra é obrigatório',
      );
    });

    it('deve rejeitar a remoção de um horário obrigatório', () => {
      const original = new WorkSchedule(makeProps());

      expectBadRequest(
        () => original.withChanges({ finishTime: undefined } as any),
        'Horário de início e fim são obrigatórios',
      );
    });

    it('deve permitir reprovar uma programação', () => {
      const updated = new WorkSchedule(makeProps()).withChanges({
        rejected: true,
      });

      expect(updated.rejected).toBe(true);
    });

    it('deve reaplicar os padrões quando um campo é explicitamente undefined', () => {
      const original = new WorkSchedule(makeProps({ idScheduleStatus: 5 }));
      const updated = original.withChanges({ idScheduleStatus: undefined });

      expect(updated.idScheduleStatus).toBe(1);
    });
  });

  // =========================================================================
  // toProps (contrato de serialização)
  // =========================================================================
  describe('toProps', () => {
    it('deve expor todos os campos da entidade', () => {
      const entity = new WorkSchedule(
        makeProps({
          equipment: 'Grua',
          idUser: 7,
          observationRestriction: 'Aguarda licença',
        }),
      );

      expect(toProps(entity)).toMatchObject({
        idWork: 1,
        startTime: START,
        finishTime: FINISH,
        equipment: 'Grua',
        idScheduleStatus: 1,
        rejected: false,
        observationRestriction: 'Aguarda licença',
        idUser: 7,
        idProgRestriction1: 1,
        idProgRestriction2: 1,
      });
    });

    it('deve permitir reconstruir uma entidade equivalente', () => {
      const original = new WorkSchedule(
        makeProps({ equipment: 'Grua', idScheduleStatus: 2, idUser: 7 }),
      );
      const rebuilt = WorkSchedule.create(toProps(original));

      expect(toProps(rebuilt)).toEqual(toProps(original));
    });

    it('deve normalizar os padrões na serialização', () => {
      const props = toProps(
        new WorkSchedule(
          makeProps({
            rejected: undefined,
            idScheduleStatus: undefined,
          } as any),
        ),
      );

      expect(props.rejected).toBe(false);
      expect(props.idScheduleStatus).toBe(1);
    });
  });

  // =========================================================================
  // create
  // =========================================================================
  describe('create', () => {
    it('deve instanciar via factory estática', () => {
      expect(WorkSchedule.create(makeProps())).toBeInstanceOf(WorkSchedule);
    });

    it('deve propagar as validações', () => {
      expectBadRequest(
        () => WorkSchedule.create(makeProps({ idWork: -1 })),
        'ID da obra é obrigatório',
      );
    });

    it('deve produzir instâncias independentes', () => {
      const props = makeProps();

      expect(WorkSchedule.create(props)).not.toBe(WorkSchedule.create(props));
    });
  });

  // =========================================================================
  // Imutabilidade
  // =========================================================================
  describe('imutabilidade', () => {
    it('não deve ser afetada pelas transformações derivadas', () => {
      const entity = new WorkSchedule(makeProps({ rejected: true }));
      const snapshot = toProps(entity);

      entity.withChanges({ idWork: 99 });
      entity.clearRejection();

      expect(toProps(entity)).toEqual(snapshot);
    });
  });
});
