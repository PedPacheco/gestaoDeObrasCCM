import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';
import { FileService } from './file.service';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
    private readonly fileService: FileService,
  ) {}

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

  async approve(idWork: number) {
    await this.feasibilityRepository.approve(idWork);
  }
}
