import { Module } from '@nestjs/common';

import { GapAnalysisAuditService } from 'src/application/usecases/gap-analysis-audit.service';

import { GapAnalysisAuditRepository } from 'src/infra/repositories/gapAnalysisAuditRepository';
import { GapAnalysisAuditController } from '../controllers/gap-analysis-audit.controller';
import { GAP_ANALYSIS_AUDIT_REPOSITORY } from 'src/domain/contracts/IGapAnalysisAuditRepository';

@Module({
  controllers: [GapAnalysisAuditController],
  providers: [
    GapAnalysisAuditService,
    {
      provide: GAP_ANALYSIS_AUDIT_REPOSITORY,
      useClass: GapAnalysisAuditRepository,
    },
  ],
})
export class GapAnalysisAuditModule {}
