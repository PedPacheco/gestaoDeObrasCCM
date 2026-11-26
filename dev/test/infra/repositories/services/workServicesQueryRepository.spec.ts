import { Prisma } from 'src/infra/generated/prisma/client';
import type { PrismaService } from 'src/infra/prisma/prisma.service';
import { WorkServicesQueryRepository } from 'src/infra/repositories/worksServices/workServicesQueryRepository';

import {
  BASE_SERVICES_SELECT,
  buildWorkToExportSelect,
  MATERIALS_CONTRACT_SELECT,
  SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT,
  SELECTED_SERVICES_SELECT,
  SERVICE_FOR_SCHEDULING_SELECT,
} from 'src/infra/types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Helpers ──────────────────────────────────────────────────────────

const decimal = (value: string) => new Prisma.Decimal(value);

const makeClient = () => ({
  servicos: { findMany: vi.fn(), groupBy: vi.fn() },
  programacoes_servicos: { findMany: vi.fn() },
  obras: { findMany: vi.fn() },
  servicos_contratos: { findMany: vi.fn() },
  materiais: { findMany: vi.fn() },
  equipes: { findMany: vi.fn() },
});

const identifierColumns = (value: string) => [
  { ovnota: value },
  { ordem_dci: value },
  { ordem_dcd: value },
  { ordem_dca: value },
  { ordem_dcim: value },
  { diagrama: value },
];

// ─── Fixtures ─────────────────────────────────────────────────────────

const baseServiceRow = () => ({
  id: 1,
  id_obra: 7,
  id_contrato_servico: 3,
  id_material: 5,
  operacao: 'OP',
  ponto: 'P1',
  qtde_plan: 10,
  qtde_prog: 2,
  qtde_real: 1,
  qtde_adicional: 0,
  viabilizado: 10,
  descricao_operacao: 'Desc',
  numero_operacao: '0010',
  materiais: { codigo: 'M1', descricao: 'Cabo', preco: decimal('12.34') },
  servicos_contratos: { material: 'S1', texto_breve: 'Serv', preco: 5.5 },
});

const baseServiceExpected = () => ({
  ...baseServiceRow(),
  materiais: { codigo: 'M1', descricao: 'Cabo', preco: 12.34 },
});

const selectedServiceRow = (materiais: unknown) => ({
  id_programacao: 20,
  prog: 4,
  real: 2,
  adicional: 0,
  equipes: { equipe: 'EQ-01', encarregado: 'João', perfil: 'LM' },
  programacoes: { data_prog: new Date('2026-01-10T00:00:00.000Z') },
  servicos: {
    id: 1,
    id_obra: 7,
    operacao: 'OP',
    ponto: 'P1',
    qtde_plan: null,
    viabilizado: null,
    descricao_operacao: null,
    numero_operacao: null,
    materiais,
    servicos_contratos: { material: 'S1', texto_breve: 'Serv', preco: 5.5 },
  },
});

const scheduleHistoryByIdRow = () => ({
  id: 30,
  id_servico: 1,
  servicos: {
    materiais: { descricao: 'Cabo', codigo: 'M1', preco: decimal('333.33') },
    servicos_contratos: { texto_breve: 'Serv', material: 'S1', preco: 5.5 },
    ponto: 'P1',
    operacao: 'OP',
    qtde_plan: 10,
    viabilizado: 10,
    descricao_operacao: 'Desc',
    numero_operacao: '0010',
  },
  id_programacao: 20,
  programacoes: { data_prog: new Date('2026-01-10T00:00:00.000Z') },
  equipes: { equipe: 'EQ-01', perfil: 'LM' },
  prog: 4,
  real: 2,
  adicional: 0,
});

const exportServiceRow = (materiais: unknown) => ({
  operacao: 'OP',
  ponto: 'P1',
  viabilizado: 10,
  qtde_adicional: 0,
  materiais,
  servicos_contratos: null,
  programacoes_servicos: [
    { id_programacao: 20, prog: 4, real: 2, equipes: { equipe: 'EQ-01' } },
  ],
});

const workToExportRow = () => ({
  ovnota: '12791122',
  diagrama: null,
  referencia: null,
  ordem_dci: null,
  ordem_dca: null,
  ordem_dcd: null,
  ordem_dcim: null,
  executado: null,
  tipos: { tipo_obra: 'SPACER CABLE' },
  municipios: { municipio: 'MONTEIRO LOBATO' },
  turmas: { turma: 'PARCEIRA A' },
  empreendimento: { empreendimento: null },
  circuitos: { circuito: 'CAC-1302', conjuntos: { conjunto: 'São José' } },
  programacoes: [],
  servicos: [
    exportServiceRow({
      codigo: 'M1',
      descricao: 'Cabo',
      preco: decimal('0.1'),
      unidade: 'm',
    }),
    exportServiceRow(null),
  ],
});

// ─── Suite ────────────────────────────────────────────────────────────

describe('WorkServicesQueryRepository', () => {
  let prisma: ReturnType<typeof makeClient>;
  let tx: ReturnType<typeof makeClient>;
  let repository: WorkServicesQueryRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeClient();
    tx = makeClient();
    repository = new WorkServicesQueryRepository(
      prisma as unknown as PrismaService,
    );
  });

  // ── getAllServicesOfWork ──────────────────────────────────────────
  describe('getAllServicesOfWork', () => {
    it('filters by numeric id and every identifier column when the value has fewer than 10 digits', async () => {
      prisma.servicos.findMany.mockResolvedValue([]);

      await repository.getAllServicesOfWork(244);

      const [{ where, select }] = prisma.servicos.findMany.mock.calls[0];
      expect(select).toBe(BASE_SERVICES_SELECT);
      expect(where.obras.OR).toHaveLength(7);
      expect(where.obras.OR).toEqual(
        expect.arrayContaining([{ id: 244 }, ...identifierColumns('244')]),
      );
    });

    it('disables the numeric id filter when the value has 10 or more digits', async () => {
      const id = 4552432432432;
      prisma.servicos.findMany.mockResolvedValue([]);

      await repository.getAllServicesOfWork(id);

      const [{ where }] = prisma.servicos.findMany.mock.calls[0];
      expect(where.obras.OR).toEqual(
        expect.arrayContaining([
          { id: undefined },
          ...identifierColumns(id.toString()),
        ]),
      );
    });

    it('converts the material price from Decimal to number', async () => {
      prisma.servicos.findMany.mockResolvedValue([baseServiceRow()]);

      const result = await repository.getAllServicesOfWork(244);

      expect(result).toStrictEqual([baseServiceExpected()]);
    });

    it('uses the transaction client when one is given', async () => {
      tx.servicos.findMany.mockResolvedValue([]);

      await repository.getAllServicesOfWork(
        244,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.servicos.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.servicos.findMany).not.toHaveBeenCalled();
    });
  });

  // ── findServicesForScheduling ─────────────────────────────────────
  describe('findServicesForScheduling', () => {
    it('queries the services by id inside the given transaction', async () => {
      const rows = [
        {
          id: 1,
          id_obra: 7,
          id_material: null,
          viabilizado: 10,
          qtde_adicional: null,
          qtde_real: null,
          ponto: 'P1',
          operacao: 'OP',
          descricao_operacao: null,
        },
      ];
      tx.servicos.findMany.mockResolvedValue(rows);

      const result = await repository.findServicesForScheduling(
        [1, 2],
        tx as unknown as Prisma.TransactionClient,
      );

      expect(result).toBe(rows);
      expect(tx.servicos.findMany).toHaveBeenCalledWith({
        where: { id: { in: [1, 2] } },
        select: SERVICE_FOR_SCHEDULING_SELECT,
      });
      expect(prisma.servicos.findMany).not.toHaveBeenCalled();
    });
  });

  // ── getNotScheduledServices ───────────────────────────────────────
  describe('getNotScheduledServices', () => {
    it('filters services of the work that still have pending or unknown quantities', async () => {
      prisma.servicos.findMany.mockResolvedValue([baseServiceRow()]);

      const result = await repository.getNotScheduledServices(7);

      expect(result).toStrictEqual([baseServiceExpected()]);
      expect(prisma.servicos.findMany).toHaveBeenCalledWith({
        select: BASE_SERVICES_SELECT,
        where: {
          id_obra: 7,
          AND: [
            { OR: [{ qtde_real: null }, { qtde_real: { not: 0 } }] },
            { OR: [{ viabilizado: null }, { viabilizado: { not: 0 } }] },
          ],
        },
      });
    });
  });

  // ── getSelectedServices ───────────────────────────────────────────
  describe('getSelectedServices', () => {
    it('queries the services of a schedule and converts the material price', async () => {
      prisma.programacoes_servicos.findMany.mockResolvedValue([
        selectedServiceRow({
          codigo: 'M1',
          descricao: 'Cabo',
          preco: decimal('12.34'),
        }),
      ]);

      const [result] = await repository.getSelectedServices({
        id: 7,
        idProgramacao: 20,
      });

      expect(result.servicos.materiais).toStrictEqual({
        codigo: 'M1',
        descricao: 'Cabo',
        preco: 12.34,
      });
      expect(result.servicos.id).toBe(1);
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: 20, servicos: { id_obra: 7 } },
        select: SELECTED_SERVICES_SELECT,
      });
    });

    it('keeps materials as null when the service has no material', async () => {
      prisma.programacoes_servicos.findMany.mockResolvedValue([
        selectedServiceRow(null),
      ]);

      const [result] = await repository.getSelectedServices({
        id: 7,
        idProgramacao: 20,
      });

      expect(result.servicos.materiais).toBeNull();
    });
  });

  // ── getServiceScheduleHistory ─────────────────────────────────────
  describe('getServiceScheduleHistory', () => {
    it('returns the schedule history of the work using the default client', async () => {
      const rows = [{ id: 30 }];
      prisma.programacoes_servicos.findMany.mockResolvedValue(rows);

      const result = await repository.getServiceScheduleHistory(7);

      expect(result).toBe(rows);
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { programacoes: { id_obra: 7 } },
        select: expect.objectContaining({
          id: true,
          id_servico: true,
          id_equipe: true,
          status: true,
        }),
      });
    });

    it('uses the transaction client when one is given', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValue([]);

      await repository.getServiceScheduleHistory(
        7,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledTimes(1);
      expect(prisma.programacoes_servicos.findMany).not.toHaveBeenCalled();
    });
  });

  // ── getServiceScheduleHistoryByIdSchedule ─────────────────────────
  describe('getServiceScheduleHistoryByIdSchedule', () => {
    it('queries by schedule ids and converts the material price', async () => {
      prisma.programacoes_servicos.findMany.mockResolvedValue([
        scheduleHistoryByIdRow(),
      ]);

      const [result] = await repository.getServiceScheduleHistoryByIdSchedule([
        20, 21,
      ]);

      expect(result.servicos.materiais.preco).toBe(333.33);
      expect(prisma.programacoes_servicos.findMany).toHaveBeenCalledWith({
        select: SCHEDULE_HISTORY_BY_ID_SCHEDULE_SELECT,
        where: { id_programacao: { in: [20, 21] } },
      });
    });
  });

  // ── getServicesToExportation ──────────────────────────────────────
  describe('getServicesToExportation', () => {
    const params = {
      dataInicial: '2026-01-01',
      dataFinal: '2026-01-31',
      idParceira: [1, 2],
      idEquipe: [] as number[],
    };

    const dateFilter = {
      gte: new Date(params.dataInicial),
      lte: new Date(params.dataFinal),
    };

    it('does not filter by team when no team is given', async () => {
      prisma.obras.findMany.mockResolvedValue([]);

      await repository.getServicesToExportation(params);

      const scheduleServiceFilter = { programacoes: { data_prog: dateFilter } };
      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: {
          id_turma: { in: [1, 2] },
          programacao_ponto_a_ponto: true,
          programacoes: { some: { data_prog: dateFilter } },
          servicos: {
            some: {
              OR: [{ viabilizado: { not: null, gt: 0 } }],
              programacoes_servicos: { some: scheduleServiceFilter },
            },
          },
        },
        select: buildWorkToExportSelect(dateFilter, scheduleServiceFilter),
      });
    });

    it('filters by team when teams are given', async () => {
      prisma.obras.findMany.mockResolvedValue([]);

      await repository.getServicesToExportation({ ...params, idEquipe: [9] });

      const scheduleServiceFilter = {
        programacoes: { data_prog: dateFilter },
        id_equipe: { in: [9] },
      };
      const [{ where, select }] = prisma.obras.findMany.mock.calls[0];
      expect(where.servicos.some.programacoes_servicos).toEqual({
        some: scheduleServiceFilter,
      });
      expect(select).toEqual(
        buildWorkToExportSelect(dateFilter, scheduleServiceFilter),
      );
    });

    it('converts the material price of every exported service and keeps null materials', async () => {
      prisma.obras.findMany.mockResolvedValue([workToExportRow()]);

      const [work] = await repository.getServicesToExportation(params);

      expect(work.servicos[0].materiais).toStrictEqual({
        codigo: 'M1',
        descricao: 'Cabo',
        preco: 0.1,
        unidade: 'm',
      });
      expect(work.servicos[1].materiais).toBeNull();
    });
  });

  // ── getServicesContracts ──────────────────────────────────────────
  describe('getServicesContracts', () => {
    it('returns the service contracts of the partner', async () => {
      const rows = [{ id: 1, preco: 5.5 }];
      prisma.servicos_contratos.findMany.mockResolvedValue(rows);

      const result = await repository.getServicesContracts(2);

      expect(result).toBe(rows);
      expect(prisma.servicos_contratos.findMany).toHaveBeenCalledWith({
        select: {
          id: true,
          texto_breve: true,
          material: true,
          material_antigo: true,
          preco: true,
          contrato: true,
          medida: true,
          turmas: { select: { turma: true } },
        },
        where: { id_turma: 2 },
      });
    });
  });

  // ── getMaterialsContract ──────────────────────────────────────────
  describe('getMaterialsContract', () => {
    it('selects only the domain fields and converts the price to number', async () => {
      prisma.materiais.findMany.mockResolvedValue([
        {
          id: 1,
          codigo: 'M1',
          descricao: 'Cabo',
          unidade: 'm',
          preco: decimal('12.34'),
        },
      ]);

      const result = await repository.getMaterialsContract();

      expect(result).toStrictEqual([
        { id: 1, codigo: 'M1', descricao: 'Cabo', unidade: 'm', preco: 12.34 },
      ]);
      expect(prisma.materiais.findMany).toHaveBeenCalledWith({
        select: MATERIALS_CONTRACT_SELECT,
      });
    });
  });

  // ── getTeamsServices ──────────────────────────────────────────────
  describe('getTeamsServices', () => {
    it('returns the teams of the partner', async () => {
      const rows = [
        { id: 1, equipe: 'EQ-01', encarregado: 'João', perfil: 'LM' },
      ];
      prisma.equipes.findMany.mockResolvedValue(rows);

      const result = await repository.getTeamsServices(2);

      expect(result).toBe(rows);
      expect(prisma.equipes.findMany).toHaveBeenCalledWith({
        select: { id: true, equipe: true, encarregado: true, perfil: true },
        where: { id_turma: 2 },
      });
    });
  });

  // ── getServiceOptions ─────────────────────────────────────────────
  describe('getServiceOptions', () => {
    it('groups the services of the work by operation description and by point', async () => {
      prisma.servicos.groupBy
        .mockResolvedValueOnce([
          { descricao_operacao: 'Instalar' },
          { descricao_operacao: 'Retirar' },
        ])
        .mockResolvedValueOnce([{ ponto: 'P1' }, { ponto: 'P2' }]);

      const result = await repository.getServiceOptions(7);

      expect(result).toStrictEqual({
        operation_description: ['Instalar', 'Retirar'],
        points: ['P1', 'P2'],
      });
      expect(prisma.servicos.groupBy).toHaveBeenNthCalledWith(1, {
        by: ['descricao_operacao'],
        where: { id_obra: 7 },
      });
      expect(prisma.servicos.groupBy).toHaveBeenNthCalledWith(2, {
        by: ['ponto'],
        where: { id_obra: 7 },
      });
    });

    it('returns empty lists when the work has no services', async () => {
      prisma.servicos.groupBy.mockResolvedValue([]);

      await expect(repository.getServiceOptions(7)).resolves.toStrictEqual({
        operation_description: [],
        points: [],
      });
    });
  });

  // ── Errors ────────────────────────────────────────────────────────
  describe('error handling', () => {
    it('propagates database errors', async () => {
      const error = new Error('database unavailable');
      prisma.materiais.findMany.mockRejectedValue(error);

      await expect(repository.getMaterialsContract()).rejects.toBe(error);
    });
  });
});
