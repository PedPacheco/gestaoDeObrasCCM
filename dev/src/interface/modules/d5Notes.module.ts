import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { D5NotesController } from '../controllers/d5Notes.controller';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { D5_NOTES_REPOSITORY } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { D5NotesRepository } from 'src/infra/repositories/d5Notes/d5NotesRepository';
import { D5_NOTES_SCHEDULES_REPOSITORY } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { D5NotesSchedulesRepository } from 'src/infra/repositories/d5Notes/d5NotesSchedulesRepository';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ManageD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/manageD5NoteSchedule.service';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { createMulterConfig } from 'src/shared/multer/multer.config';
import { FileService } from 'src/application/usecases/file.service';

@Module({
  imports: [
    UsersModule,
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
  controllers: [D5NotesController],
  providers: [
    FindD5NotesService,
    FindD5SchedulesService,
    ManageD5NoteScheduleService,
    FileService,
    { provide: D5_NOTES_REPOSITORY, useClass: D5NotesRepository },
    {
      provide: D5_NOTES_SCHEDULES_REPOSITORY,
      useClass: D5NotesSchedulesRepository,
    },
  ],
})
export class D5NotesModule {}
