import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { FeasibilityService } from '../feasibility.service';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';

@Injectable()
export class HandleFeasibilityService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    private readonly feasibilityService: FeasibilityService,
    private readonly prisma: PrismaService,
  ) {}

  async update(
    idWork: number,
    idUser: number,
    files: Express.Multer.File[],
    items: ServiceMaterialItemDto[],
  ) {
    if (!idWork) {
      throw new BadGatewayException('Obra não foi encontrada');
    }

    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    if (!items || items.length === 0) {
      throw new BadRequestException('Nenhum item foi enviado.');
    }

    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.saveFiles(idWork, idUser, files, tx);

      await this.feasibilityRepository.makeItemsFeasible(items, tx);

      await this.statusFlowRepository.updateStatusWorks(46, idWork, tx);
    });
  }

  async reject(data: RejectFeasibilityDTO) {
    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.reject(data, tx);

      await this.statusFlowRepository.updateStatusWorks(45, data.idWork, tx);
    });
  }
}
