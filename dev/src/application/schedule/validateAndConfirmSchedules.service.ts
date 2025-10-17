import {
  IValidateConfirmAndRejectSchedulesRepository,
  VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';

@Injectable()
export class ValidateConfirmAndRejectSchedulesService {
  constructor(
    @Inject(VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY)
    private readonly validateAndConfirmSchedulesRepository: IValidateConfirmAndRejectSchedulesRepository,
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FIND_SCHEDULE_BY_ID_REPOSITORY)
    private readonly findScheduleByIdRepository: FindScheduleByIdRepository,
    private readonly prisma: PrismaService,
  ) {}

  async validate(data: ValidateSchedulesDTO[]) {
    if (!data || data.length === 0) {
      throw new BadRequestException(
        'Nenhuma programação foi enviada para ser validada',
      );
    }

    const validatedSchedules = data.filter((item) => !item.validate);

    if (validatedSchedules.length > 0) {
      throw new BadRequestException('Existe programações não validadas');
    }

    const work = await this.findScheduleByIdRepository.findById(data[0].id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.validate(data, tx);
        await this.statusFlowRepository.updateStatusWorks(37, work.id_obra, tx);
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error);
    }
  }

  async confirm(data: ConfirmSchedulesDTO[]) {
    const confirmedSchedules = data.filter((item) => item.confirm);

    if (confirmedSchedules.length === 0) {
      throw new BadRequestException('Nenhuma programação para ser confirmada');
    }

    const work = await this.findScheduleByIdRepository.findById(data[0].id);

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.confirm(data, tx);
        await this.statusFlowRepository.updateStatusWorks(35, work.id_obra, tx);
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error);
    }
  }

  async reject(data: RejectScheduleDTO) {
    const {
      id_obra,
      data_prog,
      prog,
      equip_desligado,
      hora_ini,
      hora_ter,
      equipe_linha_morta,
      equipe_linha_viva,
      equipe_regularizacao,
      tipo_servico,
      observacao_programacao,
    } = await this.findScheduleByIdRepository.findById(data.id);

    try {
      const rejectedScheduleData = {
        ...data,
        id_obra,
        data_prog,
        prog,
        equip_desligado,
        hora_ini,
        hora_ter,
        equipe_linha_viva,
        equipe_linha_morta,
        equipe_regularizacao,
        tipo_servico,
        observacao_programacao,
      };

      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.reject(
          rejectedScheduleData,
          tx,
        );
        await this.statusFlowRepository.updateStatusWorks(36, id_obra, tx);
      });
    } catch (error) {
      throw error;
    }
  }
}
