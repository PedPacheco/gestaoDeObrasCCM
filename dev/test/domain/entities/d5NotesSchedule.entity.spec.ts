import { BadRequestException } from '@nestjs/common';
import {
  D5NoteSchedule,
  D5ScheduleProps,
} from 'src/domain/entities/schedules/D5NotesSchedule.entity';

// ---------------------------------------------------------------------------
// Factory: props mínimas válidas, sobreponíveis por teste
// ---------------------------------------------------------------------------
const makeProps = (overrides: Partial<D5ScheduleProps> = {}): D5ScheduleProps =>
  ({
    d5NoteId: 1,
    creatorUserId: 10,
    modifyingUserId: 20,
    dataProg: new Date('2026-01-15T00:00:00.000Z'),
    ...overrides,
  }) as D5ScheduleProps;

/** Props válidas já com execução informada (desbloqueia ficheiros e observação). */
const makeExecutedProps = (
  overrides: Partial<D5ScheduleProps> = {},
): D5ScheduleProps => makeProps({ exec: 'S', ...overrides } as any);

/** Helper de asserção: valida o tipo E a mensagem numa só chamada. */
const expectBadRequest = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(message);
};

describe('D5NoteSchedule', () => {
  beforeAll(() => {
    // Silencia o console.log presente no getter hasExecution
    jest.spyOn(console, 'log').mockImplementation(() => undefined);
  });

  afterEach(() => jest.clearAllMocks());
  afterAll(() => jest.restoreAllMocks());

  // -------------------------------------------------------------------------
  // Construção
  // -------------------------------------------------------------------------
  describe('construção', () => {
    it('deve criar uma instância válida e atribuir os campos', () => {
      const props = makeProps();
      const entity = new D5NoteSchedule(props);

      expect(entity).toBeInstanceOf(D5NoteSchedule);
      expect(entity.d5NoteId).toBe(1);
      expect(entity.creatorUserId).toBe(10);
      expect(entity.modifyingUserId).toBe(20);
    });

    it('deve assumir array vazio quando filePaths não é informado', () => {
      const entity = new D5NoteSchedule(makeProps({ filePaths: undefined }));
      expect(entity.filePaths).toEqual([]);
    });

    it('deve preservar filePaths quando informado (com execução)', () => {
      const entity = new D5NoteSchedule(
        makeExecutedProps({ filePaths: ['a.pdf', 'b.pdf'] }),
      );
      expect(entity.filePaths).toEqual(['a.pdf', 'b.pdf']);
    });

    it('deve manter creatorUserId indefinido em atualizações (id presente)', () => {
      const entity = new D5NoteSchedule(
        makeProps({ id: 99, creatorUserId: undefined }),
      );
      expect(entity.creatorUserId).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // validateSpecific — identificadores
  // -------------------------------------------------------------------------
  describe('validação de identificadores', () => {
    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -5],
    ])('deve rejeitar d5NoteId %s', (_label, value) => {
      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ d5NoteId: value as number })),
        'ID da nota D5 é obrigatório',
      );
    });

    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -1],
    ])('deve exigir creatorUserId na criação quando %s', (_label, value) => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeProps({ id: undefined, creatorUserId: value as number }),
          ),
        'Utilizador criador é obrigatório',
      );
    });

    it('não deve exigir creatorUserId quando o id já existe', () => {
      expect(
        () =>
          new D5NoteSchedule(makeProps({ id: 7, creatorUserId: undefined })),
      ).not.toThrow();
    });

    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -3],
    ])('deve rejeitar modifyingUserId %s', (_label, value) => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(makeProps({ modifyingUserId: value as number })),
        'Utilizador modificador é obrigatório',
      );
    });
  });

  // -------------------------------------------------------------------------
  // validateSpecific — data de programação
  // -------------------------------------------------------------------------
  describe('validação de dataProg', () => {
    it('deve rejeitar dataProg ausente', () => {
      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ dataProg: undefined as any })),
        'Data de programação inválida',
      );
    });

    it('deve rejeitar dataProg com valor inválido (NaN)', () => {
      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ dataProg: new Date('xpto') })),
        'Data de programação inválida',
      );
    });

    it('deve aceitar uma data válida', () => {
      expect(
        () => new D5NoteSchedule(makeProps({ dataProg: new Date() })),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validateSpecific — janela horária
  // -------------------------------------------------------------------------
  describe('validação de horários', () => {
    it('deve rejeitar apenas hora de início', () => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeProps({ startTime: '08:00', finishTime: undefined } as any),
          ),
        'Informe hora de início e hora de término em conjunto',
      );
    });

    it('deve rejeitar apenas hora de término', () => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeProps({ startTime: undefined, finishTime: '17:00' } as any),
          ),
        'Informe hora de início e hora de término em conjunto',
      );
    });

    it('deve aceitar ambas as horas preenchidas', () => {
      expect(
        () =>
          new D5NoteSchedule(
            makeProps({ startTime: '08:00', finishTime: '17:00' } as any),
          ),
      ).not.toThrow();
    });

    it('deve aceitar ambas as horas omitidas', () => {
      expect(() => new D5NoteSchedule(makeProps())).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validateSpecific — limites de texto
  // -------------------------------------------------------------------------
  describe('validação de limites de texto', () => {
    it('deve rejeitar numDp com mais de 25 caracteres', () => {
      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ numDp: 'X'.repeat(26) } as any)),
        'Número do DP deve ter no máximo 25 caracteres',
      );
    });

    it('deve aceitar numDp com exatamente 25 caracteres (limite)', () => {
      expect(
        () => new D5NoteSchedule(makeProps({ numDp: 'X'.repeat(25) } as any)),
      ).not.toThrow();
    });

    it('deve aceitar numDp vazio ou omitido', () => {
      expect(
        () => new D5NoteSchedule(makeProps({ numDp: '' } as any)),
      ).not.toThrow();
      expect(
        () => new D5NoteSchedule(makeProps({ numDp: undefined } as any)),
      ).not.toThrow();
    });

    it('deve rejeitar responsibility com mais de 50 caracteres', () => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeProps({ responsibility: 'Y'.repeat(51) } as any),
          ),
        'Responsável pela restrição deve ter no máximo 50 caracteres',
      );
    });

    it('deve aceitar responsibility com exatamente 50 caracteres (limite)', () => {
      expect(
        () =>
          new D5NoteSchedule(
            makeProps({ responsibility: 'Y'.repeat(50) } as any),
          ),
      ).not.toThrow();
    });

    it('deve aceitar responsibility vazio ou omitido', () => {
      expect(
        () => new D5NoteSchedule(makeProps({ responsibility: '' } as any)),
      ).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // validateFiles
  // -------------------------------------------------------------------------
  describe('validação de ficheiros', () => {
    it('deve rejeitar mais de 5 ficheiros', () => {
      const filePaths = Array.from({ length: 6 }, (_, i) => `f${i}.pdf`);

      expectBadRequest(
        () => new D5NoteSchedule(makeExecutedProps({ filePaths })),
        'Máximo de 5 ficheiros permitidos por programação',
      );
    });

    it('deve aceitar exatamente 5 ficheiros (limite)', () => {
      const filePaths = Array.from({ length: 5 }, (_, i) => `f${i}.pdf`);

      expect(
        () => new D5NoteSchedule(makeExecutedProps({ filePaths })),
      ).not.toThrow();
    });

    it('deve rejeitar ficheiros duplicados', () => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeExecutedProps({ filePaths: ['a.pdf', 'a.pdf'] }),
          ),
        'Existem ficheiros duplicados',
      );
    });

    it('deve validar o limite antes da regra de execução', () => {
      // 6 ficheiros SEM execução: deve falhar pelo limite, não pela execução
      const filePaths = Array.from({ length: 6 }, (_, i) => `f${i}.pdf`);

      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ filePaths })),
        'Máximo de 5 ficheiros permitidos por programação',
      );
    });
  });

  // -------------------------------------------------------------------------
  // validateExecutionFields
  // -------------------------------------------------------------------------
  describe('validação dos campos de execução', () => {
    it('deve rejeitar anexos sem execução informada', () => {
      expectBadRequest(
        () => new D5NoteSchedule(makeProps({ filePaths: ['a.pdf'] })),
        'Só é possível anexar ficheiros após informar a execução',
      );
    });

    it('deve rejeitar observação de execução sem execução informada', () => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(
            makeProps({ executionObservation: 'concluído' } as any),
          ),
        'A observação de execução só pode ser preenchida após informar a execução',
      );
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('deve tratar exec %s como ausência de execução', (_label, exec) => {
      expectBadRequest(
        () =>
          new D5NoteSchedule(makeProps({ exec, filePaths: ['a.pdf'] } as any)),
        'Só é possível anexar ficheiros após informar a execução',
      );
    });

    it('deve permitir anexos e observação quando há execução', () => {
      expect(
        () =>
          new D5NoteSchedule(
            makeExecutedProps({
              filePaths: ['a.pdf'],
              executionObservation: 'ok',
            } as any),
          ),
      ).not.toThrow();
    });

    it('deve aceitar ausência de execução sem anexos nem observação', () => {
      expect(() => new D5NoteSchedule(makeProps())).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // toPublicProps
  // -------------------------------------------------------------------------
  describe('toPublicProps', () => {
    it('deve expor os campos específicos do D5 em conjunto com os base', () => {
      const entity = new D5NoteSchedule(
        makeExecutedProps({ filePaths: ['a.pdf'] }),
      );

      expect(entity.toPublicProps()).toMatchObject({
        d5NoteId: 1,
        creatorUserId: 10,
        modifyingUserId: 20,
        filePaths: ['a.pdf'],
      });
    });

    it('deve produzir props reutilizáveis para reconstruir a entidade', () => {
      const original = new D5NoteSchedule(makeProps());
      const rebuilt = D5NoteSchedule.create(original.toPublicProps());

      expect(rebuilt.toPublicProps()).toEqual(original.toPublicProps());
    });
  });

  // -------------------------------------------------------------------------
  // withChanges
  // -------------------------------------------------------------------------
  describe('withChanges', () => {
    it('deve devolver uma nova instância sem mutar a original', () => {
      const original = new D5NoteSchedule(makeProps());
      const updated = original.withChanges({ modifyingUserId: 55 });

      expect(updated).toBeInstanceOf(D5NoteSchedule);
      expect(updated).not.toBe(original);
      expect(updated.modifyingUserId).toBe(55);
      expect(original.modifyingUserId).toBe(20);
    });

    it('deve preservar d5NoteId e creatorUserId mesmo que venham nas alterações', () => {
      const original = new D5NoteSchedule(makeProps());

      const updated = original.withChanges({
        d5NoteId: 999,
        creatorUserId: 999,
      } as any);

      expect(updated.d5NoteId).toBe(1);
      expect(updated.creatorUserId).toBe(10);
    });

    it('deve manter os valores originais quando não há alterações', () => {
      const original = new D5NoteSchedule(makeProps());
      expect(original.withChanges({}).toPublicProps()).toEqual(
        original.toPublicProps(),
      );
    });

    it('deve revalidar as regras de negócio na alteração', () => {
      const original = new D5NoteSchedule(makeProps());

      expectBadRequest(
        () => original.withChanges({ modifyingUserId: 0 }),
        'Utilizador modificador é obrigatório',
      );
    });

    it('deve permitir anexar ficheiros ao registar a execução', () => {
      const original = new D5NoteSchedule(makeProps());

      const updated = original.withChanges({
        exec: 'S',
        filePaths: ['a.pdf'],
      } as any);

      expect(updated.filePaths).toEqual(['a.pdf']);
    });
  });

  // -------------------------------------------------------------------------
  // create
  // -------------------------------------------------------------------------
  describe('create', () => {
    it('deve instanciar via factory estática', () => {
      expect(D5NoteSchedule.create(makeProps())).toBeInstanceOf(D5NoteSchedule);
    });

    it('deve propagar as validações da factory', () => {
      expectBadRequest(
        () => D5NoteSchedule.create(makeProps({ d5NoteId: 0 })),
        'ID da nota D5 é obrigatório',
      );
    });
  });

  // -------------------------------------------------------------------------
  // Imutabilidade
  // -------------------------------------------------------------------------
  describe('imutabilidade', () => {
    it('não deve permitir reatribuir campos readonly em runtime (TS) — verificação de contrato', () => {
      const entity = new D5NoteSchedule(makeProps());
      const snapshot = entity.toPublicProps();

      entity.withChanges({ modifyingUserId: 77 });

      expect(entity.toPublicProps()).toEqual(snapshot);
    });
  });
});
