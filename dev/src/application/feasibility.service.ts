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

  async handleUpload(idWork: number, files: any[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('Nenhum arquivo foi enviado.');
    }

    if (!idWork) {
      throw new BadRequestException('O ID da obra é obrigatório.');
    }

    const exists = await this.feasibilityRepository.exists(idWork);

    if (exists) {
      throw new BadRequestException(
        'Já existem arquivos importados para esta obra.',
      );
    }

    await this.feasibilityRepository.saveFiles(idWork, files);
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
      this.fileService.deleteFile(file.caminho_arquivo);
    }

    await this.feasibilityRepository.deleteFiles(idWork);
  }
}
