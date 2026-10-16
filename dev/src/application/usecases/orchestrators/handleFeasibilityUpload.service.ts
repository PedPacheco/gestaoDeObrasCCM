import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { countBusinessDays } from 'src/utils/parseTimeToDate';

import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { StatusFeasibility } from '../feasibility.service';
import { FileService } from '../file.service';

@Injectable()
export class HandleFeasibilityService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    private readonly fileService: FileService,
    private readonly prisma: PrismaService,
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
        'tecnhical',
        tx,
        feasibilityTimeframeStatus,
      );

      if (pointByPoint)
        await this.feasibilityRepository.makeItemsFeasible(items, tx);

      await this.statusFlowRepository.updateStatusWorks(46, idWork, tx);

      return removedFiles;
    });

    await this.deletePhysicalFiles(filesToRemove);
  }

  async uploadComplementaryFiles(
    idWork: number,
    idUser: number,
    files: Express.Multer.File[],
    existingFiles: string[],
  ) {
    if (!idWork) {
      throw new BadGatewayException('Obra não foi encontrada');
    }

    const filesToRemove = await this.prisma.$transaction(async (tx) => {
      return await this.syncFiles(
        idWork,
        idUser,
        files,
        existingFiles,
        'complementary',
        tx,
      );
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
    type: 'complementary' | 'tecnhical',
    tx: Prisma.TransactionClient,
    status?: StatusFeasibility,
  ) {
    const currentRecord = await this.feasibilityRepository.findFiles(idWork);

    const currentFiles =
      type === 'tecnhical'
        ? (currentRecord?.caminhos_arquivos ?? [])
        : (currentRecord?.arquivos_complementares ?? []);

    const removedFiles = currentFiles.filter(
      (file) => !existingFiles.includes(file),
    );

    const newFiles = uploadedFiles.map((file) => file.filename);

    const paths = [...new Set([...existingFiles, ...newFiles])];

    if (type === 'tecnhical') {
      await this.feasibilityRepository.saveFiles(
        idWork,
        idUser,
        status,
        paths,
        tx,
      );

      return removedFiles;
    }

    await this.feasibilityRepository.updateFiles(idWork, paths, type, tx);

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
          console.error(`Falha ao excluir arquivo ${file} do disco`, error);
        }
      }),
    );
  }
}
