import { Module } from '@nestjs/common';

import { UsersModule } from './users.module';
import { D5NotesController } from '../controllers/d5Notes.controller';
import { D5NotesService } from 'src/application/usecases/d5Notes.service';
import { D5_NOTES_REPOSITORY } from 'src/domain/repositories/d5notesRepository';
import { D5NotesRepository } from 'src/infra/repositories/d5NotesRepository';

@Module({
  imports: [UsersModule],
  controllers: [D5NotesController],
  providers: [
    D5NotesService,
    { provide: D5_NOTES_REPOSITORY, useClass: D5NotesRepository },
  ],
})
export class D5NotesModule {}
