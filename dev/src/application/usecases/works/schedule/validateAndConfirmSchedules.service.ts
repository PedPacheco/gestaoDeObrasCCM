import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import {
  IValidateConfirmAndRejectSchedulesRepository,
  VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
} from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { FindScheduleByIdRepository } from 'src/infra/repositories/schedule/findScheduleByIdRepository';
import {
  ConfirmSchedulesDTO,
  RejectScheduleDTO,
  ValidateSchedulesDTO,
} from 'src/interface/dtos/scheduleDTO';

import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

import { WorkSchedule } from 'src/domain/entities/schedules/workSchedule.entity';
import { WorkScheduleMapper } from 'src/application/mappers/scheduleMapper';
import {
  FINALIZED_SCHEDULE_STATUSES,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';

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

    const schedules = await this.loadSchedules(data.map((item) => item.id));

    await this.assertPointByPointTransitionAllowed(schedules, true);

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.validate(data, tx);

        // Todas as obras envolvidas acompanham (antes só a da 1ª programação).
        for (const idWork of this.distinctWorkIds(schedules)) {
          await this.statusFlowRepository.updateStatusWorks(
            WorkStatus.VALIDADA,
            idWork,
            tx,
          );
        }
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

    const works = await this.loadSchedules(
      confirmedSchedules.map((item) => item.id),
    );

    await this.assertPointByPointTransitionAllowed(works, true);

    let schedules: WorkSchedule[];

    try {
      schedules = works.map((work) => WorkScheduleMapper.toDomain(work));
    } catch (error: any) {
      throw new BadRequestException(
        `Erro ao criar programação: ${error.message}`,
      );
    }

    for (const schedule of schedules) {
      schedule.requireDpNumber();
    }

    try {
      await this.prisma.$transaction(async (tx) => {
        await this.validateAndConfirmSchedulesRepository.confirm(
          confirmedSchedules,
          tx,
        );

        for (const idWork of this.distinctWorkIds(works)) {
          await this.statusFlowRepository.updateStatusWorks(
            WorkStatus.CONFIRMADA,
            idWork,
            tx,
          );
        }
      });
    } catch (error: any) {
      throw new InternalServerErrorException(error);
    }
  }

  async reject(data: RejectScheduleDTO[]) {
    if (!data.length) return;

    const loaded = await this.loadSchedules(data.map((item) => item.id));

    // Reprovar não exige itens, mas também não vale para programação já
    // finalizada (executada/parcial/reagendada) no ponto a ponto.
    await this.assertPointByPointTransitionAllowed(loaded, false);

    await this.prisma.$transaction(async (tx) => {
      for (const item of data) {
        const schedule = await this.findScheduleByIdRepository.findById(
          item.id,
        );

        const rejectedScheduleData = {
          ...item,
          ...schedule,
        };

        await this.validateAndConfirmSchedulesRepository.reject(
          rejectedScheduleData,
          tx,
        );

        await this.statusFlowRepository.updateStatusWorks(
          WorkStatus.SERVICOS_REAGENDADOS,
          schedule.id_obra,
          tx,
        );
      }
    });
  }

  private async loadSchedules(ids: number[]) {
    const schedules = await Promise.all(
      ids.map((id) => this.findScheduleByIdRepository.findById(id)),
    );

    const missing = ids.filter((_, index) => !schedules[index]);

    if (missing.length > 0) {
      throw new NotFoundException(
        `Programação não encontrada: ${missing.join(', ')}.`,
      );
    }

    return schedules;
  }

  private distinctWorkIds(schedules: { id_obra: number }[]): number[] {
    return [...new Set(schedules.map((schedule) => schedule.id_obra))];
  }

  /**
   * Guardas de estado do ponto a ponto (o fluxo tradicional não muda, regra 5):
   *  - programação finalizada (executada/parcial/reagendada) não é validada,
   *    confirmada nem reprovada;
   *  - validar/confirmar exige ao menos um item programado.
   */
  private async assertPointByPointTransitionAllowed(
    schedules: { id: number; id_obra: number; id_status_programacao: number }[],
    requireServices: boolean,
  ): Promise<void> {
    const works = await this.prisma.obras.findMany({
      where: { id: { in: this.distinctWorkIds(schedules) } },
      select: { id: true, programacao_ponto_a_ponto: true },
    });

    const pointByPointWorks = new Set(
      works
        .filter((work) => work.programacao_ponto_a_ponto)
        .map((work) => work.id),
    );

    const pointByPointSchedules = schedules.filter((schedule) =>
      pointByPointWorks.has(schedule.id_obra),
    );

    if (pointByPointSchedules.length === 0) return;

    const finalized = pointByPointSchedules.filter((schedule) =>
      FINALIZED_SCHEDULE_STATUSES.includes(schedule.id_status_programacao),
    );

    if (finalized.length > 0) {
      throw new ConflictException(
        `Programação já finalizada não pode mudar de etapa: ${finalized
          .map((schedule) => schedule.id)
          .join(', ')}.`,
      );
    }

    if (!requireServices) return;

    const withServices = await this.prisma.programacoes_servicos.findMany({
      where: { id_programacao: { in: pointByPointSchedules.map((s) => s.id) } },
      select: { id_programacao: true },
      distinct: ['id_programacao'],
    });

    const withServicesIds = new Set(withServices.map((s) => s.id_programacao));

    const empty = pointByPointSchedules.filter(
      (schedule) => !withServicesIds.has(schedule.id),
    );

    if (empty.length > 0) {
      throw new BadRequestException(
        `Programação sem serviços programados: ${empty
          .map((schedule) => schedule.id)
          .join(', ')}.`,
      );
    }
  }
}
