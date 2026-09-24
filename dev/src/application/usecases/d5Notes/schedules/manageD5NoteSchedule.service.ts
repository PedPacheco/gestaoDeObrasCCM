import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service';
import {
  CreateProgramacaoD5Dto,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';
import { FileService } from '../../file.service';
import { join } from 'path';
import { AppLogger } from 'src/core/logger/logger.service';

@Injectable()
export class ManageD5NoteScheduleService {
  private readonly logger = new AppLogger(ManageD5NoteScheduleService.name);

  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private d5NotesScheduleRepository: ID5NotesSchedulesRepository,
    private fileService: FileService,
  ) {}

  async create(data: CreateProgramacaoD5Dto) {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    const schedule = D5NoteSchedule.create(
      D5NoteScheduleMapper.fromCreateInput(data),
    );

    const formattedData = D5NoteScheduleMapper.toPersistenceCreate(schedule);

    return await this.d5NotesScheduleRepository.create(formattedData);
  }

  async update(
    id: number,
    data: UpdateScheduleD5Dto,
    files: Express.Multer.File[],
    modifyingUserId: number,
  ) {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    const uploaded = files ?? [];
    let committed = false;

    try {
      const existing = await this.d5NotesScheduleRepository.getById(id);

      if (!existing) {
        throw new NotFoundException('Programação não encontrada.');
      }

      const current = D5NoteScheduleMapper.toDomain(existing);

      const { finalPaths, toRemove } = resolveFileDiff(
        existing.caminhos_arquivos ?? [],
        data.keptFiles,
        uploaded.map((file) => file.filename),
      );

      const schedule = D5NoteSchedule.create(
        D5NoteScheduleMapper.fromUpdateInput(data, {
          id,
          d5NoteId: current.d5NoteId,
          creatorUserId: current.creatorUserId,
          modifyingUserId,
          filePaths: finalPaths,
          current,
        }),
      );

      await this.d5NotesScheduleRepository.update(
        id,
        D5NoteScheduleMapper.toPersistenceUpdate(schedule),
      );

      committed = true;

      // ponto de não retorno — só aqui os antigos saem do disco
      await this.fileService.deleteMany(
        toRemove.map((path) => join(process.env.UPLOAD_AS_BUILD, path)),
        process.env.UPLOAD_AS_BUILD,
      );
    } catch (error) {
      if (!committed) {
        // rollback best-effort: file.path do Multer já é absoluto
        await this.fileService
          .deleteMany(
            uploaded.map((file) => file.path),
            process.env.UPLOAD_AS_BUILD,
          )
          .catch((cleanupError) => {
            this.logger.error(
              `Falha ao remover uploads órfãos da programação ${id}`,
              cleanupError instanceof Error ? cleanupError.stack : cleanupError,
            );
          });
      }

      throw error;
    }
  }

  async delete(id: number): Promise<void> {
    if (!id) {
      throw new BadRequestException('Programação não enviada para exclusão.');
    }

    const existing = await this.d5NotesScheduleRepository.getById(id);

    if (!existing) {
      throw new NotFoundException('Programação não encontrada.');
    }

    const filePaths = existing.caminhos_arquivos ?? [];

    // 1) remove o registo primeiro — ponto de não retorno
    await this.d5NotesScheduleRepository.delete(id);

    // 2) só depois limpa o disco
    await this.fileService.deleteMany(
      filePaths.map((path) => join(process.env.UPLOAD_AS_BUILD, path)),
      process.env.UPLOAD_AS_BUILD,
    );
  }
}
