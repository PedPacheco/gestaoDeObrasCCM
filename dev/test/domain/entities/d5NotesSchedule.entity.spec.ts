import { BadRequestException } from '@nestjs/common';
import {
  D5NoteSchedule,
  D5ScheduleChanges,
  D5ScheduleProps,
} from 'src/domain/entities/schedules/d5NotesSchedule.entity';

// ---------------------------------------------------------------------------
// Mensagens de erro (fonte única — evita divergência entre testes e entidade)
// ---------------------------------------------------------------------------
const MSG = {
  d5NoteId: 'ID da nota D5 é obrigatório',
  creator: 'Utilizador criador é obrigatório',
  modifier: 'Utilizador modificador é obrigatório',
  dataProg: 'Data de programação inválida',
  timeWindow: 'Informe hora de início e hora de término em conjunto',

  responsibility: 'Responsável pela restrição deve ter no máximo 50 caracteres',
  maxFiles: 'Máximo de 5 ficheiros permitidos por programação',
  duplicatedFiles: 'Existem ficheiros duplicados',
  filesWithoutExec: 'Só é possível anexar ficheiros após informar a execução',
  observationWithoutExec:
    'A observação de execução só pode ser preenchida após informar a execução',
  filesRequired: 'É obrigatório anexar ao menos um ficheiro quando há execução',
  observationRequired:
    'A observação de execução é obrigatória quando há execução',
} as const;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
type Overrides = Record<string, unknown>;

/**
 * Props mínimas válidas SEM execução.
 * Regra de negócio: sem execução não pode haver ficheiros nem observação,
 * portanto o "estado base válido" não define nenhum dos dois.
 */
const makeProps = (overrides: Overrides = {}): D5ScheduleProps =>
  ({
    d5NoteId: 1,
    creatorUserId: 10,
    modifyingUserId: 20,
    dataProg: new Date('2026-01-15T00:00:00.000Z'),
    ...overrides,
  }) as unknown as D5ScheduleProps;

/**
 * Props mínimas válidas COM execução.
 * Com execução, ficheiros (>= 1) e observação passam a ser obrigatórios.
 * `exec` é numérico: a entidade avalia `exec > 0`.
 */
const makeExecutedProps = (overrides: Overrides = {}): D5ScheduleProps =>
  makeProps({
    exec: 10,
    filePaths: ['a.pdf'],
    executionObservation: 'Poste instalado',
    ...overrides,
  });

const build = (overrides: Overrides = {}) =>
  new D5NoteSchedule(makeProps(overrides));

const buildExecuted = (overrides: Overrides = {}) =>
  new D5NoteSchedule(makeExecutedProps(overrides));

const changes = (value: Overrides): D5ScheduleChanges =>
  value as unknown as D5ScheduleChanges;

const makeFiles = (count: number) =>
  Array.from({ length: count }, (_, i) => `f${i}.pdf`);

/** Valida o tipo E a mensagem da exceção numa só chamada. */
const expectBadRequest = (fn: () => unknown, message: string) => {
  expect(fn).toThrow(BadRequestException);
  expect(fn).toThrow(message);
};

describe('D5NoteSchedule', () => {
  // -------------------------------------------------------------------------
  // Construção
  // -------------------------------------------------------------------------
  describe('construção', () => {
    it('deve criar uma instância válida e atribuir os campos', () => {
      const entity = build();

      expect(entity).toBeInstanceOf(D5NoteSchedule);
      expect(entity.d5NoteId).toBe(1);
      expect(entity.creatorUserId).toBe(10);
      expect(entity.modifyingUserId).toBe(20);
    });

    it('deve assumir array vazio quando filePaths não é informado', () => {
      expect(build({ filePaths: undefined }).filePaths).toEqual([]);
    });

    it('deve preservar filePaths quando informado (com execução)', () => {
      const entity = buildExecuted({ filePaths: ['a.pdf', 'b.pdf'] });

      expect(entity.filePaths).toEqual(['a.pdf', 'b.pdf']);
    });

    it('deve manter creatorUserId indefinido em atualizações (id presente)', () => {
      const entity = build({ id: 99, creatorUserId: undefined });

      expect(entity.creatorUserId).toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Identificadores
  // -------------------------------------------------------------------------
  describe('validação de identificadores', () => {
    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -5],
    ])('deve rejeitar d5NoteId %s', (_label, value) => {
      expectBadRequest(() => build({ d5NoteId: value }), MSG.d5NoteId);
    });

    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -1],
    ])('deve exigir creatorUserId na criação quando %s', (_label, value) => {
      expectBadRequest(
        () => build({ id: undefined, creatorUserId: value }),
        MSG.creator,
      );
    });

    it('não deve exigir creatorUserId quando o id já existe', () => {
      expect(() => build({ id: 7, creatorUserId: undefined })).not.toThrow();
    });

    it.each([
      ['ausente', undefined],
      ['zero', 0],
      ['negativo', -3],
    ])('deve rejeitar modifyingUserId %s', (_label, value) => {
      expectBadRequest(() => build({ modifyingUserId: value }), MSG.modifier);
    });
  });

  // -------------------------------------------------------------------------
  // Data de programação
  // -------------------------------------------------------------------------
  describe('validação de dataProg', () => {
    it('deve rejeitar dataProg ausente', () => {
      expectBadRequest(() => build({ dataProg: undefined }), MSG.dataProg);
    });

    it('deve rejeitar dataProg com valor inválido (NaN)', () => {
      expectBadRequest(
        () => build({ dataProg: new Date('xpto') }),
        MSG.dataProg,
      );
    });

    it('deve aceitar uma data válida', () => {
      expect(() => build({ dataProg: new Date() })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Janela horária
  // -------------------------------------------------------------------------
  describe('validação de horários', () => {
    it('deve rejeitar apenas hora de início', () => {
      expectBadRequest(
        () => build({ startTime: '08:00', finishTime: undefined }),
        MSG.timeWindow,
      );
    });

    it('deve rejeitar apenas hora de término', () => {
      expectBadRequest(
        () => build({ startTime: undefined, finishTime: '17:00' }),
        MSG.timeWindow,
      );
    });

    it('deve aceitar ambas as horas preenchidas', () => {
      expect(() =>
        build({ startTime: '08:00', finishTime: '17:00' }),
      ).not.toThrow();
    });

    it('deve aceitar ambas as horas omitidas', () => {
      expect(() => build()).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Limites de texto
  // -------------------------------------------------------------------------
  describe('validação de limites de texto', () => {
    it('deve rejeitar responsibility com mais de 50 caracteres', () => {
      expectBadRequest(
        () => build({ responsibility: 'Y'.repeat(51) }),
        MSG.responsibility,
      );
    });

    it('deve aceitar responsibility com exatamente 50 caracteres (limite)', () => {
      expect(() => build({ responsibility: 'Y'.repeat(50) })).not.toThrow();
    });

    it.each([
      ['vazio', ''],
      ['omitido', undefined],
    ])('deve aceitar responsibility %s', (_label, responsibility) => {
      expect(() => build({ responsibility })).not.toThrow();
    });
  });

  // -------------------------------------------------------------------------
  // Ficheiros
  // -------------------------------------------------------------------------
  describe('validação de ficheiros', () => {
    it('deve rejeitar mais de 5 ficheiros', () => {
      expectBadRequest(
        () => buildExecuted({ filePaths: makeFiles(6) }),
        MSG.maxFiles,
      );
    });

    it('deve aceitar exatamente 5 ficheiros (limite)', () => {
      expect(() => buildExecuted({ filePaths: makeFiles(5) })).not.toThrow();
    });

    it('deve rejeitar ficheiros duplicados', () => {
      expectBadRequest(
        () => buildExecuted({ filePaths: ['a.pdf', 'a.pdf'] }),
        MSG.duplicatedFiles,
      );
    });

    it('deve validar o limite antes da regra de execução', () => {
      // 6 ficheiros SEM execução: deve falhar pelo limite, não pela execução
      expectBadRequest(() => build({ filePaths: makeFiles(6) }), MSG.maxFiles);
    });

    it('deve validar duplicidade antes da regra de execução', () => {
      // Duplicados SEM execução: deve falhar por duplicidade, não pela execução
      expectBadRequest(
        () => build({ filePaths: ['a.pdf', 'a.pdf'] }),
        MSG.duplicatedFiles,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Campos de execução — SEM execução
  // -------------------------------------------------------------------------
  describe('campos de execução: sem execução', () => {
    it('deve aceitar ausência de execução sem anexos nem observação', () => {
      expect(() => build()).not.toThrow();
    });

    it('deve rejeitar anexos sem execução informada', () => {
      expectBadRequest(
        () => build({ filePaths: ['a.pdf'] }),
        MSG.filesWithoutExec,
      );
    });

    it('deve rejeitar observação de execução sem execução informada', () => {
      expectBadRequest(
        () => build({ executionObservation: 'concluído' }),
        MSG.observationWithoutExec,
      );
    });

    it('deve priorizar o erro de anexos quando há anexos e observação sem execução', () => {
      expectBadRequest(
        () =>
          build({ filePaths: ['a.pdf'], executionObservation: 'concluído' }),
        MSG.filesWithoutExec,
      );
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['zero', 0],
    ])('deve tratar exec %s como ausência de execução', (_label, exec) => {
      expectBadRequest(
        () => build({ exec, filePaths: ['a.pdf'] }),
        MSG.filesWithoutExec,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Campos de execução — COM execução
  // -------------------------------------------------------------------------
  describe('campos de execução: com execução', () => {
    it('deve aceitar execução com ficheiros e observação', () => {
      expect(() => buildExecuted()).not.toThrow();
    });

    it.each([
      ['vazio', []],
      ['omitido', undefined],
    ])(
      'deve exigir ao menos um ficheiro quando filePaths é %s',
      (_l, files) => {
        expectBadRequest(
          () => buildExecuted({ filePaths: files }),
          MSG.filesRequired,
        );
      },
    );

    it.each([
      ['ausente', undefined],
      ['vazia', ''],
      ['apenas espaços', '   '],
    ])('deve exigir observação quando ela é %s', (_label, observation) => {
      expectBadRequest(
        () => buildExecuted({ executionObservation: observation }),
        MSG.observationRequired,
      );
    });

    it('deve exigir ficheiros antes de validar a observação', () => {
      expectBadRequest(
        () => buildExecuted({ filePaths: [], executionObservation: undefined }),
        MSG.filesRequired,
      );
    });
  });

  // -------------------------------------------------------------------------
  // toPublicProps
  // -------------------------------------------------------------------------
  describe('toPublicProps', () => {
    it('deve expor os campos específicos do D5 em conjunto com os base', () => {
      const props = buildExecuted({ filePaths: ['a.pdf'] }).toPublicProps();

      expect(props).toMatchObject({
        d5NoteId: 1,
        creatorUserId: 10,
        modifyingUserId: 20,
        filePaths: ['a.pdf'],
        executionObservation: 'Poste instalado',
      });
    });

    it('deve expor filePaths como array vazio quando não informado', () => {
      expect(build().toPublicProps().filePaths).toEqual([]);
    });

    it('deve produzir props reutilizáveis para reconstruir a entidade (sem execução)', () => {
      const original = build();
      const rebuilt = D5NoteSchedule.create(original.toPublicProps());

      expect(rebuilt.toPublicProps()).toEqual(original.toPublicProps());
    });

    it('deve produzir props reutilizáveis para reconstruir a entidade (com execução)', () => {
      const original = buildExecuted();
      const rebuilt = D5NoteSchedule.create(original.toPublicProps());

      expect(rebuilt.toPublicProps()).toEqual(original.toPublicProps());
    });
  });

  // -------------------------------------------------------------------------
  // withChanges
  // -------------------------------------------------------------------------
  describe('withChanges', () => {
    it('deve devolver uma nova instância sem mutar a original', () => {
      const original = build();
      const updated = original.withChanges({ modifyingUserId: 55 });

      expect(updated).toBeInstanceOf(D5NoteSchedule);
      expect(updated).not.toBe(original);
      expect(updated.modifyingUserId).toBe(55);
      expect(original.modifyingUserId).toBe(20);
    });

    it('deve preservar d5NoteId e creatorUserId mesmo que venham nas alterações', () => {
      const updated = build().withChanges(
        changes({ d5NoteId: 999, creatorUserId: 999 }),
      );

      expect(updated.d5NoteId).toBe(1);
      expect(updated.creatorUserId).toBe(10);
    });

    it('deve manter os valores originais quando não há alterações', () => {
      const original = buildExecuted();

      expect(original.withChanges({}).toPublicProps()).toEqual(
        original.toPublicProps(),
      );
    });

    it('deve revalidar as regras de negócio na alteração', () => {
      expectBadRequest(
        () => build().withChanges({ modifyingUserId: 0 }),
        MSG.modifier,
      );
    });

    describe('registo de execução', () => {
      it('deve permitir registar execução com ficheiros e observação', () => {
        const updated = build().withChanges(
          changes({
            exec: 10,
            filePaths: ['a.pdf'],
            executionObservation: 'ok',
          }),
        );

        expect(updated.filePaths).toEqual(['a.pdf']);
        expect(updated.toPublicProps()).toMatchObject({
          executionObservation: 'ok',
        });
      });

      it('deve rejeitar registar execução sem ficheiros', () => {
        expectBadRequest(
          () =>
            build().withChanges(
              changes({ exec: 10, executionObservation: 'ok' }),
            ),
          MSG.filesRequired,
        );
      });

      it('deve rejeitar registar execução sem observação', () => {
        expectBadRequest(
          () =>
            build().withChanges(changes({ exec: 10, filePaths: ['a.pdf'] })),
          MSG.observationRequired,
        );
      });

      it('deve rejeitar remover a execução mantendo os anexos', () => {
        expectBadRequest(
          () => buildExecuted().withChanges(changes({ exec: null })),
          MSG.filesWithoutExec,
        );
      });

      it('deve permitir remover a execução junto com anexos e observação', () => {
        const updated = buildExecuted().withChanges(
          changes({
            exec: null,
            filePaths: [],
            executionObservation: undefined,
          }),
        );

        expect(updated.filePaths).toEqual([]);
      });
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
        MSG.d5NoteId,
      );
    });
  });

  // -------------------------------------------------------------------------
  // Imutabilidade
  // -------------------------------------------------------------------------
  describe('imutabilidade', () => {
    it('não deve alterar a instância original ao chamar withChanges', () => {
      const entity = buildExecuted();
      const snapshot = entity.toPublicProps();

      entity.withChanges({ modifyingUserId: 77 });

      expect(entity.toPublicProps()).toEqual(snapshot);
    });
  });
});
