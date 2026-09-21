import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { D5NotesController } from '../controllers/d5Notes.controller';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { D5_NOTES_REPOSITORY } from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { FindD5NoteByIdService } from 'src/application/usecases/d5Notes/notes/findD5NotesById.service';
import { D5NotesRepository } from 'src/infra/repositories/d5Notes/d5NotesRepository';
import { D5_NOTES_SCHEDULES_REPOSITORY } from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { D5NotesSchedulesRepository } from 'src/infra/repositories/d5Notes/d5NotesSchedulesRepository';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5SchedulesById.service';
import { CreateD5NoteScheduleService } from 'src/application/usecases/d5Notes/schedules/createD5NoteSchedule.service';

@Module({
  imports: [UsersModule],
  controllers: [D5NotesController],
  providers: [
    FindD5NotesService,
    FindD5NoteByIdService,
    FindD5SchedulesService,
    CreateD5NoteScheduleService,
    { provide: D5_NOTES_REPOSITORY, useClass: D5NotesRepository },
    {
      provide: D5_NOTES_SCHEDULES_REPOSITORY,
      useClass: D5NotesSchedulesRepository,
    },
  ],
})
export class D5NotesModule {}
