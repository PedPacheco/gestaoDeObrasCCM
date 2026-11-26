import {
  BadGatewayException,
  BadRequestException,
  Inject,
  Injectable,
} from '@nestjs/common';
import {
  FeasibleItemInput,
  RejectFeasibilityInput,
} from 'src/application/types';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';
import {
  IStatusFlowRepository,
  STATUS_FLOW_REPOSITORY,
} from 'src/domain/contracts/IStatusFlowRepository';
import {
  FILE_STORAGE,
  IFileStorage,
} from 'src/domain/contracts/storage/IFileStorage';
import {
  FeasibilityFileType,
  StatusFeasibility,
  StorageKind,
} from 'src/domain/types';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { uploadedPaths } from 'src/shared/upload/storedFileName';
import { countBusinessDays } from 'src/utils/parseTimeToDate';

type ResolvedFiles = { paths: string[]; removedFiles: string[] };

@Injectable()
export class HandleFeasibilityService {
  constructor(
    @Inject(STATUS_FLOW_REPOSITORY)
    private readonly statusFlowRepository: IStatusFlowRepository,
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    @Inject(FILE_STORAGE)
    private readonly storage: IFileStorage,
    private readonly prisma: PrismaService, // sai na 5D (IUnitOfWork)
  ) {}

  async upload(
    workId: number,
    userId: number,
    pointByPoint: boolean,
    files: Express.Multer.File[],
    existingFiles: string[],
    items?: FeasibleItemInput[],
  ): Promise<void> {
    const filesToRemove = await this.withUploadCleanup(files, async () => {
      if (!workId) {
        throw new BadGatewayException('Obra não foi encontrada'); // ver secção 5
      }
      if (!items?.length && pointByPoint) {
        throw new BadRequestException('Nenhum item foi enviado.');
      }

      const status = await this.resolveTimeframeStatus(workId);
      const { paths, removedFiles } = await this.resolveFiles(
        workId,
        'technical',
        files,
        existingFiles,
      );

      await this.prisma.$transaction(async (tx) => {
        await this.feasibilityRepository.saveFiles(
          workId,
          userId,
          status,
          paths,
          tx,
        );
        if (pointByPoint) {
          await this.feasibilityRepository.makeItemsFeasible(
            (items ?? []).map((i) => ({
              id: i.id,
              feasibleQuantity: i.viabilizado,
            })),
            tx,
          );
        }
        await this.statusFlowRepository.updateStatusWorks(46, workId, tx); // 6d: WorkStatus
      });

      return removedFiles;
    });

    await this.storage.deleteStored(StorageKind.VIABILIDADE, filesToRemove);
  }

  async uploadComplementaryFiles(
    workId: number,
    userId: number,
    files: Express.Multer.File[],
    existingFiles: string[],
  ): Promise<void> {
    const filesToRemove = await this.withUploadCleanup(files, async () => {
      if (!workId) {
        throw new BadGatewayException('Obra não foi encontrada'); // ver secção 5
      }

      const { paths, removedFiles } = await this.resolveFiles(
        workId,
        'complementary',
        files,
        existingFiles,
      );

      await this.prisma.$transaction((tx) =>
        this.feasibilityRepository.updateFiles(
          workId,
          paths,
          'complementary',
          tx,
        ),
      );

      return removedFiles;
    });

    await this.storage.deleteStored(StorageKind.VIABILIDADE, filesToRemove);
  }

  async reject(data: RejectFeasibilityInput): Promise<void> {
    const { workId, ...rejection } = data;
    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.reject(rejection, tx);
      await this.statusFlowRepository.updateStatusWorks(45, workId, tx); // 6d: WorkStatus
    });
  }

  async approve(workId: number, userId: number): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await this.feasibilityRepository.approve(workId, userId, tx);
      await this.statusFlowRepository.updateStatusWorks(1, workId, tx); // 6d: WorkStatus
    });
  }

  // ─── Privados ───────────────────────────────────────────────────────

  /** 6d: a regra dos 5 dias úteis passa para domain/rules/feasibilityDeadline.rules.ts */
  private async resolveTimeframeStatus(
    workId: number,
  ): Promise<StatusFeasibility> {
    const projectDate = await this.feasibilityRepository.getProjectDate(workId);
    if (!projectDate) {
      throw new BadRequestException('Obra sem data de empreitamento');
    }
    return countBusinessDays(projectDate, new Date()) > 5
      ? 'FORA DO PRAZO'
      : 'DENTRO DO PRAZO';
  }

  /** Calcula a lista final de ficheiros e os que deixam de ser usados. Não grava nada. */
  private async resolveFiles(
    workId: number,
    type: FeasibilityFileType,
    uploadedFiles: Express.Multer.File[] | undefined,
    existingFiles: string[] | undefined,
  ): Promise<ResolvedFiles> {
    const current = await this.feasibilityRepository.findFiles(workId);
    const currentFiles =
      type === 'technical'
        ? (current?.technicalFiles ?? [])
        : (current?.complementaryFiles ?? []);

    // Só são mantidos nomes que JÁ pertencem a esta obra (o existingFiles vem do cliente)
    const keptFiles = (existingFiles ?? []).filter((f) =>
      currentFiles.includes(f),
    );
    const removedFiles = currentFiles.filter((f) => !keptFiles.includes(f));
    const newFiles = (uploadedFiles ?? []).map((f) => f.filename);

    return { paths: [...new Set([...keptFiles, ...newFiles])], removedFiles };
  }

  /** Corre fn e, se falhar, apaga os uploads deste pedido antes de relançar o erro. */
  private async withUploadCleanup<T>(
    files: Express.Multer.File[] | undefined,
    fn: () => Promise<T>,
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      await this.storage.deleteUploaded(
        StorageKind.VIABILIDADE,
        uploadedPaths(files),
      );
      throw error;
    }
  }
}
