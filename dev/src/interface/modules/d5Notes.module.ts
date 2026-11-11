import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { ManageD5NoteService } from 'src/application/usecases/d5Notes/notes/manageD5Note.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import { D5_NOTES_REPOSITORY } from 'src/domain/contracts/d5Notes/ID5notesRepository';
import { D5_NOTES_SCHEDULES_REPOSITORY } from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import { TimeMetricsService } from 'src/domain/services/d5Notes/timeMetrics.service';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';
import { D5NotesRepository } from 'src/infra/repositories/d5Notes/d5NotesRepository';
import { D5NotesSchedulesRepository } from 'src/infra/repositories/d5Notes/d5NotesSchedulesRepository';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { DOCUMENT_UPLOAD_PRESET } from 'src/shared/upload/uploadPresets';
import { D5NotesController } from '../controllers/d5Notes.controller';
import { FileModule } from './file.module';
import { UsersModule } from './users.module';

@Module({
  imports: [
    UsersModule,
    FileModule,
    MulterModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        createMulterConfig({
          destination: config.getOrThrow<string>('UPLOAD_AS_BUILD'),
          ...DOCUMENT_UPLOAD_PRESET,
        }),
    }),
  ],
  controllers: [D5NotesController],
  providers: [
    FindD5NotesService,
    FindD5SchedulesService,
    ManageD5NoteScheduleService,
    ManageD5NoteService,
    DeadlineStatusService,
    TimeMetricsService,
    { provide: D5_NOTES_REPOSITORY, useClass: D5NotesRepository },
    {
      provide: D5_NOTES_SCHEDULES_REPOSITORY,
      useClass: D5NotesSchedulesRepository,
    },
  ],
  exports: [FindD5NotesService],
})
export class D5NotesModule {}
