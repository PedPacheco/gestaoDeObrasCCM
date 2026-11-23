import type {
  FeasibilityFileType,
  FeasibleItemUpdate,
  RejectFeasibilityData,
  StatusFeasibility,
} from 'src/domain/types';
import type { Prisma } from 'src/infra/generated/prisma/client';
import {
  toFeasibilityExportWork,
  toFeasibilityFiles,
  toFeasibilityRejection,
  toFeasibilityReport,
} from 'src/infra/mappers/feasibility.mapper';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FeasibilityRepository } from 'src/infra/repositories/feasibilityRepository';
import { workIdentifierWhere } from 'src/infra/shared/workIdentifierWhere';

import {
  FEASIBILITY_EXPORT_SELECT,
  FEASIBILITY_FILES_SELECT,
  FEASIBILITY_MISSING_STATUS,
  FEASIBILITY_REJECTION_SELECT,
} from 'src/infra/types/repositories/feasibility.types';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/infra/shared/workIdentifierWhere', () => ({
  workIdentifierWhere: vi.fn(() => ({ id: 41 })),
}));

vi.mock('src/infra/mappers/feasibility.mapper', () => ({
  FEASIBILITY_MISSING_STATUS: 'FALTA VIABILIDADE',
  toFeasibilityReport: vi.fn((row) => ({ workId: row.id_obra })),
  toFeasibilityFiles: vi.fn((row) => ({
    id: row.id,
    technicalFiles: row.caminhos_arquivos,
  })),
  toFeasibilityRejection: vi.fn((row) => ({ reason: row.motivo })),
  toFeasibilityExportWork: vi.fn((row) => ({ work: { ovnota: row.ovnota } })),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const WORK_ID = 41;
const USER_ID = 9;
const PATHS = ['technical.pdf'];
const TX_WHERE = { id: 41 };

const makeClient = () => ({
  $executeRaw: vi.fn().mockResolvedValue(1),
  relatorio_viabilidade: {
    findFirst: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
    upsert: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    create: vi.fn().mockResolvedValue(undefined),
  },
  obras: {
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  reprovacoes_viabilidade: {
    findMany: vi.fn(),
    create: vi.fn().mockResolvedValue(undefined),
  },
});

type Client = ReturnType<typeof makeClient>;

// ─── Suite ────────────────────────────────────────────────────────────

describe('FeasibilityRepository', () => {
  let prisma: Client;
  let tx: Client;
  let repository: FeasibilityRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    prisma = makeClient();
    tx = makeClient();
    repository = new FeasibilityRepository(prisma as unknown as PrismaService);
  });

  // ═══ findById ═══════════════════════════════════════════════════════

  describe('findById', () => {
    it('finds the feasibility report using the work identifier and maps the row', async () => {
      const row = { id: 5, id_obra: WORK_ID };
      prisma.relatorio_viabilidade.findFirst.mockResolvedValue(row);

      const result = await repository.findById(WORK_ID);

      expect(workIdentifierWhere).toHaveBeenCalledWith(WORK_ID);
      expect(prisma.relatorio_viabilidade.findFirst).toHaveBeenCalledWith({
        where: { obras: TX_WHERE },
      });
      expect(toFeasibilityReport).toHaveBeenCalledWith(row);
      expect(result).toEqual({ workId: WORK_ID });
    });

    it('returns null without mapping when no report is found', async () => {
      prisma.relatorio_viabilidade.findFirst.mockResolvedValue(null);

      const result = await repository.findById(WORK_ID);

      expect(result).toBeNull();
      expect(toFeasibilityReport).not.toHaveBeenCalled();
    });
  });

  // ═══ getProjectDate ═════════════════════════════════════════════════

  describe('getProjectDate', () => {
    it('returns the project inception date', async () => {
      const date = new Date('2026-11-01T00:00:00.000Z');
      prisma.obras.findUnique.mockResolvedValue({ data_empreitamento: date });

      expect(await repository.getProjectDate(WORK_ID)).toBe(date);
      expect(prisma.obras.findUnique).toHaveBeenCalledWith({
        where: { id: WORK_ID },
        select: { data_empreitamento: true },
      });
    });

    it('returns null when the work does not exist', async () => {
      prisma.obras.findUnique.mockResolvedValue(null);

      expect(await repository.getProjectDate(WORK_ID)).toBeNull();
    });

    it('returns null when the work has no inception date', async () => {
      prisma.obras.findUnique.mockResolvedValue({ data_empreitamento: null });

      expect(await repository.getProjectDate(WORK_ID)).toBeNull();
    });
  });

  // ═══ getRejections ══════════════════════════════════════════════════

  describe('getRejections', () => {
    it('loads and maps the work rejections', async () => {
      const rows = [
        { id: 1, motivo: 'Missing document' },
        { id: 2, motivo: 'Incorrect data' },
      ];
      prisma.reprovacoes_viabilidade.findMany.mockResolvedValue(rows);

      const result = await repository.getRejections(WORK_ID);

      expect(prisma.reprovacoes_viabilidade.findMany).toHaveBeenCalledWith({
        where: { relatorio_viabilidade: { id_obra: WORK_ID } },
        select: FEASIBILITY_REJECTION_SELECT,
      });
      expect(toFeasibilityRejection).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { reason: 'Missing document' },
        { reason: 'Incorrect data' },
      ]);
    });

    it('returns an empty list when there are no rejections', async () => {
      prisma.reprovacoes_viabilidade.findMany.mockResolvedValue([]);

      expect(await repository.getRejections(WORK_ID)).toEqual([]);
      expect(toFeasibilityRejection).not.toHaveBeenCalled();
    });
  });

  // ═══ exportFeasibility ══════════════════════════════════════════════

  describe('exportFeasibility', () => {
    it('exports all matching works when no partner filter is provided', async () => {
      const rows = [{ ovnota: 'OV-1' }, { ovnota: 'OV-2' }];
      prisma.obras.findMany.mockResolvedValue(rows);

      const result = await repository.exportFeasibility(46);

      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: {
          programacao_ponto_a_ponto: true,
          id_status: 46,
        },
        select: FEASIBILITY_EXPORT_SELECT,
      });
      expect(toFeasibilityExportWork).toHaveBeenCalledTimes(2);
      expect(result).toEqual([
        { work: { ovnota: 'OV-1' } },
        { work: { ovnota: 'OV-2' } },
      ]);
    });

    it('filters works by the requested partners', async () => {
      prisma.obras.findMany.mockResolvedValue([{ ovnota: 'OV-3' }]);

      await repository.exportFeasibility(45, [2, 7]);

      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: {
          programacao_ponto_a_ponto: true,
          id_status: 45,
          id_turma: { in: [2, 7] },
        },
        select: FEASIBILITY_EXPORT_SELECT,
      });
    });

    it('does not add a partner condition for an empty partner list', async () => {
      prisma.obras.findMany.mockResolvedValue([]);

      await repository.exportFeasibility(45, []);

      expect(prisma.obras.findMany).toHaveBeenCalledWith({
        where: {
          programacao_ponto_a_ponto: true,
          id_status: 45,
        },
        select: FEASIBILITY_EXPORT_SELECT,
      });
    });

    it('returns an empty list when no work matches', async () => {
      prisma.obras.findMany.mockResolvedValue([]);

      expect(await repository.exportFeasibility(45)).toEqual([]);
      expect(toFeasibilityExportWork).not.toHaveBeenCalled();
    });
  });

  // ═══ makeItemsFeasible ══════════════════════════════════════════════

  describe('makeItemsFeasible', () => {
    it('does not execute SQL when the item list is empty', async () => {
      await repository.makeItemsFeasible(
        [],
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.$executeRaw).not.toHaveBeenCalled();
    });

    it('executes a parameterized update for the provided items', async () => {
      const items: FeasibleItemUpdate[] = [
        { id: 101, feasibleQuantity: 4 },
        { id: 102, feasibleQuantity: 8 },
      ];

      await repository.makeItemsFeasible(
        items,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.$executeRaw).toHaveBeenCalledTimes(1);

      const [template, casesSql, idsSql] = tx.$executeRaw.mock
        .calls[0] as unknown as [
        TemplateStringsArray,
        { sql: string; values: unknown[] },
        { sql: string; values: unknown[] },
      ];

      expect(Array.isArray(template)).toBe(true);
      expect(template.join('?')).toContain('UPDATE servicos');
      expect(template.join('?')).toContain('SET viabilizado = CASE');

      // Os valores são passados como parâmetros, não interpolados no texto SQL.
      expect(casesSql.values).toEqual([101, 4, 102, 8]);
      expect(idsSql.values).toEqual([101, 102]);
    });

    it('uses the supplied transaction client instead of the default client', async () => {
      await repository.makeItemsFeasible(
        [{ id: 101, feasibleQuantity: 4 }],
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.$executeRaw).toHaveBeenCalledTimes(1);
      expect(prisma.$executeRaw).not.toHaveBeenCalled();
    });
  });

  // ═══ saveFiles ══════════════════════════════════════════════════════

  describe('saveFiles', () => {
    it('upserts technical files and metadata inside the transaction', async () => {
      const status: StatusFeasibility = 'DENTRO DO PRAZO';

      await repository.saveFiles(
        WORK_ID,
        USER_ID,
        status,
        PATHS,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.relatorio_viabilidade.upsert).toHaveBeenCalledTimes(1);
      const call = tx.relatorio_viabilidade.upsert.mock.calls[0][0];

      expect(call.where).toEqual({ id_obra: WORK_ID });
      expect(call.create).toMatchObject({
        id_obra: WORK_ID,
        caminhos_arquivos: PATHS,
        id_usuario: USER_ID,
        prazo_viabilidade: status,
      });
      expect(call.update).toMatchObject({
        caminhos_arquivos: PATHS,
        id_usuario: USER_ID,
        prazo_viabilidade: status,
      });
      expect(call.create.data_envio).toBeInstanceOf(Date);
      expect(call.update.data_envio).toBeInstanceOf(Date);
      expect(prisma.relatorio_viabilidade.upsert).not.toHaveBeenCalled();
    });
  });

  // ═══ updateFiles ════════════════════════════════════════════════════

  describe('updateFiles', () => {
    it('updates technical files when the type is technical', async () => {
      await repository.updateFiles(
        WORK_ID,
        PATHS,
        'technical',
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id_obra: WORK_ID },
        data: { caminhos_arquivos: PATHS },
      });
    });

    it('updates complementary files when the type is complementary', async () => {
      const type: FeasibilityFileType = 'complementary';

      await repository.updateFiles(
        WORK_ID,
        PATHS,
        type,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id_obra: WORK_ID },
        data: { arquivos_complementares: PATHS },
      });
    });
  });

  // ═══ findFiles ══════════════════════════════════════════════════════

  describe('findFiles', () => {
    it('loads and maps the file columns', async () => {
      const row = {
        id: 3,
        caminhos_arquivos: ['a.pdf'],
        arquivos_complementares: ['b.pdf'],
      };
      prisma.relatorio_viabilidade.findUnique.mockResolvedValue(row);

      const result = await repository.findFiles(WORK_ID);

      expect(prisma.relatorio_viabilidade.findUnique).toHaveBeenCalledWith({
        where: { id_obra: WORK_ID },
        select: FEASIBILITY_FILES_SELECT,
      });
      expect(toFeasibilityFiles).toHaveBeenCalledWith(row);
      expect(result).toEqual({ id: 3, technicalFiles: ['a.pdf'] });
    });

    it('returns null without mapping when the report does not exist', async () => {
      prisma.relatorio_viabilidade.findUnique.mockResolvedValue(null);

      expect(await repository.findFiles(WORK_ID)).toBeNull();
      expect(toFeasibilityFiles).not.toHaveBeenCalled();
    });
  });

  // ═══ reject ═════════════════════════════════════════════════════════

  describe('reject', () => {
    it('creates a rejection and clears the report submission status', async () => {
      const data: RejectFeasibilityData = {
        feasibilityReportId: 77,
        userId: USER_ID,
        reason: 'Missing information',
        description: 'Attach the required document',
      };

      await repository.reject(data, tx as unknown as Prisma.TransactionClient);

      expect(tx.reprovacoes_viabilidade.create).toHaveBeenCalledWith({
        data: {
          descricao: data.description,
          motivo: data.reason,
          id_relatorio_viabilidade: data.feasibilityReportId,
          id_usuario: data.userId,
        },
      });
      expect(tx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id: data.feasibilityReportId },
        data: {
          data_envio: null,
          prazo_viabilidade: FEASIBILITY_MISSING_STATUS,
        },
      });
      expect(prisma.reprovacoes_viabilidade.create).not.toHaveBeenCalled();
      expect(prisma.relatorio_viabilidade.update).not.toHaveBeenCalled();
    });
  });

  // ═══ approve ════════════════════════════════════════════════════════

  describe('approve', () => {
    it('approves the report inside the transaction', async () => {
      await repository.approve(
        WORK_ID,
        USER_ID,
        tx as unknown as Prisma.TransactionClient,
      );

      expect(tx.relatorio_viabilidade.update).toHaveBeenCalledTimes(1);
      expect(tx.relatorio_viabilidade.update).toHaveBeenCalledWith({
        where: { id_obra: WORK_ID },
        data: {
          data_aprovacao: expect.any(Date),
          aprovada: true,
          id_usuario_aprovador: USER_ID,
        },
      });
      expect(prisma.relatorio_viabilidade.update).not.toHaveBeenCalled();
    });
  });
});
