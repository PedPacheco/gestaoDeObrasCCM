import { BadRequestException } from '@nestjs/common';

import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';
import { SchedulesDataDTO } from 'src/interface/dtos/scheduleDTO';
import { UpdateSchedulesInterface } from 'src/interface/types/schedule/updateSchedulesInterface';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';

// ---------------------------------------------------------------------------
// Mocks de colaboradores
// ---------------------------------------------------------------------------
jest.mock('src/domain/entities/schedules/workSchedule.entity', () => ({
  WorkSchedule: { create: jest.fn() },
}));

jest.mock('src/utils/parseTimeToDate', () => ({
  parseTimeToDate: jest.fn(),
}));

const entity = WorkSchedule as jest.Mocked<typeof WorkSchedule>;
const parseTime = parseTimeToDate as jest.MockedFunction<
  typeof parseTimeToDate
>;

// ---------------------------------------------------------------------------
// Factories
// ---------------------------------------------------------------------------
const DATA_PROG = new Date('2026-02-10T00:00:00.000Z');
const START = new Date('2026-02-10T08:00:00.000Z');
const FINISH = new Date('2026-02-10T17:00:00.000Z');

const makeRow = (overrides: Record<string, any> = {}) => ({
  id: 1,
  id_obra: 10,
  data_prog: DATA_PROG,
  hora_ini: START,
  hora_ter: FINISH,
  prog: 50,
  exec: 40,
  observacao_programacao: 'obs',
  observacao_execucao: 'exec obs',
  equip_desligado: 'Grua',
  num_dp: '12345678',
  tipo_servico: 'DP',
  chi: 3,
  chave_provisoria: true,
  equipe_linha_morta: 1,
  equipe_linha_viva: 2,
  equipe_regularizacao: 3,
  id_tecnico: 4,
  id_restricao_execucao: 5,
  nome_responsavel_execucao: 'Ana',
  id_status_programacao: 2,
  reprovada: true,
  observacao_restricao: 'Aguarda licença',
  id_usuario_ultima_atualizacao: 7,
  id_restricao_prog1: 8,
  responsabilidade1: 'Equipa A',
  nome_responsavel: 'Bruno',
  area_responsavel1: 'Operações',
  status_restricao1: 'Aberta',
  data_resolucao1: new Date('2026-03-01T00:00:00.000Z'),
  id_restricao_prog2: 9,
  responsabilidade2: 'Equipa B',
  nome_responsavel2: 'Carlos',
  area_responsavel2: 'Manutenção',
  status_restricao2: 'Fechada',
  data_resolucao2: new Date('2026-03-05T00:00:00.000Z'),
  ...overrides,
});

const makeEntity = (overrides: Record<string, any> = {}) =>
  ({
    id: 1,
    idWork: 10,
    dataProg: DATA_PROG,
    startTime: START,
    finishTime: FINISH,
    prog: 50,
    exec: 40,
    observation: 'obs',
    executionObservation: 'exec obs',
    equipment: 'Grua',
    numDp: '12345678',
    tipoServico: undefined,
    serviceType: 'DP',
    chi: 3,
    temporaryKey: true,
    lmTeam: 1,
    lvTeam: 2,
    regulTeam: 3,
    idTechnical: 4,
    idExecutionRestriction: 5,
    responsibility: 'Ana',
    idScheduleStatus: 2,
    rejected: true,
    observationRestriction: 'Aguarda licença',
    idUser: 7,
    idProgRestriction1: 8,
    responsibilityProg: 'Equipa A',
    responsibleName: 'Bruno',
    responsibleArea: 'Operações',
    restrictionStatus: 'Aberta',
    resolutionDate: new Date('2026-03-01T00:00:00.000Z'),
    idProgRestriction2: 9,
    responsibilityProg2: 'Equipa B',
    responsibleName2: 'Carlos',
    responsibleArea2: 'Manutenção',
    restrictionStatus2: 'Fechada',
    resolutionDate2: new Date('2026-03-05T00:00:00.000Z'),
    ...overrides,
  }) as unknown as WorkSchedule;

const makeCreateDto = (
  overrides: Partial<SchedulesDataDTO> = {},
): SchedulesDataDTO =>
  ({
    dataProg: '2026-02-10',
    startTime: '08:00',
    finishTime: '17:00',
    idWork: 10,
    prog: 50,
    ...overrides,
  }) as unknown as SchedulesDataDTO;

const makeUpdateDto = (
  overrides: Partial<UpdateSchedulesInterface> = {},
): UpdateSchedulesInterface =>
  ({
    dataProg: '2026-02-10',
    startTime: '08:00',
    finishTime: '17:00',
    ...overrides,
  }) as unknown as UpdateSchedulesInterface;

describe('WorkScheduleMapper', () => {
  beforeEach(() => {
    parseTime.mockImplementation((value: any) => {
      if (!value) return undefined as any;
      const [h, m] = String(value).split(':');
      return new Date(`2026-02-10T${h}:${m}:00.000Z`) as any;
    });
    entity.create.mockReturnValue({ built: true } as any);
  });

  afterEach(() => jest.resetAllMocks());

  // =========================================================================
  // toDomain
  // =========================================================================
  describe('toDomain', () => {
    it('deve rejeitar quando falta hora_ini', () => {
      expect(() =>
        WorkScheduleMapper.toDomain(makeRow({ hora_ini: null })),
      ).toThrow('horário de início e fim são obrigatórios');
    });

    it('deve rejeitar quando falta hora_ter', () => {
      expect(() =>
        WorkScheduleMapper.toDomain(makeRow({ hora_ter: undefined })),
      ).toThrow(BadRequestException);
    });

    it('deve incluir o id da programação na mensagem de erro', () => {
      expect(() =>
        WorkScheduleMapper.toDomain(makeRow({ id: 42, hora_ini: null })),
      ).toThrow('Programação 42');
    });

    it('deve traduzir as colunas para o vocabulário de domínio', () => {
      WorkScheduleMapper.toDomain(makeRow());

      expect(entity.create).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 1,
          idWork: 10,
          prog: 50,
          exec: 40,
          observation: 'obs',
          executionObservation: 'exec obs',
          equipment: 'Grua',
          numDp: '12345678',
          serviceType: 'DP',
          chi: 3,
          temporaryKey: true,
          lmTeam: 1,
          lvTeam: 2,
          regulTeam: 3,
          idTechnical: 4,
          idExecutionRestriction: 5,
          responsibility: 'Ana',
          idScheduleStatus: 2,
          rejected: true,
          observationRestriction: 'Aguarda licença',
          idUser: 7,
          idProgRestriction1: 8,
          responsibilityProg: 'Equipa A',
          responsibleName: 'Bruno',
          responsibleArea: 'Operações',
          restrictionStatus: 'Aberta',
          idProgRestriction2: 9,
          responsibilityProg2: 'Equipa B',
          responsibleName2: 'Carlos',
          responsibleArea2: 'Manutenção',
          restrictionStatus2: 'Fechada',
        }),
      );
    });

    it('deve converter dataProg, startTime e finishTime via moment', () => {
      const built = WorkScheduleMapper.toDomain(makeRow());
      const [[props]] = entity.create.mock.calls;

      expect(props.dataProg).toEqual(DATA_PROG);
      expect(props.startTime).toEqual(START);
      expect(props.finishTime).toEqual(FINISH);
      expect(built).toEqual({ built: true });
    });

    it('deve devolver a entidade construída', () => {
      const built = { id: 1 } as any;
      entity.create.mockReturnValue(built);

      expect(WorkScheduleMapper.toDomain(makeRow())).toBe(built);
    });

    it('deve propagar erros de validação da entidade', () => {
      entity.create.mockImplementation(() => {
        throw new BadRequestException('regra de domínio');
      });

      expect(() => WorkScheduleMapper.toDomain(makeRow())).toThrow(
        'regra de domínio',
      );
    });

    describe('valores por omissão (??)', () => {
      it.each([
        ['exec', 'exec', undefined],
        ['observation', 'observacao_programacao', undefined],
        ['executionObservation', 'observacao_execucao', undefined],
        ['equipment', 'equip_desligado', undefined],
        ['numDp', 'num_dp', undefined],
        ['serviceType', 'tipo_servico', undefined],
        ['chi', 'chi', undefined],
        ['responsibility', 'nome_responsavel_execucao', undefined],
        ['observationRestriction', 'observacao_restricao', undefined],
        ['idUser', 'id_usuario_ultima_atualizacao', undefined],
        ['responsibilityProg', 'responsabilidade1', undefined],
        ['responsibleName', 'nome_responsavel', undefined],
        ['responsibleArea', 'area_responsavel1', undefined],
        ['restrictionStatus', 'status_restricao1', undefined],
        ['resolutionDate', 'data_resolucao1', undefined],
        ['responsibilityProg2', 'responsabilidade2', undefined],
        ['responsibleName2', 'nome_responsavel2', undefined],
        ['responsibleArea2', 'area_responsavel2', undefined],
        ['restrictionStatus2', 'status_restricao2', undefined],
        ['resolutionDate2', 'data_resolucao2', undefined],
      ])(
        'deve mapear %s como undefined quando a coluna é null',
        (propKey, columnKey) => {
          WorkScheduleMapper.toDomain(makeRow({ [columnKey]: null }));

          const [[props]] = entity.create.mock.calls;
          expect(props[propKey]).toBeUndefined();
        },
      );

      it.each([
        ['temporaryKey', 'chave_provisoria', false],
        ['lmTeam', 'equipe_linha_morta', 0],
        ['lvTeam', 'equipe_linha_viva', 0],
        ['regulTeam', 'equipe_regularizacao', 0],
        ['idTechnical', 'id_tecnico', 1],
        ['idExecutionRestriction', 'id_restricao_execucao', 1],
        ['idScheduleStatus', 'id_status_programacao', 1],
        ['rejected', 'reprovada', false],
        ['idProgRestriction1', 'id_restricao_prog1', 1],
        ['idProgRestriction2', 'id_restricao_prog2', 1],
      ])(
        'deve aplicar o padrão de %s quando a coluna é null',
        (propKey, columnKey, defaultValue) => {
          WorkScheduleMapper.toDomain(makeRow({ [columnKey]: null }));

          const [[props]] = entity.create.mock.calls;
          expect(props[propKey]).toBe(defaultValue);
        },
      );

      it('deve preservar exec igual a zero (não confundir com ausente)', () => {
        WorkScheduleMapper.toDomain(makeRow({ exec: 0 }));

        const [[props]] = entity.create.mock.calls;
        expect(props.exec).toBe(0);
      });

      it('deve preservar chi igual a zero', () => {
        WorkScheduleMapper.toDomain(makeRow({ chi: 0 }));

        const [[props]] = entity.create.mock.calls;
        expect(props.chi).toBe(0);
      });

      it('deve preservar equipas iguais a zero', () => {
        WorkScheduleMapper.toDomain(
          makeRow({
            equipe_linha_morta: 0,
            equipe_linha_viva: 0,
            equipe_regularizacao: 0,
          }),
        );

        const [[props]] = entity.create.mock.calls;
        expect(props.lmTeam).toBe(0);
        expect(props.lvTeam).toBe(0);
        expect(props.regulTeam).toBe(0);
      });

      it('deve preservar temporaryKey false explícito', () => {
        WorkScheduleMapper.toDomain(makeRow({ chave_provisoria: false }));

        const [[props]] = entity.create.mock.calls;
        expect(props.temporaryKey).toBe(false);
      });

      it('deve preservar rejected false explícito', () => {
        WorkScheduleMapper.toDomain(makeRow({ reprovada: false }));

        const [[props]] = entity.create.mock.calls;
        expect(props.rejected).toBe(false);
      });
    });
  });

  // =========================================================================
  // toPersistenceUpdate
  // =========================================================================
  describe('toPersistenceUpdate', () => {
    it('deve traduzir a entidade para as colunas de update', () => {
      const data = WorkScheduleMapper.toPersistenceUpdate(makeEntity());

      expect(data).toEqual({
        id: 1,
        data_prog: DATA_PROG,
        prog: 50,
        exec: 40,
        observacao_programacao: 'obs',
        equip_desligado: 'Grua',
        num_dp: '12345678',
        hora_ini: START,
        hora_ter: FINISH,
        chave_provisoria: true,
        tipo_servico: 'DP',
        chi: 3,
        nome_responsavel_execucao: 'Ana',
        equipe_linha_morta: 1,
        equipe_linha_viva: 2,
        equipe_regularizacao: 3,
        id_restricao_execucao: 5,
        observacao_execucao: 'exec obs',
        id_restricao_prog1: 8,
        responsabilidade1: 'Equipa A',
        nome_responsavel: 'Bruno',
        area_responsavel1: 'Operações',
        status_restricao1: 'Aberta',
        data_resolucao1: new Date('2026-03-01T00:00:00.000Z'),
        id_restricao_prog2: 9,
        responsabilidade2: 'Equipa B',
        nome_responsavel2: 'Carlos',
        area_responsavel2: 'Manutenção',
        status_restricao2: 'Fechada',
        data_resolucao2: new Date('2026-03-05T00:00:00.000Z'),
        id_tecnico: 4,
        observacao_restricao: 'Aguarda licença',
        reprovada: true,
        id_usuario_ultima_atualizacao: 7,
      });
    });

    it('não deve incluir id_obra nem id_usuario (imutáveis no update)', () => {
      const data = WorkScheduleMapper.toPersistenceUpdate(makeEntity()) as any;

      expect(data).not.toHaveProperty('id_obra');
      expect(data).not.toHaveProperty('id_usuario');
    });
  });

  // =========================================================================
  // toPersistenceCreate
  // =========================================================================
  describe('toPersistenceCreate', () => {
    it('deve traduzir a entidade para as colunas de criação', () => {
      const data = WorkScheduleMapper.toPersistenceCreate(makeEntity());

      expect(data).toEqual({
        id_obra: 10,
        data_prog: DATA_PROG,
        prog: 50,
        equip_desligado: 'Grua',
        num_dp: '12345678',
        hora_ini: START,
        hora_ter: FINISH,
        chave_provisoria: true,
        tipo_servico: 'DP',
        chi: 3,
        equipe_linha_morta: 1,
        equipe_linha_viva: 2,
        equipe_regularizacao: 3,
        observacao_execucao: 'exec obs',
        observacao_programacao: 'obs',
        id_tecnico: 4,
        id_usuario: 7,
        id_usuario_ultima_atualizacao: 7,
      });
    });

    it('não deve incluir id nem os blocos de restrição (só existem após o update)', () => {
      const data = WorkScheduleMapper.toPersistenceCreate(makeEntity()) as any;

      expect(data).not.toHaveProperty('id');
      expect(data).not.toHaveProperty('id_restricao_prog1');
      expect(data).not.toHaveProperty('reprovada');
    });

    it('deve usar idUser tanto para id_usuario quanto para id_usuario_ultima_atualizacao', () => {
      const data = WorkScheduleMapper.toPersistenceCreate(
        makeEntity({ idUser: 99 }),
      );

      expect(data.id_usuario).toBe(99);
      expect(data.id_usuario_ultima_atualizacao).toBe(99);
    });
  });

  // =========================================================================
  // fromCreateInput
  // =========================================================================
  describe('fromCreateInput', () => {
    it('deve converter as datas e forçar rejected como false', () => {
      const props = WorkScheduleMapper.fromCreateInput(makeCreateDto());

      expect(props.rejected).toBe(false);
      expect(props.dataProg).toEqual(new Date('2026-02-10'));
      expect(parseTime).toHaveBeenCalledWith('08:00');
      expect(parseTime).toHaveBeenCalledWith('17:00');
    });

    it('deve preservar os campos adicionais do DTO', () => {
      const props = WorkScheduleMapper.fromCreateInput(
        makeCreateDto({ idWork: 55, prog: 80 } as any),
      );

      expect(props).toMatchObject({ idWork: 55, prog: 80 });
    });

    it('deve rejeitar sempre rejected vindo do DTO (forçado a false)', () => {
      const props = WorkScheduleMapper.fromCreateInput(
        makeCreateDto({ rejected: true } as any),
      );

      expect(props.rejected).toBe(false);
    });

    it('deve propagar erro de data inválida', () => {
      expect(() =>
        WorkScheduleMapper.fromCreateInput(
          makeCreateDto({ dataProg: 'xpto' } as any),
        ),
      ).toThrow('Data de programação inválida');
    });

    it('deve propagar erro de hora de início inválida', () => {
      parseTime.mockImplementation((value: any) =>
        value === '08:00'
          ? (undefined as any)
          : new Date(`2026-02-10T17:00:00.000Z`),
      );

      expect(() => WorkScheduleMapper.fromCreateInput(makeCreateDto())).toThrow(
        'Hora de início inválida',
      );
    });

    it('deve propagar erro de hora de término inválida', () => {
      parseTime.mockImplementation((value: any) =>
        value === '17:00'
          ? (undefined as any)
          : new Date(`2026-02-10T08:00:00.000Z`),
      );

      expect(() => WorkScheduleMapper.fromCreateInput(makeCreateDto())).toThrow(
        'Hora de término inválida',
      );
    });
  });

  // =========================================================================
  // fromUpdateInput
  // =========================================================================
  describe('fromUpdateInput', () => {
    it('deve converter as datas e usar o rejected do contexto', () => {
      const props = WorkScheduleMapper.fromUpdateInput(makeUpdateDto(), {
        rejected: true,
      });

      expect(props.rejected).toBe(true);
      expect(props.dataProg).toEqual(new Date('2026-02-10'));
    });

    it('deve ignorar um eventual rejected vindo do DTO', () => {
      const props = WorkScheduleMapper.fromUpdateInput(
        makeUpdateDto({ rejected: false } as any),
        { rejected: true },
      );

      expect(props.rejected).toBe(true);
    });

    it('deve preservar os campos adicionais do DTO', () => {
      const props = WorkScheduleMapper.fromUpdateInput(
        makeUpdateDto({ prog: 70 } as any),
        { rejected: false },
      );

      expect(props).toMatchObject({ prog: 70 });
    });

    it('deve propagar erro de data inválida', () => {
      expect(() =>
        WorkScheduleMapper.fromUpdateInput(
          makeUpdateDto({ dataProg: 'xpto' } as any),
          { rejected: false },
        ),
      ).toThrow('Data de programação inválida');
    });

    it('deve propagar erro de hora de início inválida', () => {
      parseTime.mockImplementation((value: any) =>
        value === '08:00'
          ? (undefined as any)
          : new Date(`2026-02-10T17:00:00.000Z`),
      );

      expect(() =>
        WorkScheduleMapper.fromUpdateInput(makeUpdateDto(), {
          rejected: false,
        }),
      ).toThrow('Hora de início inválida');
    });

    it('deve propagar erro de hora de término inválida', () => {
      parseTime.mockImplementation((value: any) =>
        value === '17:00'
          ? (undefined as any)
          : new Date(`2026-02-10T08:00:00.000Z`),
      );

      expect(() =>
        WorkScheduleMapper.fromUpdateInput(makeUpdateDto(), {
          rejected: false,
        }),
      ).toThrow('Hora de término inválida');
    });
  });

  // =========================================================================
  // parseDates (auxiliar privado, via fromCreateInput/fromUpdateInput)
  // =========================================================================
  describe('parseDates', () => {
    it('deve rejeitar quando parseTimeToDate devolve uma Date inválida', () => {
      parseTime.mockReturnValue(new Date('xpto') as any);

      expect(() => WorkScheduleMapper.fromCreateInput(makeCreateDto())).toThrow(
        'Hora de início inválida',
      );
    });

    it('deve aceitar uma dataProg já em formato Date', () => {
      const props = WorkScheduleMapper.fromCreateInput(
        makeCreateDto({ dataProg: DATA_PROG } as any),
      );

      expect(props.dataProg).toEqual(DATA_PROG);
    });
  });
});
