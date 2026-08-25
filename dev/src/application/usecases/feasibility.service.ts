import {
  FEASIBILITY_REPOSITORY,
  IFeasibilityRepository,
} from 'src/domain/contracts/IFeasibilityRepository';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { ExistsResponse } from 'src/domain/types';
import { FeasibilityRejectionOutput } from '../types';

@Injectable()
export class FeasibilityService {
  constructor(
    @Inject(FEASIBILITY_REPOSITORY)
    private readonly feasibilityRepository: IFeasibilityRepository,
  ) {}

  async feasibilityExists(id: number): Promise<ExistsResponse> {
    if (!id) {
      throw new BadRequestException('Obra não foi enviada');
    }

    return await this.feasibilityRepository.exists(id);
  }

  async getRejections(workId: number): Promise<FeasibilityRejectionOutput[]> {
    const response = await this.feasibilityRepository.getRejections(workId);

    return response.map((item) => ({
      descricao: item.descricao,
      motivo: item.motivo,
      usuario: item.novo_tabela_usuarios.nome,
      criado_em: item.criado_em,
    }));
  }
}
