import { Inject, Injectable } from '@nestjs/common';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';

@Injectable()
export class FindD5SchedulesService {
  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private d5SchedulesRepository: ID5NotesSchedulesRepository,
  ) {}

  async findByD5NoteId(id: number) {
    const data = await this.d5SchedulesRepository.getByD5NoteId(id);

    return data.map(
      ({
        tecnicos,
        restricoes,
        usuario_criador,
        usuario_modificador,
        ...rest
      }) => ({
        ...rest,
        usuarioModificador: usuario_modificador?.nome ?? null,
        usuarioCriador: usuario_criador?.nome ?? null,
        tecnico: tecnicos.tecnico,
        restricao: restricoes.restricao,
      }),
    );
  }
}
