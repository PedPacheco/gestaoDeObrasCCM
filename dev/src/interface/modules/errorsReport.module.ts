import { ErrorsReportService } from 'src/application/usecases/errorsReport.service';
import { ERRORS_REPORT_REPOSITORY } from 'src/domain/contracts/IErrorsReportRepository';
import { ErrorsReportRepository } from 'src/infra/repositories/errorsReportRepository';

import { Module } from '@nestjs/common';

import { ErrorsReportController } from '../controllers/errorsReport.controller';

@Module({
  controllers: [ErrorsReportController],
  providers: [
    ErrorsReportService,
    { provide: ERRORS_REPORT_REPOSITORY, useClass: ErrorsReportRepository },
  ],
  exports: [],
})
export class ErrorsReportModule {}
