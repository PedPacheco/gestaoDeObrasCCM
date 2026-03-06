import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { GetWorkDetailsService } from '../works/getWorkDetails.service';
import { UpdateWorkService } from '../works/updateWork.service';
import { SuspensionWorkService } from '../works/suspensionWork.service';

@Injectable()
export class HandleWorkUpdateService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    private readonly getDetailsWorkService: GetWorkDetailsService,
    private readonly updateWorkService: UpdateWorkService,
    private readonly suspensionWorkService: SuspensionWorkService,
    private readonly prisma: PrismaService,
  ) {}

  async update(data: UpdateWorkDTO, id: number, permission: boolean) {
    const work = await this.getDetailsWorkService.get(id);
    const { data_empreitamento, tipo_ads } = data;

    if (work.id_status === 42 && permission) {
      throw new BadRequestException(
        'Usuário não tem permissão para atualizar essa obra',
      );
    }

    if (!work.id) {
      throw new BadGatewayException('Obra não foi encontrada');
    }

    await this.prisma.$transaction(async (tx) => {
      if (data.id_status === 4) {
        await this.suspensionWorkService.createSuspension(
          work.id,
          data.reasonSuspension,
        );
      }

      await this.updateWorkService.update(data, work.id, tx);

      if (work.id_status === 42 && data_empreitamento && tipo_ads) {
        await this.statusFlowRepository.updateStatusWorks(1, work.id, tx);
      }
    });
  }
}
