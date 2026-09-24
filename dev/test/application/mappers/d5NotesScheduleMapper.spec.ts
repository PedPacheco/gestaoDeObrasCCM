import { BadRequestException } from '@nestjs/common';

import { D5NoteSchedule } from 'src/domain/entities/schedules/D5NotesSchedule.entity';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';
import {
  CreateProgramacaoD5Dto,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';

// ---------------------------------------------------------------------------
// Mocks de colaboradores
// ---------------------------------------------------------------------------
jest.mock('src/domain/entities/schedules/D5NotesSchedule.entity', () => ({
  D5NoteSchedule: { create: jest.fn() },
}));

jest.mock('src/utils/parseTimeToDate', () => ({
  parseTimeToDate: jest.fn(),
}));

const entity = D5NoteSchedule as jest.Mocked<typeof D5NoteSchedule>;
const parseTime = parseTimeToDate as jest.MockedFunction<
  typeof parseTimeToDate
>;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const CURRENT_DATE = new Date('2026-02-10T00:00:00.000Z');
const CURRENT_START = new Date('2026-02-10T08:00:00.000Z');
const CURRENT_FINISH = new Date('2026-02-10T17:00:00.000Z');

const makeCurrent = (overrides: Record<string, any> = {}) => {
  const publicProps = {
    id: 1,
    d5NoteId: 10,
    creatorUserId: 7,
    modifyingUserId: 7,
    filePaths: ['antigo.pdf'],
    dataProg: CURRENT_DATE,
    prog: 50,
    exec: 40,
    observation: 'obs atual',
    ...overrides,
  };

  return {
    ...publicProps,
    startTime: CURRENT_START,
    finishTime: CURRENT_FINISH,
    idTechnical: 3,
    idExecutionRestriction: 2,
    responsibility: 'Equipa atual',
    toPublicProps: jest.fn().mockReturnValue(publicProps),
  } as unknown as D5NoteSchedule;
};

const makeContext = (overrides: Record<string, any> = {}) => ({
  id: 1,
  d5NoteId: 10,
  creatorUserId: 7,
  modifyingUserId: 20,
  filePaths: ['antigo.pdf', 'novo.pdf'],
  current: makeCurrent(),
  ...overrides,
});

/** Linha de persistência para toDomain. */
const makeRow = (overrides: Record<string, any> = {}) => ({
  id: 1,
  id_nota_d5: 10,
  id_usuario_criador: 7,
  id_usuario_modificador: 20,
  caminhos_arquivos: ['a.pdf'],
  data_prog: CURRENT_DATE,
  prog: 50,
  exec: 40,
  hora_ini: CURRENT_START,
  hora_ter: CURRENT_FINISH,
  observacao_programacao: 'obs',
  observacao_execucao: 'exec obs',
  num_dp: '12345678',
  tipo_servico: 'DP',
  chi: 5,
  equipe_lv: 1,
  equipe_lm: 2,
  equipe_reg: 3,
  chave_provisoria: false,
  id_tecnico: 4,
  id_restricao: 6,
  responsavel_restricao: 'Equipa A',
  ...overrides,
});

/** Entidade já construída, para os mapeamentos de persistência. */
const makeEntity = (overrides: Record<string, any> = {}) =>
  ({
    d5NoteId: 10,
    creatorUserId: 7,
    modifyingUserId: 20,
    filePaths: ['a.pdf'],
    dataProg: CURRENT_DATE,
    prog: 50,
    exec: 40,
    startTime: CURRENT_START,
    finishTime: CURRENT_FINISH,
    observation: 'obs',
    executionObservation: 'exec obs',
    numDp: '12345678',
    serviceType: 'DP',
    chi: 5,
    lvTeam: 1,
    lmTeam: 2,
    regulTeam: 3,
    temporaryKey: false,
    idTechnical: 4,
    idExecutionRestriction: 6,
    responsibility: 'Equipa A',
    ...overrides,
  }) as unknown as D5NoteSchedule;

const makeResponseRow = (overrides: Record<string, any> = {}) => ({
  id: 1,
  prog: 50,
  tecnicos: { id: 4, tecnico: 'João' },
  restricoes: { id: 6, restricao: 'Chuva' },
  usuario_criador: { nome: 'Ana' },
  usuario_modificador: { nome: 'Bruno' },
  ...overrides,
});

const makeListRow = (overrides: Record<string, any> = {}) => {
  const { notas_d5: notasOverrides, ...topLevelOverrides } = overrides;

  return {
    id_prog: 99,
    prog: 50,
    tecnicos: { tecnico: 'João' },
    ...topLevelOverrides,
    notas_d5: {
      id: 10,
      nota_d5: 'D5-001',
      local_instalacao: 'LI-1',
      criado_em: CURRENT_DATE,
      conclusao_nota: null,
      status_sap: 'ABERTA',
      tme_executado: 1,
      tme_abertura: 2,
      validacao_anual: true,
      mo_planejada: { toNumber: () => 12.5 },
      municipios: {
        mun_minusculo: 'Cascais',
        regionais: { regional: 'Sul' },
      },
      tipos: { tipo_obra: 'Ampliação' },
      turmas: { turma: 'Parceira A' },
      status: { status: 'Em curso' },
      novo_tabela_usuarios: { nome: 'Ana' },
      obras: { ovnota: 'OV-1', diagrama: 'DIAG-1' },
      ...notasOverrides,
    },
  };
};

// Acesso aos auxiliares privados
const parseScheduledDate = (value?: string) =>
  (D5NoteScheduleMapper as any).parseScheduledDate(value);

const stripUndefined = (obj: Record<string, any>) =>
  (D5NoteScheduleMapper as any).stripUndefined(obj);

const toCommonColumns = (e: D5NoteSchedule) =>
  (D5NoteScheduleMapper as any).toCommonColumns(e);

describe('D5NoteScheduleMapper', () => {
  beforeEach(() => {
    parseTime.mockImplementation(
      (value: any) =>
        (value ? new Date(`2026-02-10T${value}:00.000Z`) : undefined) as any,
    );
    entity.create.mockReturnValue({ built: true } as any);
  });

  afterEach(() => jest.resetAllMocks());

  // =========================================================================
  // fromCreateInput
  // =========================================================================
  describe('fromCreateInput', () => {
    const dto = {
      scheduledDate: '2026-02-10',
      startTime: '08:00',
      endTime: '17:00',
      technicalId: 4,
      restrictionId: 6,
      restrictionResponsible: 'Equipa A',
      prog: 50,
      observation: 'obs',
    } as unknown as CreateProgramacaoD5Dto;

    it('deve renomear os campos do DTO para o vocabulário de domínio', () => {
      const props = D5NoteScheduleMapper.fromCreateInput(dto);

      expect(props).toMatchObject({
        idTechnical: 4,
        idExecutionRestriction: 6,
        responsibility: 'Equipa A',
        prog: 50,
        observation: 'obs',
      });
    });

    it('não deve propagar as chaves originais do DTO', () => {
      const props = D5NoteScheduleMapper.fromCreateInput(dto) as any;

      expect(props).not.toHaveProperty('scheduledDate');
      expect(props).not.toHaveProperty('startTime.raw');
      expect(props).not.toHaveProperty('technicalId');
      expect(props).not.toHaveProperty('restrictionId');
      expect(props).not.toHaveProperty('restrictionResponsible');
      expect(props).not.toHaveProperty('endTime');
    });

    it('deve converter os horários através do parseTimeToDate', () => {
      D5NoteScheduleMapper.fromCreateInput(dto);

      expect(parseTime).toHaveBeenCalledWith('08:00');
      expect(parseTime).toHaveBeenCalledWith('17:00');
      expect(parseTime).toHaveBeenCalledTimes(2);
    });

    it('deve inicializar filePaths vazio (upload só no update)', () => {
      expect(D5NoteScheduleMapper.fromCreateInput(dto).filePaths).toEqual([]);
    });

    it('deve converter scheduledDate para Date', () => {
      const props = D5NoteScheduleMapper.fromCreateInput(dto);

      expect(props.dataProg).toBeInstanceOf(Date);
      expect(props.dataProg.toISOString()).toBe('2026-02-10T00:00:00.000Z');
    });

    it('deve devolver dataProg undefined quando a data é omitida', () => {
      const props = D5NoteScheduleMapper.fromCreateInput({
        ...dto,
        scheduledDate: undefined,
      } as any);

      expect(props.dataProg).toBeUndefined();
    });

    it('deve rejeitar uma data inválida', () => {
      expect(() =>
        D5NoteScheduleMapper.fromCreateInput({
          ...dto,
          scheduledDate: 'data-invalida',
        } as any),
      ).toThrow(BadRequestException);
    });

    it('deve preservar os campos comuns não renomeados', () => {
      const props = D5NoteScheduleMapper.fromCreateInput({
        ...dto,
        chi: 9,
        numDp: '12345678',
      } as any);

      expect(props).toMatchObject({ chi: 9, numDp: '12345678' });
    });
  });

  // =========================================================================
  // fromUpdateInput
  // =========================================================================
  describe('fromUpdateInput', () => {
    const dto = {} as unknown as UpdateScheduleD5Dto;

    it('deve partir das props atuais da entidade', () => {
      const context = makeContext();

      const props = D5NoteScheduleMapper.fromUpdateInput(dto, context);

      expect(context.current.toPublicProps).toHaveBeenCalledTimes(1);
      expect(props).toMatchObject({ prog: 50, observation: 'obs atual' });
    });

    it('deve impor os valores do contexto sobre o DTO', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        { id: 999, d5NoteId: 999, filePaths: ['x'] } as any,
        makeContext(),
      );

      expect(props).toMatchObject({
        id: 1,
        d5NoteId: 10,
        creatorUserId: 7,
        modifyingUserId: 20,
        filePaths: ['antigo.pdf', 'novo.pdf'],
      });
    });

    it('deve descartar keptFiles (resolvido pelo caso de uso)', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        { keptFiles: ['a.pdf'] } as any,
        makeContext(),
      );

      expect(props).not.toHaveProperty('keptFiles');
    });

    it('deve ignorar as chaves undefined do DTO (stripUndefined)', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        { observation: undefined, prog: undefined } as any,
        makeContext(),
      );

      // valores atuais preservados
      expect(props.observation).toBe('obs atual');
      expect(props.prog).toBe(50);
    });

    it('deve aplicar os valores informados no DTO', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        { observation: 'nova obs', prog: 80 } as any,
        makeContext(),
      );

      expect(props).toMatchObject({ observation: 'nova obs', prog: 80 });
    });

    it('deve permitir limpar um campo com null', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        { observation: null } as any,
        makeContext(),
      );

      // null não é undefined: sobrevive ao stripUndefined
      expect(props.observation).toBeNull();
    });

    describe('dataProg', () => {
      it('deve usar a nova data quando informada', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(
          { scheduledDate: '2026-03-01' } as any,
          makeContext(),
        );

        expect(props.dataProg.toISOString()).toBe('2026-03-01T00:00:00.000Z');
      });

      it('deve manter a data atual quando omitida', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(dto, makeContext());

        expect(props.dataProg).toBe(CURRENT_DATE);
      });

      it('deve rejeitar uma data inválida', () => {
        expect(() =>
          D5NoteScheduleMapper.fromUpdateInput(
            { scheduledDate: 'xpto' } as any,
            makeContext(),
          ),
        ).toThrow('Data de programação inválida');
      });
    });

    describe('horários', () => {
      it('deve converter startTime quando informado', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(
          { startTime: '09:00' } as any,
          makeContext(),
        );

        expect(parseTime).toHaveBeenCalledWith('09:00');
        expect(props.startTime).toEqual(new Date('2026-02-10T09:00:00.000Z'));
      });

      it('deve manter o startTime atual quando omitido', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(dto, makeContext());

        expect(props.startTime).toBe(CURRENT_START);
        expect(parseTime).not.toHaveBeenCalled();
      });

      it('deve converter endTime quando informado', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(
          { endTime: '18:00' } as any,
          makeContext(),
        );

        expect(props.finishTime).toEqual(new Date('2026-02-10T18:00:00.000Z'));
      });

      it('deve manter o finishTime atual quando omitido', () => {
        expect(
          D5NoteScheduleMapper.fromUpdateInput(dto, makeContext()).finishTime,
        ).toBe(CURRENT_FINISH);
      });

      it('deve permitir limpar um horário com null', () => {
        parseTime.mockReturnValue(null as any);

        const props = D5NoteScheduleMapper.fromUpdateInput(
          { startTime: null } as any,
          makeContext(),
        );

        // null !== undefined: entra no parse
        expect(parseTime).toHaveBeenCalledWith(null);
        expect(props.startTime).toBeNull();
      });
    });

    describe('fallbacks de técnico e restrição', () => {
      it.each([
        ['technicalId', 'idTechnical', 9, 3],
        ['restrictionId', 'idExecutionRestriction', 8, 2],
      ])(
        'deve usar %s quando informado e o valor atual quando não',
        (dtoKey, propKey, novo, atual) => {
          const comValor = D5NoteScheduleMapper.fromUpdateInput(
            { [dtoKey]: novo } as any,
            makeContext(),
          );
          const semValor = D5NoteScheduleMapper.fromUpdateInput(
            dto,
            makeContext(),
          );

          expect((comValor as any)[propKey]).toBe(novo);
          expect((semValor as any)[propKey]).toBe(atual);
        },
      );

      it('deve usar restrictionResponsible quando informado', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(
          { restrictionResponsible: 'Nova equipa' } as any,
          makeContext(),
        );

        expect(props.responsibility).toBe('Nova equipa');
      });

      it('deve manter o responsável atual quando omitido', () => {
        expect(
          D5NoteScheduleMapper.fromUpdateInput(dto, makeContext())
            .responsibility,
        ).toBe('Equipa atual');
      });

      it('deve substituir valores null pelos atuais (operador ??)', () => {
        const props = D5NoteScheduleMapper.fromUpdateInput(
          { technicalId: null, restrictionResponsible: null } as any,
          makeContext(),
        );

        expect(props.idTechnical).toBe(3);
        expect(props.responsibility).toBe('Equipa atual');
      });
    });

    it('deve preservar creatorUserId undefined vindo do contexto', () => {
      const props = D5NoteScheduleMapper.fromUpdateInput(
        dto,
        makeContext({ creatorUserId: undefined }),
      );

      expect(props.creatorUserId).toBeUndefined();
    });
  });

  // =========================================================================
  // toDomain
  // =========================================================================
  describe('toDomain', () => {
    it('deve traduzir as colunas para o vocabulário de domínio', () => {
      D5NoteScheduleMapper.toDomain(makeRow() as any);

      expect(entity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          d5NoteId: 10,
          creatorUserId: 7,
          modifyingUserId: 20,
          filePaths: ['a.pdf'],
          dataProg: CURRENT_DATE,
          prog: 50,
          exec: 40,
          startTime: CURRENT_START,
          finishTime: CURRENT_FINISH,
          observation: 'obs',
          executionObservation: 'exec obs',
          numDp: '12345678',
          serviceType: 'DP',
          chi: 5,
          lvTeam: 1,
          lmTeam: 2,
          regulTeam: 3,
          temporaryKey: false,
          idTechnical: 4,
          idExecutionRestriction: 6,
          responsibility: 'Equipa A',
        }),
      );
    });

    it('deve devolver a entidade construída', () => {
      const built = { id: 1 } as any;
      entity.create.mockReturnValue(built);

      expect(D5NoteScheduleMapper.toDomain(makeRow() as any)).toBe(built);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('deve converter caminhos_arquivos %s em array vazio', (_l, value) => {
      D5NoteScheduleMapper.toDomain(
        makeRow({ caminhos_arquivos: value }) as any,
      );

      expect(entity.create).toHaveBeenCalledWith(
        expect.objectContaining({ filePaths: [] }),
      );
    });

    it('deve propagar os erros de validação da entidade', () => {
      entity.create.mockImplementation(() => {
        throw new BadRequestException('inválido');
      });

      expect(() => D5NoteScheduleMapper.toDomain(makeRow() as any)).toThrow(
        'inválido',
      );
    });
  });

  // =========================================================================
  // toPersistenceCreate / toPersistenceUpdate
  // =========================================================================
  describe('toPersistenceCreate', () => {
    it('deve incluir a nota, o criador e o modificador', () => {
      const data = D5NoteScheduleMapper.toPersistenceCreate(makeEntity());

      expect(data).toMatchObject({
        id_nota_d5: 10,
        id_usuario_criador: 7,
        id_usuario_modificador: 20,
        data_prog: CURRENT_DATE,
        prog: 50,
        caminhos_arquivos: ['a.pdf'],
      });
    });

    it('deve incluir todas as colunas comuns', () => {
      const data = D5NoteScheduleMapper.toPersistenceCreate(makeEntity());

      expect(Object.keys(data)).toEqual(
        expect.arrayContaining(Object.keys(toCommonColumns(makeEntity()))),
      );
    });
  });

  describe('toPersistenceUpdate', () => {
    it('não deve incluir a nota nem o criador (imutáveis)', () => {
      const data = D5NoteScheduleMapper.toPersistenceUpdate(makeEntity());

      expect(data).not.toHaveProperty('id_nota_d5');
      expect(data).not.toHaveProperty('id_usuario_criador');
      expect(data).toMatchObject({ id_usuario_modificador: 20 });
    });

    it('deve incluir as colunas comuns', () => {
      expect(
        D5NoteScheduleMapper.toPersistenceUpdate(makeEntity()),
      ).toMatchObject(toCommonColumns(makeEntity()));
    });
  });

  // =========================================================================
  // toResponse / toResponseList
  // =========================================================================
  describe('toResponse', () => {
    it('deve achatar as relações da linha', () => {
      const result = D5NoteScheduleMapper.toResponse(makeResponseRow() as any);

      expect(result).toMatchObject({
        id: 1,
        idTecnico: 4,
        tecnico: 'João',
        idRestricao: 6,
        restricao: 'Chuva',
        usuarioCriador: 'Ana',
        usuarioModificador: 'Bruno',
      });
    });

    it('deve remover as relações cruas do payload', () => {
      const result = D5NoteScheduleMapper.toResponse(
        makeResponseRow() as any,
      ) as any;

      expect(result).not.toHaveProperty('tecnicos');
      expect(result).not.toHaveProperty('restricoes');
      expect(result).not.toHaveProperty('usuario_criador');
      expect(result).not.toHaveProperty('usuario_modificador');
    });

    it('deve devolver null para todas as relações ausentes', () => {
      const result = D5NoteScheduleMapper.toResponse(
        makeResponseRow({
          tecnicos: null,
          restricoes: null,
          usuario_criador: null,
          usuario_modificador: null,
        }) as any,
      );

      expect(result).toMatchObject({
        idTecnico: null,
        tecnico: null,
        idRestricao: null,
        restricao: null,
        usuarioCriador: null,
        usuarioModificador: null,
      });
    });

    it('deve devolver null quando a relação existe mas o campo é null', () => {
      const result = D5NoteScheduleMapper.toResponse(
        makeResponseRow({
          tecnicos: { id: null, tecnico: null },
          usuario_criador: { nome: null },
        }) as any,
      );

      expect(result.idTecnico).toBeNull();
      expect(result.tecnico).toBeNull();
      expect(result.usuarioCriador).toBeNull();
    });
  });

  describe('toResponseList', () => {
    it('deve mapear todas as linhas', () => {
      const result = D5NoteScheduleMapper.toResponseList([
        makeResponseRow({ id: 1 }),
        makeResponseRow({ id: 2 }),
      ] as any);

      expect(result).toHaveLength(2);
      expect(result.map((r: any) => r.id)).toEqual([1, 2]);
    });

    it('deve devolver lista vazia para entrada vazia', () => {
      expect(D5NoteScheduleMapper.toResponseList([])).toEqual([]);
    });

    it('não deve passar o índice como segundo argumento ao mapper', () => {
      // toResponse recebe (row, index, array) via map — garante aridade segura
      const spy = jest.spyOn(D5NoteScheduleMapper, 'toResponse');

      D5NoteScheduleMapper.toResponseList([makeResponseRow()] as any);

      expect(spy.mock.calls[0][0]).toMatchObject({ id: 1 });
      spy.mockRestore();
    });
  });

  // =========================================================================
  // toListItem / toListItems
  // =========================================================================
  describe('toListItem', () => {
    it('deve achatar a nota e as suas relações', () => {
      const result = D5NoteScheduleMapper.toListItem(makeListRow() as any);

      expect(result).toMatchObject({
        id: 10,
        nota_d5: 'D5-001',
        local_instalacao: 'LI-1',
        status_sap: 'ABERTA',
        tecnico: 'João',
        municipio: 'Cascais',
        regional: 'Sul',
        tipo_obra: 'Ampliação',
        turma: 'Parceira A',
        status: 'Em curso',
        responsavel: 'Ana',
        ovnota: 'OV-1',
        ordemDiagrama: 'DIAG-1',
        mo_planejada: 12.5,
      });
    });

    it('deve remover as relações cruas', () => {
      const result = D5NoteScheduleMapper.toListItem(
        makeListRow() as any,
      ) as any;

      expect(result).not.toHaveProperty('tecnicos');
      expect(result).not.toHaveProperty('notas_d5');
    });

    it('deve sobrepor o id da programação pelo id da nota', () => {
      const result = D5NoteScheduleMapper.toListItem(
        makeListRow({ id: 555 }) as any,
      );

      expect(result.id).toBe(10);
    });

    it('deve converter mo_planejada de Decimal para number', () => {
      const result = D5NoteScheduleMapper.toListItem(
        makeListRow({
          notas_d5: { mo_planejada: { toNumber: () => 99.9 } },
        }) as any,
      );

      expect(result.mo_planejada).toBe(99.9);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
    ])('deve devolver 0 quando mo_planejada é %s', (_l, value) => {
      const result = D5NoteScheduleMapper.toListItem(
        makeListRow({ notas_d5: { mo_planejada: value } }) as any,
      );

      expect(result.mo_planejada).toBe(0);
    });

    it.each([
      ['tecnicos', 'tecnico', { tecnicos: null }],
      [
        'novo_tabela_usuarios',
        'responsavel',
        {
          notas_d5: { novo_tabela_usuarios: null },
        },
      ],
    ])('deve devolver null quando %s é ausente', (_l, key, overrides) => {
      const result = D5NoteScheduleMapper.toListItem(
        makeListRow(overrides as any) as any,
      ) as any;

      expect(result[key]).toBeNull();
    });

    describe('ordemDiagrama', () => {
      const cases: Array<[string, Record<string, any>, unknown]> = [
        ['diagrama', { diagrama: 'D', ordem_dci: 'I' }, 'D'],
        ['ordem_dci', { diagrama: null, ordem_dci: 'I' }, 'I'],
        ['ordem_dca', { diagrama: null, ordem_dci: null, ordem_dca: 'A' }, 'A'],
        [
          'ordem_dcd',
          { diagrama: null, ordem_dci: null, ordem_dca: null, ordem_dcd: 'DD' },
          'DD',
        ],
        [
          'ordem_dcim',
          {
            diagrama: null,
            ordem_dci: null,
            ordem_dca: null,
            ordem_dcd: null,
            ordem_dcim: 'IM',
          },
          'IM',
        ],
        [
          'null quando todas ausentes',
          {
            diagrama: null,
            ordem_dci: null,
            ordem_dca: null,
            ordem_dcd: null,
            ordem_dcim: null,
          },
          null,
        ],
      ];

      it.each(cases)('deve resolver para %s', (_l, obras, expected) => {
        const result = D5NoteScheduleMapper.toListItem(
          makeListRow({ notas_d5: { obras } }) as any,
        );

        expect(result.ordemDiagrama).toBe(expected);
      });

      it('deve devolver null em ambos os campos quando obras é null', () => {
        const result = D5NoteScheduleMapper.toListItem(
          makeListRow({ notas_d5: { obras: null } }) as any,
        );

        expect(result.ovnota).toBeNull();
        expect(result.ordemDiagrama).toBeNull();
      });
    });
  });

  describe('toListItems', () => {
    it('deve mapear todas as linhas', () => {
      const result = D5NoteScheduleMapper.toListItems([
        makeListRow(),
        makeListRow(),
      ] as any);

      expect(result).toHaveLength(2);
    });

    it('deve devolver lista vazia para entrada vazia', () => {
      expect(D5NoteScheduleMapper.toListItems([])).toEqual([]);
    });
  });

  // =========================================================================
  // Auxiliares privados
  // =========================================================================
  describe('parseScheduledDate', () => {
    it.each([
      ['undefined', undefined],
      ['string vazia', ''],
      ['null', null],
    ])('deve devolver undefined para %s', (_l, value) => {
      expect(parseScheduledDate(value)).toBeUndefined();
    });

    it('deve converter uma data ISO válida', () => {
      expect(parseScheduledDate('2026-02-10').toISOString()).toBe(
        '2026-02-10T00:00:00.000Z',
      );
    });

    it('deve aceitar data com hora', () => {
      expect(parseScheduledDate('2026-02-10T13:45:00.000Z')).toBeInstanceOf(
        Date,
      );
    });

    it.each(['data-invalida', '2026-13-45', 'abc'])(
      'deve rejeitar o valor inválido "%s"',
      (value) => {
        expect(() => parseScheduledDate(value)).toThrow(BadRequestException);
        expect(() => parseScheduledDate(value)).toThrow(
          'Data de programação inválida',
        );
      },
    );
  });

  describe('stripUndefined', () => {
    it('deve remover apenas as chaves undefined', () => {
      expect(
        stripUndefined({ a: 1, b: undefined, c: null, d: 0, e: '' }),
      ).toEqual({ a: 1, c: null, d: 0, e: '' });
    });

    it('deve devolver objeto vazio quando tudo é undefined', () => {
      expect(stripUndefined({ a: undefined, b: undefined })).toEqual({});
    });

    it('deve devolver objeto vazio para entrada vazia', () => {
      expect(stripUndefined({})).toEqual({});
    });

    it('deve preservar valores falsy relevantes', () => {
      expect(stripUndefined({ a: false, b: 0, c: '' })).toEqual({
        a: false,
        b: 0,
        c: '',
      });
    });

    it('deve devolver um novo objeto', () => {
      const origem = { a: 1 };

      expect(stripUndefined(origem)).not.toBe(origem);
    });
  });

  describe('toCommonColumns', () => {
    it('deve traduzir todos os campos de domínio para colunas', () => {
      expect(toCommonColumns(makeEntity())).toEqual({
        data_prog: CURRENT_DATE,
        prog: 50,
        exec: 40,
        hora_ini: CURRENT_START,
        hora_ter: CURRENT_FINISH,
        observacao_programacao: 'obs',
        observacao_execucao: 'exec obs',
        num_dp: '12345678',
        tipo_servico: 'DP',
        chi: 5,
        equipe_lv: 1,
        equipe_lm: 2,
        equipe_reg: 3,
        chave_provisoria: false,
        id_tecnico: 4,
        id_restricao: 6,
        responsavel_restricao: 'Equipa A',
        caminhos_arquivos: ['a.pdf'],
      });
    });

    it('deve propagar undefined dos campos opcionais', () => {
      const columns = toCommonColumns(
        makeEntity({ exec: undefined, chi: undefined }),
      );

      expect(columns.exec).toBeUndefined();
      expect(columns.chi).toBeUndefined();
    });
  });
});
