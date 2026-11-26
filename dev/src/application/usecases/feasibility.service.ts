import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';
import {
  toFeasibilityApprovalExport,
  toFeasibilityPendingExport,
  toFeasibilityRejectionOutput,
  toFeasibilityReportOutput,
} from '../mappers/feasibilityMapper';
import type {
  FeasibilityApprovalExportOutput,
  FeasibilityPendingExportOutput,
  FeasibilityRejectionOutput,
  FeasibilityReportOutput,
} from '../types';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
  ) {}

  async feasibilityExists(id: number): Promise<FeasibilityReportOutput | null> {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }
    const report = await this.feasibilityRepository.findById(id);
    return report && toFeasibilityReportOutput(report);
  }

  async getRejections(workId: number): Promise<FeasibilityRejectionOutput[]> {
    const rejections = await this.feasibilityRepository.getRejections(workId);
    return rejections.map(toFeasibilityRejectionOutput);
  }

  async exportFeasibilityPendingApproval(
    partnerIds?: number[],
  ): Promise<FeasibilityApprovalExportOutput[]> {
    const works = await this.feasibilityRepository.exportFeasibility(
      46,
      partnerIds,
    ); // 6d: WorkStatus
    return works.flatMap((w) =>
      w.services.map((s) => toFeasibilityApprovalExport(w, s)),
    );
  }

  async exportFeasibilityPending(
    partnerIds?: number[],
  ): Promise<FeasibilityPendingExportOutput[]> {
    const works = await this.feasibilityRepository.exportFeasibility(
      45,
      partnerIds,
    ); // 6d: WorkStatus
    return works.flatMap((w) =>
      w.services.map((s) => toFeasibilityPendingExport(w, s)),
    );
  }
}
