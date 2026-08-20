import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import {
  CreateGapAnalysisAuditData,
  IGapAnalysisAuditRepository,
  UpdateGapAnalysisAuditData,
} from 'src/domain/contracts/IGapAnalysisAuditRepository';

@Injectable()
export class GapAnalysisAuditRepository implements IGapAnalysisAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<gap_analysis_audits[]> {
    return await this.prisma.gap_analysis.findMany({
      orderBy: [{ parceira: 'asc' }, { id: 'asc' }],
    });
  }

  async create(data: CreateGapAnalysisAuditData): Promise<any> {
    return await this.prisma.gap_analysis.create({ data });
  }

  async createMany(
    data: CreateGapAnalysisAuditData[],
  ): Promise<{ count: number }> {
    return await this.prisma.gap_analysis.createMany({ data });
  }

  async update(id: number, data: UpdateGapAnalysisAuditData): Promise<any[]> {
    await this.prisma.gap_analysis.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.gap_analysis.delete({ where: { id } });
  }
}
