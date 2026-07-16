import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/repositories/IFeasibilityRepository';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

export type StatusFeasibility = 'FORA DO PRAZO' | 'DENTRO DO PRAZO';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
  ) {}

  async feasibilityExists(id: number) {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    return await this.feasibilityRepository.exists(id);
  }

  async getRejections(workId: number) {
    const response = await this.feasibilityRepository.getRejections(workId);

    return response.map((item) => ({
      descricao: item.descricao,
      motivo: item.motivo,
      usuario: item.novo_tabela_usuarios.nome,
      criado_em: item.criado_em,
    }));
  }
}
