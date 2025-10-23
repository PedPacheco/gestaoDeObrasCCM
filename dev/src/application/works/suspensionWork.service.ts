import { BadRequestException, Inject, Injectable } from '@nestjs/common';
// import * as moment from 'moment';
import {
  ISuspensionWorkRepository,
  SUSPENSION_WORK_REPOSITORY,
} from 'src/domain/repositories/works/ISuspensionWorkRepository';
import { SuspensionWorksDTO } from 'src/interface/dtos/worksDto';
import { FindExistingWorksService } from './findExistingWorks.service';

@Injectable()
export class SuspensionWorkService {
  constructor(
    @Inject(SUSPENSION_WORK_REPOSITORY)
    private readonly suspensionWorkRepository: ISuspensionWorkRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async createSuspension(workId: number, reason: string) {
    if (!reason?.trim()) {
      throw new BadRequestException('Motivo da suspensão é obrigatório');
    }

    const data = {
      id_obra: workId,
      data: new Date(),
      motivo: reason,
    };

    await this.suspensionWorkRepository.create(data);
  }

  async createMultipleSuspensions(data: SuspensionWorksDTO[]) {
    if (!Array.isArray(data) || data.length === 0) {
      throw new BadRequestException('Nenhuma obra enviada para ser suspensa');
    }

    const invalid = data.find(
      (item) => !item.ovnota?.trim() || !item.motivo?.trim(),
    );

    if (invalid) {
      throw new BadRequestException(
        `O motivo da suspensão da obra ou o próprio número da obra não foi enviado`,
      );
    }

    const uniquesWorks = Array.from(new Set(data.map((item) => item.ovnota)));

    const existingOvs =
      await this.findExistingWorksService.findExistingWorks(uniquesWorks);

    const ovMap = new Map(existingOvs.map((ov) => [ov.ovnota, ov.id]));

    const dataWithIds = data.map((work) => {
      const id = ovMap.get(work.ovnota);
      return { id_obra: id, motivo: work.motivo, data: new Date() };
    });

    await this.suspensionWorkRepository.createMultiple(dataWithIds);
  }
}
