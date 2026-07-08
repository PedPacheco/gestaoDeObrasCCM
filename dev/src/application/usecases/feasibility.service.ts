import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';
import { FileService } from './file.service';
import { Prisma } from '@prisma/client';
import { ServiceMaterialItemDto } from 'src/interface/dtos/workServicesDTO';
import { RejectFeasibilityDTO } from 'src/interface/dtos/feasibilityDTO';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    private readonly fileService: FileService,
  ) {}

  async handleUpload(
    idWork: number,
    idUser: number,
    files: any[],
    tx: Prisma.TransactionClient,
  ) {
    const exists = await this.feasibilityRepository.exists(idWork);

    if (exists && exists.length > 0) {
      throw new BadRequestException(
        'Já existem arquivos importados para esta obra.',
      );
    }

    await this.feasibilityRepository.saveFiles(idWork, idUser, files, tx);
  }

  async makeItemsFeasible(
    items: ServiceMaterialItemDto[],
    tx: Prisma.TransactionClient,
  ) {
    await this.feasibilityRepository.makeItemsFeasible(items, tx);
  }

  async feasibilityExists(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    return await this.feasibilityRepository.exists(id);
  }

  async deleteFeasibilityFiles(idWork: number) {
    const files = await this.feasibilityRepository.findFiles(idWork);

    if (!files.length) {
      throw new BadRequestException('Nenhum arquivo encontrado para esta obra');
    }

    for (const file of files) {
      this.fileService.deleteFile(
        `${process.env.UPLOAD_DEST}/${file.caminho_arquivo}`,
      );
    }

    await this.feasibilityRepository.deleteFiles(files[0].id_obra);
  }

  async getRejections(idWork: number) {
    const response = await this.feasibilityRepository.getRejections(idWork);

    return response.map((item) => ({
      descricao: item.descricao,
      motivo: item.motivo,
      usuario: item.novo_tabela_usuarios.nome,
      criado_em: item.criado_em,
    }));
  }

  async reject(data: RejectFeasibilityDTO, tx: Prisma.TransactionClient) {
    await this.feasibilityRepository.reject(data, tx);
  }

  async approve(idWork: number) {
    await this.feasibilityRepository.approve(idWork);
  }
}
