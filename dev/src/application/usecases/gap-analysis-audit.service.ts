import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { gap_analysis } from '@prisma/client';

import {
  GAP_ANALYSIS_AUDIT_REPOSITORY,
  GapAnalysisAuditData,
  IGapAnalysisAuditRepository,
} from 'src/domain/repositories/IGapAnalysisAuditRepository';

export interface AuditWithComputed extends gap_analysis {
  parceira: string;
  data_gap: string;
  score_final: number;
  evolucao: number;
  itens_pendentes_no_prazo: number;
}

@Injectable()
export class GapAnalysisAuditService {
  constructor(
    @Inject(GAP_ANALYSIS_AUDIT_REPOSITORY)
    private readonly repo: IGapAnalysisAuditRepository,
  ) {}

  private computeFields(audit: any): AuditWithComputed {
    let dataGap = '';

    if (audit.data_fim) {
      const month = String(audit.data_fim.getMonth() + 1).padStart(2, '0');
      const year = audit.data_fim.getFullYear();

      dataGap = `${month}/${year}`;
    }

    const scoreFinal = audit.gap_atual || 0;
    const total = audit.quantidade_desvios_planejados || 0;
    const execNoPrazo = audit.quantidade_desvios_executados || 0;
    const execForaPrazo = audit.executados_fora_prazo || 0;
    const pendForaPrazo = audit.itens_pendentes_fora_do_prazo || 0;

    const evolucao =
      total > 0
        ? Math.round(((execNoPrazo + execForaPrazo) / total) * 100)
        : null;
    const noPrazo = Math.max(
      0,
      total - execNoPrazo - execForaPrazo - pendForaPrazo,
    );

    return {
      ...audit,
      parceira: audit.turmas.turma,
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

  async create(data: GapAnalysisAuditData): Promise<AuditWithComputed> {
    const audit = await this.repo.create(data);
    return this.computeFields(audit);
  }

  async createMany(data: GapAnalysisAuditData[]): Promise<{ count: number }> {
    return this.repo.createMany(data);
  }

  async update(
    id: number,
    data: GapAnalysisAuditData,
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
