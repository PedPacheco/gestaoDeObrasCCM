import { BadRequestException } from '@nestjs/common';
import {
  toFeasibilityApprovalExport,
  toFeasibilityPendingExport,
  toFeasibilityRejectionOutput,
  toFeasibilityReportOutput,
} from 'src/application/mappers/feasibilityMapper';
import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import type { IFeasibilityRepository } from 'src/domain/contracts/IFeasibilityRepository';
import type {
  FeasibilityExportWork,
  FeasibilityRejection,
  FeasibilityReport,
} from 'src/domain/types';
import { beforeEach, describe, expect, it, vi, type Mocked } from 'vitest';

// ─── Module mocks ─────────────────────────────────────────────────────

vi.mock('src/application/mappers/feasibilityMapper', () => ({
  toFeasibilityReportOutput: vi.fn((r) => ({ report: r.id })),
  toFeasibilityRejectionOutput: vi.fn((r) => ({ rejection: r.reason })),
  toFeasibilityApprovalExport: vi.fn((w, s) => ({
    approval: `${w.work.ovnota}-${s.operation}`,
  })),
  toFeasibilityPendingExport: vi.fn((w, s) => ({
    pending: `${w.work.ovnota}-${s.operation}`,
  })),
}));

// ─── Fixtures ─────────────────────────────────────────────────────────

const STATUS_PENDING = 45;
const STATUS_PENDING_APPROVAL = 46;

const makeWork = (
  ovnota: string,
  operations: string[],
): FeasibilityExportWork =>
  ({
    work: { ovnota },
    sentAt: null,
    services: operations.map((operation) => ({ operation })),
  }) as unknown as FeasibilityExportWork;

const WORKS: FeasibilityExportWork[] = [
  makeWork('OV-1', ['10', '20']),
  makeWork('OV-2', ['30']),
];

// ─── Suite ────────────────────────────────────────────────────────────

describe('FeasibilityService', () => {
  let repository: Mocked<IFeasibilityRepository>;
  let service: FeasibilityService;

  beforeEach(() => {
    vi.clearAllMocks();

    repository = {
      findById: vi.fn(),
      getProjectDate: vi.fn(),
      getRejections: vi.fn().mockResolvedValue([]),
      exportFeasibility: vi.fn().mockResolvedValue([]),
      saveFiles: vi.fn(),
      updateFiles: vi.fn(),
      makeItemsFeasible: vi.fn(),
      findFiles: vi.fn(),
      reject: vi.fn(),
      approve: vi.fn(),
    } as unknown as Mocked<IFeasibilityRepository>;

    service = new FeasibilityService(repository);
  });

  // ═══ feasibilityExists ══════════════════════════════════════════════

  describe('feasibilityExists', () => {
    it.each([
      ['zero', 0],
      ['undefined', undefined],
    ])('throws BadRequestException when the id is %s', async (_label, id) => {
      await expect(
        service.feasibilityExists(id as unknown as number),
      ).rejects.toThrow(new BadRequestException('Obra não foi enviada'));

      expect(repository.findById).not.toHaveBeenCalled();
    });

    it('returns null without mapping when no report exists for the work', async () => {
      repository.findById.mockResolvedValue(null);

      const result = await service.feasibilityExists(41);

      expect(repository.findById).toHaveBeenCalledWith(41);
      expect(result).toBeNull();
      expect(toFeasibilityReportOutput).not.toHaveBeenCalled();
    });

    it('maps the report to the API output when it exists', async () => {
      const report = { id: 7 } as unknown as FeasibilityReport;
      repository.findById.mockResolvedValue(report);

      const result = await service.feasibilityExists(41);

      expect(toFeasibilityReportOutput).toHaveBeenCalledWith(report);
      expect(result).toEqual({ report: 7 });
    });

    it('propagates repository errors', async () => {
      const error = new Error('database down');
      repository.findById.mockRejectedValue(error);

      await expect(service.feasibilityExists(41)).rejects.toBe(error);
    });
  });

  // ═══ getRejections ══════════════════════════════════════════════════

  describe('getRejections', () => {
    it('loads the rejections of the work and maps each one', async () => {
      const rejections = [
        { reason: 'missing document' },
        { reason: 'wrong quantity' },
      ] as unknown as FeasibilityRejection[];
      repository.getRejections.mockResolvedValue(rejections);

      const result = await service.getRejections(41);

      expect(repository.getRejections).toHaveBeenCalledWith(41);
      expect(toFeasibilityRejectionOutput).toHaveBeenCalledTimes(2);
      // o map passa (item, index, array): só o primeiro argumento interessa
      expect(vi.mocked(toFeasibilityRejectionOutput).mock.calls[0][0]).toBe(
        rejections[0],
      );
      expect(vi.mocked(toFeasibilityRejectionOutput).mock.calls[1][0]).toBe(
        rejections[1],
      );
      expect(result).toEqual([
        { rejection: 'missing document' },
        { rejection: 'wrong quantity' },
      ]);
    });

    it('returns an empty list when the work has no rejections', async () => {
      expect(await service.getRejections(41)).toEqual([]);
      expect(toFeasibilityRejectionOutput).not.toHaveBeenCalled();
    });
  });

  // ═══ exportFeasibilityPendingApproval ═══════════════════════════════

  describe('exportFeasibilityPendingApproval', () => {
    it('exports the works pending approval with one line per service', async () => {
      repository.exportFeasibility.mockResolvedValue(WORKS);

      const result = await service.exportFeasibilityPendingApproval([1, 2]);

      expect(repository.exportFeasibility).toHaveBeenCalledWith(
        STATUS_PENDING_APPROVAL,
        [1, 2],
      );
      expect(toFeasibilityApprovalExport).toHaveBeenCalledWith(
        WORKS[0],
        WORKS[0].services[0],
      );
      expect(toFeasibilityApprovalExport).toHaveBeenCalledWith(
        WORKS[0],
        WORKS[0].services[1],
      );
      expect(toFeasibilityApprovalExport).toHaveBeenCalledWith(
        WORKS[1],
        WORKS[1].services[0],
      );
      expect(result).toEqual([
        { approval: 'OV-1-10' },
        { approval: 'OV-1-20' },
        { approval: 'OV-2-30' },
      ]);
      expect(toFeasibilityPendingExport).not.toHaveBeenCalled();
    });

    it('forwards an undefined partner filter to the repository', async () => {
      await service.exportFeasibilityPendingApproval();

      expect(repository.exportFeasibility).toHaveBeenCalledWith(
        STATUS_PENDING_APPROVAL,
        undefined,
      );
    });

    it('skips works without services', async () => {
      repository.exportFeasibility.mockResolvedValue([
        makeWork('OV-3', []),
        WORKS[1],
      ]);

      const result = await service.exportFeasibilityPendingApproval();

      expect(result).toEqual([{ approval: 'OV-2-30' }]);
    });

    it('returns an empty list when no work matches', async () => {
      expect(await service.exportFeasibilityPendingApproval()).toEqual([]);
      expect(toFeasibilityApprovalExport).not.toHaveBeenCalled();
    });
  });

  // ═══ exportFeasibilityPending ═══════════════════════════════════════

  describe('exportFeasibilityPending', () => {
    it('exports the works pending feasibility with one line per service', async () => {
      repository.exportFeasibility.mockResolvedValue(WORKS);

      const result = await service.exportFeasibilityPending([3]);

      expect(repository.exportFeasibility).toHaveBeenCalledWith(
        STATUS_PENDING,
        [3],
      );
      expect(toFeasibilityPendingExport).toHaveBeenCalledTimes(3);
      expect(result).toEqual([
        { pending: 'OV-1-10' },
        { pending: 'OV-1-20' },
        { pending: 'OV-2-30' },
      ]);
      expect(toFeasibilityApprovalExport).not.toHaveBeenCalled();
    });

    it('forwards an undefined partner filter to the repository', async () => {
      await service.exportFeasibilityPending();

      expect(repository.exportFeasibility).toHaveBeenCalledWith(
        STATUS_PENDING,
        undefined,
      );
    });

    it('returns an empty list when no work matches', async () => {
      expect(await service.exportFeasibilityPending()).toEqual([]);
      expect(toFeasibilityPendingExport).not.toHaveBeenCalled();
    });

    it('propagates repository errors', async () => {
      const error = new Error('query timeout');
      repository.exportFeasibility.mockRejectedValue(error);

      await expect(service.exportFeasibilityPending()).rejects.toBe(error);
    });
  });
});
