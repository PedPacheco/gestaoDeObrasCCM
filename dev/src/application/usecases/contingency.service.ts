import {
  CONTINGENCY_REPOSITORY,
  ContingencyDashboard,
  IContingencyRepository,
} from 'src/domain/repositories/IContingencyRepository';

import { Inject, Injectable } from '@nestjs/common';

import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from '../../interface/dtos/contingencyDTO';

@Injectable()
export class ContingencyService {
  constructor(
    @Inject(CONTINGENCY_REPOSITORY)
    private readonly contingencyRepository: IContingencyRepository,
  ) {}

  async create(data: CreateContingencyDTO, idUser: number): Promise<void> {
    await this.contingencyRepository.create({
      dia_disponibilidade: new Date(data.dia_disponibilidade),
      parceira: data.parceira,
      tipo_recurso_mao_obra: data.tipo_recurso_mao_obra,
      quantidade_mao_obra: data.quantidade_mao_obra,
      tipo_recurso_equipe: data.tipo_recurso_equipe,
      quantidade_equipe: data.quantidade_equipe,
      disponibilizado_csd: data.disponibilizado_csd,
      id_usuario: idUser ?? null,
    });
  }

  async getDashboard(
    query: DashboardFilterDTO = {},
  ): Promise<ContingencyDashboard> {
    const split = (value?: string) =>
      value ? value.split(',').filter(Boolean) : undefined;

    return this.contingencyRepository.getDashboard({
      dataInicial: query.dataInicial,
      dataFinal: query.dataFinal,
      parceira: split(query.parceira),
      maoObra: split(query.tipo_recurso_mao_obra),
      equipe: split(query.tipo_recurso_equipe),
      csd: split(query.disponibilizado_csd),
    });
  }
}
