import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import type { UpdateD5NoteInput } from 'src/application/types/usecases/d5Notes/d5Notes.types';
import {
  D5_NOTES_REPOSITORY,
  ID5NotesRepository,
} from 'src/domain/contracts/d5Notes/ID5notesRepository';

@Injectable()
export class ManageD5NoteService {
  constructor(
    @Inject(D5_NOTES_REPOSITORY)
    private readonly d5NotesRepository: ID5NotesRepository,
  ) {}

  async update(
    id: number,
    data: UpdateD5NoteInput,
    modifyingUserId: number,
  ): Promise<void> {
    if (!data || Object.keys(data).length === 0) {
      throw new BadRequestException('Nenhum campo fornecido para atualização.');
    }

    const existing = await this.d5NotesRepository.getById(id);
    if (!existing) {
      throw new NotFoundException('Nota D5 não encontrada.');
    }

    // P2025/P2003 são traduzidos no repositório para NotFoundError/ValidationError
    await this.d5NotesRepository.update(id, data, modifyingUserId);
  }
}
