import { ScheduleExecutionValidatorService } from 'src/application/usecases/schedule/scheduleExecutionValidator.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { WorkServicesExeutionRepository } from 'src/infra/repositories/worksServices/workServicesExecutionRepository';
import { WorkServicesQueryRepository } from 'src/infra/repositories/worksServices/workServicesQueryRepository';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { ServicesController } from '../controllers/services/worksServices.controller';
import { ExecutionReportModule } from './executionReport.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';
import { ImportServicesSpreadsheetService } from 'src/application/usecases/services/importServicesSpreadsheet.service';
import { SpreadsheetParserService } from 'src/infra/spreadsheet/spreadsheet.service';
import { ServicesExecutionController } from '../controllers/services/servicesExecution.controller';
import { ServicesQueryController } from '../controllers/services/servicesQuery.controller';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';
import { ScheduleModule } from './schedule.module';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/contracts/schedule/IFindScheduleByIdRepository';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesQueryRepository';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/contracts/worksService/IWorkServicesExecutionRepository';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/contracts/IStatusFlowRepository';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => WorksModule),
    forwardRef(() => ScheduleModule),
    forwardRef(() => ExecutionReportModule),
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const multerCfg = createMulterConfig({
          destination: config.get<string>('UPLOAD_AS_BUILD'),
          allowedMimeTypes: [
            'application/pdf',
            'image/jpeg',
            'image/jpg',
            'image/tiff',
            'image/png',
            'image/heic',
            'image/heif',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
          ],
          allowedExtensions: [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.tiff',
            '.heic',
            '.heif',
            '.xlsx',
            '.xls',
          ],
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
    }),
  ],
  controllers: [
    ServicesController,
    ServicesExecutionController,
    ServicesQueryController,
  ],
  providers: [
    WorksServicesService,
    QueriesServicesService,
    FinalizeServicesService,
    ScheduleExecutionValidatorService,
    ScheduleProgressCalculatorService,
    ImportServicesSpreadsheetService,
    SpreadsheetParserService,
    ExportServicesService,
    {
      provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
      useClass: FindScheduleByIdRepository,
    },
    {
      provide: WORK_SERVICES_REPOSITORY,
      useClass: WorkServicesRepository,
    },
    {
      provide: WORK_SERVICES_QUERY_REPOSITORY,
      useClass: WorkServicesQueryRepository,
    },
    {
      provide: WORK_SERVICES_EXECUTION_REPOSITORY,
      useClass: WorkServicesExeutionRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
  ],
  exports: [
    WorksServicesService,
    QueriesServicesService,
    ExportServicesService,
  ],
})
export class WorksServicesModule {}
