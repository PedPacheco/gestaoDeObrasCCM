import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  D5_NOTES_REPOSITORY,
  ID5NotesRepository,
} from 'src/domain/repositories/d5Notes/ID5notesRepository';
import { UpdateD5NoteDTO } from 'src/interface/dtos/d5NotesDTO';

@Injectable()
export class ManageD5NoteService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private d5NotesRepository: ID5NotesRepository,
  ) {}

  async update(id: number, data: UpdateD5NoteDTO, modifyingUserId: number) {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('Nenhum campo fornecido para atualização.');
    }

    try {
      const existing = await this.d5NotesRepository.getById(id);

      if (!existing) {
        throw new NotFoundException('Programação não encontrada.');
      }

      console.log(data);

      await this.d5NotesRepository.update(id, data, modifyingUserId);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        if (e.code === 'P2025')
          throw new NotFoundException('Nota D5 não encontrada.');
        if (e.code === 'P2003')
          throw new BadRequestException('Parceira ou status inexistente.');
      }
      throw e;
    }
  }
}
