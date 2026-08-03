import { ScheduleExecutionValidatorService } from 'src/application/usecases/schedule/scheduleExecutionValidator.service';
import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';
import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { WORK_SERVICES_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { UPDATE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { WORK_SERVICES_QUERY_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesQueryRepository';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';
import { StatusFlowRepository } from 'src/infra/repositories/statusFlowRepository';
import { WorkServicesQueryRepository } from 'src/infra/repositories/worksServices/workServicesQueryRepository';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';

import { forwardRef, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';

import { ServicesController } from '../controllers/worksServices.controller';
import { ExecutionReportModule } from './executionReport.module';
import { UsersModule } from './users.module';
import { WorksModule } from './works.module';
import { WORK_SERVICES_EXECUTION_REPOSITORY } from 'src/domain/repositories/worksService/IWorkServicesExecutionRepository';
import { WorkServicesExeutionRepository } from 'src/infra/repositories/worksServices/workServicesExecutionRepository';

@Module({
  imports: [
    UsersModule,
    forwardRef(() => ExecutionReportModule),
    WorksModule,
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
          ],
          allowedExtensions: [
            '.pdf',
            '.jpg',
            '.jpeg',
            '.png',
            '.tiff',
            '.heic',
            '.heif',
          ],
          maxSize: 5 * 1024 * 1024,
          maxFiles: 3,
        });

        return multerCfg; // ← AGORA SIM está no formato esperado
      },
    }),
  ],
  controllers: [ServicesController],
  providers: [
    WorksServicesService,
    QueriesServicesService,
    FinalizeServicesService,
    ScheduleExecutionValidatorService,
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
    {
      provide: UPDATE_SCHEDULES_REPOSITORY,
      useClass: UpdateSchedulesRepository,
    },
    { provide: STATUS_FLOW_REPOSITORY, useClass: StatusFlowRepository },
  ],
  exports: [WorksServicesService],
})
export class WorksServicesModule {}
