import { Injectable } from '@nestjs/common';

import { gap_analysis } from '@prisma/client';
import {
  GapAnalysisAuditData,
  IGapAnalysisAuditRepository,
} from 'src/domain/repositories/IGapAnalysisAuditRepository';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class GapAnalysisAuditRepository implements IGapAnalysisAuditRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<any[]> {
    return await this.prisma.gap_analysis.findMany({
      select: { turmas: { select: { turma: true } } },
      orderBy: [{ id_parceira: 'asc' }, { id: 'asc' }],
    });
  }

  async create(data: GapAnalysisAuditData): Promise<any> {
    console.log(data);
    return await this.prisma.gap_analysis.create({ data });
  }

  async createMany(data: GapAnalysisAuditData[]): Promise<{ count: number }> {
    return await this.prisma.gap_analysis.createMany({ data });
  }

  async update(id: number, data: GapAnalysisAuditData): Promise<gap_analysis> {
    return await this.prisma.gap_analysis.update({
      where: { id },
      data,
    });
  }

  async delete(id: number): Promise<void> {
    await this.prisma.gap_analysis.delete({ where: { id } });
  }
}
