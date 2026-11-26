import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5Notes/d5NotesScheduleMapper';
import {
  CreateD5ScheduleInput,
  RejectD5ScheduleInput,
  UpdateD5ScheduleInput,
} from 'src/application/types';

import { AppLogger } from 'src/core/logger/logger.service';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/contracts/d5Notes/ID5NotesSchedulesRepository';
import {
  FILE_STORAGE,
  IFileStorage,
} from 'src/domain/contracts/storage/IFileStorage';
import { D5NoteSchedule } from 'src/domain/entities/schedules/d5NotesSchedule.entity';
import { resolveFileDiff } from 'src/domain/services/resolveFileDiff.service'; // 6b: domain/rules
import { StorageKind } from 'src/domain/types';
import { uploadedPaths } from 'src/shared/upload/storedFileName';

@Injectable()
export class ManageD5NoteScheduleService {
  private readonly logger = new AppLogger(ManageD5NoteScheduleService.name);

  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private readonly d5NotesScheduleRepository: ID5NotesSchedulesRepository,
    @Inject(FILE_STORAGE)
    private readonly storage: IFileStorage,
  ) {}

  async create(data: CreateD5ScheduleInput): Promise<void> {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    const schedule = D5NoteSchedule.create(
      D5NoteScheduleMapper.fromCreateInput(data),
    );
    await this.d5NotesScheduleRepository.create(schedule);
  }

  async update(
    id: number,
    data: UpdateD5ScheduleInput,
    files: Express.Multer.File[],
    modifyingUserId: number,
  ): Promise<void> {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    const uploaded = files ?? [];
    let committed = false;

    try {
      const current = await this.d5NotesScheduleRepository.getById(id);
      if (!current) {
        throw new NotFoundException('Programação não encontrada.');
      }

      const { finalPaths, toRemove } = resolveFileDiff(
        current.filePaths ?? [],
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

      await this.d5NotesScheduleRepository.updateAndSyncWorkStatus(
        id,
        schedule,
        schedule.rejected,
      );
      committed = true;

      // ponto de não retorno: só aqui os antigos saem do disco
      await this.storage.deleteStored(StorageKind.AS_BUILD, toRemove);
    } catch (error) {
      if (!committed) {
        await this.storage
          .deleteUploaded(StorageKind.AS_BUILD, uploadedPaths(uploaded))
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

    const storedFiles = existing.filePaths ?? [];

    // 1) remove o registo primeiro: ponto de não retorno
    await this.d5NotesScheduleRepository.delete(id);

    // 2) só depois limpa o disco
    await this.storage.deleteStored(StorageKind.AS_BUILD, storedFiles);
  }

  async reject(
    d5NoteId: number,
    data: RejectD5ScheduleInput[],
    rejectingUserId: number,
  ): Promise<void> {
    if (!data.length) return;

    const existingSchedules =
      await this.d5NotesScheduleRepository.getByD5NoteId(d5NoteId);
    const byId = new Map(existingSchedules.map((s) => [s.id, s]));

    const missingIds = data
      .map((item) => item.id)
      .filter((id) => !byId.has(id));
    if (missingIds.length) {
      throw new NotFoundException(
        `Programações não encontradas para esta nota D5: ${missingIds.join(', ')}`,
      );
    }

    const ids = data.map((item) => item.id);
    const rejections = data.map((item) =>
      D5NoteScheduleMapper.toRejectionData(byId.get(item.id)!, {
        restrictionId: item.restrictionId,
        description: item.description,
        rejectingUserId,
      }),
    );

    await this.d5NotesScheduleRepository.rejectMany(ids, rejections, d5NoteId);
  }
}
