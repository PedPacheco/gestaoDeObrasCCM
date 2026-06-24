import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { gap_analysis_audits } from '@prisma/client';

import {
  CreateGapAnalysisAuditData,
  GAP_ANALYSIS_AUDIT_REPOSITORY,
  IGapAnalysisAuditRepository,
  UpdateGapAnalysisAuditData,
} from 'src/domain/repositories/IGapAnalysisAuditRepository';

export interface AuditWithComputed extends gap_analysis_audits {
  data_gap: string;
  score_final: string;
  evolucao: string;
  itens_pendentes_no_prazo: string;
}

@Injectable()
export class GapAnalysisAuditService {
  constructor(
    @Inject(GAP_ANALYSIS_AUDIT_REPOSITORY)
    private readonly repo: IGapAnalysisAuditRepository,
  ) {}

  private computeFields(audit: gap_analysis_audits): AuditWithComputed {
    let dataGap = '';
    if (audit.data_fim) {
      const parts = audit.data_fim.split('-');
      if (parts.length >= 2) {
        dataGap = `${parts[1]}/${parts[0]}`;
      }
    }

    const scoreFinal = audit.gap_atual || '';

    const total =
      parseInt(audit.quantidade_desvios_planejados || '0') || 0;
    const execNoPrazo =
      parseInt(audit.quantidade_desvios_executados || '0') || 0;
    const execForaPrazo =
      parseInt(audit.executados_fora_prazo || '0') || 0;
    const pendForaPrazo =
      parseInt(audit.itens_pendentes_fora_do_prazo || '0') || 0;
    const evolucao =
      total > 0
        ? Math.round(((execNoPrazo + execForaPrazo) / total) * 100).toString()
        : '';
    const noPrazo = Math.max(
      0,
      total - execNoPrazo - execForaPrazo - pendForaPrazo,
    ).toString();

    return {
      ...audit,
      data_gap: dataGap,
      score_final: scoreFinal,
      evolucao,
      itens_pendentes_no_prazo: noPrazo,
    };
  }

  async findAll(): Promise<AuditWithComputed[]> {
    const audits = await this.repo.findAll();
    return audits.map((a) => this.computeFields(a));
  }

  async create(data: CreateGapAnalysisAuditData): Promise<AuditWithComputed> {
    const audit = await this.repo.create(data);
    return this.computeFields(audit);
  }

  async createMany(
    data: CreateGapAnalysisAuditData[],
  ): Promise<{ count: number }> {
    return this.repo.createMany(data);
  }

  async update(
    id: number,
    data: UpdateGapAnalysisAuditData,
  ): Promise<AuditWithComputed> {
    try {
      const audit = await this.repo.update(id, data);
      return this.computeFields(audit);
    } catch {
      throw new NotFoundException(`Auditoria com id ${id} não encontrada`);
    }
  }

  async delete(id: number): Promise<AuditWithComputed> {
    try {
      const audit = await this.repo.delete(id);
      return this.computeFields(audit);
    } catch {
      throw new NotFoundException(`Auditoria com id ${id} não encontrada`);
    }
  }
}
