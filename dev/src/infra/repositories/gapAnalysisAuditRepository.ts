import { Injectable } from '@nestjs/common';
import { gap_analysis_audits } from '@prisma/client';

import {
  CreateGapAnalysisAuditData,
  IGapAnalysisAuditRepository,
  UpdateGapAnalysisAuditData,
} from 'src/domain/repositories/IGapAnalysisAuditRepository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GapAnalysisAuditRepository
  implements IGapAnalysisAuditRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<gap_analysis_audits[]> {
    return this.prisma.gap_analysis_audits.findMany({
      orderBy: [{ parceira: 'asc' }, { id: 'asc' }],
    });
  }

  async create(
    data: CreateGapAnalysisAuditData,
  ): Promise<gap_analysis_audits> {
    return this.prisma.gap_analysis_audits.create({ data });
  }

  async createMany(
    data: CreateGapAnalysisAuditData[],
  ): Promise<{ count: number }> {
    return this.prisma.gap_analysis_audits.createMany({ data });
  }

  async update(
    id: number,
    data: UpdateGapAnalysisAuditData,
  ): Promise<gap_analysis_audits> {
    return this.prisma.gap_analysis_audits.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<gap_analysis_audits> {
    return this.prisma.gap_analysis_audits.delete({ where: { id } });
  }
}
