import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';
import { StatusFeasibility } from '../feasibility.service';
import { countBusinessDays } from 'src/utils/parseTimeToDate';
import { FileService } from '../file.service';
import { Prisma } from '@prisma/client';
import { AppLogger } from 'src/core/logger/logger.service';

@Injectable()
export class HandleFeasibilityService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    private readonly fileService: FileService,
    private readonly prisma: PrismaService,
    private readonly logger: AppLogger,
  ) {}

  async upload(
    idWork: number,
    idUser: number,
    pointByPoint: boolean,
    files: Express.Multer.File[],
    existingFiles: string[],
    items?: ServiceMaterialItemDto[],
  ) {
    if (!idWork) {
      throw new BadGatewayException('Obra não foi encontrada');
    }

    if ((!items || items.length === 0) && pointByPoint) {
      throw new BadRequestException('Nenhum item foi enviado.');
    }

    let feasibilityTimeframeStatus: StatusFeasibility;

    const { data_empreitamento } =
      await this.feasibilityRepository.getProjectDate(idWork);

    if (!data_empreitamento) {
      throw new BadRequestException('Obra sem data de empreitamento');
    }

    const todayDate = new Date();

    const businessDays = countBusinessDays(data_empreitamento, todayDate);

    if (businessDays > 5) {
      feasibilityTimeframeStatus = 'FORA DO PRAZO';
    } else {
      feasibilityTimeframeStatus = 'DENTRO DO PRAZO';
    }

    const filesToRemove = await this.prisma.$transaction(async (tx) => {
      const removedFiles = await this.syncFiles(
        idWork,
        idUser,
        files,
        existingFiles,
        feasibilityTimeframeStatus,
        tx,
      );

      if (pointByPoint)
        await this.feasibilityRepository.makeItemsFeasible(items, tx);

      await this.statusFlowRepository.updateStatusWorks(46, idWork, tx);

      return removedFiles;
    });

    await this.deletePhysicalFiles(filesToRemove);
  }

  async reject(data: RejectFeasibilityDTO) {
    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.reject(data, tx);

      await this.statusFlowRepository.updateStatusWorks(45, data.workId, tx);
    });
  }

  async approve(workId: number, userId: number) {
    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.approve(workId, userId, tx);

      await this.statusFlowRepository.updateStatusWorks(1, workId, tx);
    });
  }

  private async syncFiles(
    idWork: number,
    idUser: number,
    uploadedFiles: Express.Multer.File[],
    existingFiles: string[],
    status: StatusFeasibility,
    tx: Prisma.TransactionClient,
  ) {
    const currentRecord = await this.feasibilityRepository.findFiles(idWork);

    const currentFiles = currentRecord?.caminhos_arquivos ?? [];

    const removedFiles = currentFiles.filter(
      (file) => !existingFiles.includes(file),
    );

    const newFiles = uploadedFiles.map((file) => file.filename);

    const paths = [...new Set([...existingFiles, ...newFiles])];

    await this.feasibilityRepository.saveFiles(
      idWork,
      idUser,
      status,
      paths,
      tx,
    );

    return removedFiles;
  }

  private async deletePhysicalFiles(files: string[]): Promise<void> {
    await Promise.all(
      files.map(async (file) => {
        try {
          await this.fileService.deleteFile(
            `${process.env.UPLOAD_DEST}/${file}`,
          );
        } catch (error) {
          // banco já commitado — logamos e seguimos.
          // um arquivo órfão em disco é preferível a uma transaction quebrada.
          this.logger.warn(
            `Falha ao excluir arquivo ${file} do disco`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }),
    );
  }
}
