import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { D5NoteScheduleMapper } from 'src/application/mappers/d5NotesScheduleMapper';
import { D5NoteSchedule } from 'src/domain/entities/schedules/D5NotesSchedule.entity';
import {
  D5_NOTES_SCHEDULES_REPOSITORY,
  ID5NotesSchedulesRepository,
} from 'src/domain/repositories/d5Notes/ID5NotesSchedulesRepository';
import {
  CreateProgramacaoD5Dto,
  UpdateScheduleD5Dto,
} from 'src/interface/dtos/d5NotesDTO';

@Injectable()
export class ManageD5NoteScheduleService {
  constructor(
    @Inject(D5_NOTES_SCHEDULES_REPOSITORY)
    private d5NotesScheduleRepository: ID5NotesSchedulesRepository,
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

  async update(id: number, data: UpdateScheduleD5Dto) {
    if (!data) {
      throw new BadRequestException(
        'Nenhuma programação fornecida para inserção.',
      );
    }

    const schedule = D5NoteSchedule.create(
      D5NoteScheduleMapper.fromUpdateInput(id, data),
    );

    const formattedData = D5NoteScheduleMapper.toPersistenceUpdate(schedule);

    return await this.d5NotesScheduleRepository.update(id, formattedData);
  }
}
