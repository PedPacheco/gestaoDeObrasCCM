import {
  ExecutionCapacityInput,
  UpdateExecutionCapacityInput,
} from 'src/application/types';
import { IExecutionCapacityRepository } from 'src/domain/contracts/IExecutionCapacityRepository';
import { GetFinancialValuesResponse, GetResponse } from 'src/domain/types';

import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ExecutionCapacityRepository implements IExecutionCapacityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(filters: ExecutionCapacityInput): Promise<GetResponse[]> {
    const { ano, equipe, idParceira, idRegional } = filters;

    return await this.prisma.capacidade_execucao.findMany({
      select: {
        id: true,
        ano: true,
        regionais: { select: { regional: true } },
        turmas: { select: { turma: true } },
        id_regional: true,
        tipo: true,
        qtd_equipes_rfp: true,
        equipe: true,
        jan: true,
        fev: true,
        mar: true,
        abr: true,
        mai: true,
        jun: true,
        jul: true,
        ago: true,
        set: true,
        out: true,
        nov: true,
        dez: true,
      },
      where: {
        ano,
        ...(idParceira &&
          idParceira.length > 0 && {
            id_turma: { in: idParceira },
          }),
        ...(idRegional &&
          idRegional.length > 0 && {
            id_regional: { in: idRegional },
          }),
        ...(equipe &&
          equipe.length > 0 && {
            equipe: { in: equipe },
          }),
      },
      orderBy: [{ regionais: { id: 'asc' } }, { equipe: { sort: 'asc' } }],
    });
  }

  async getFinancialValue(
    filters: ExecutionCapacityInput,
  ): Promise<GetFinancialValuesResponse[]> {
    const { ano, equipe, idParceira, idRegional } = filters;

    return await this.prisma.capacidade_execucao.findMany({
      where: {
        ano,
        ...(idParceira &&
          idParceira.length > 0 && {
            id_turma: { in: idParceira },
          }),
        ...(idRegional &&
          idRegional.length > 0 && {
            id_regional: { in: idRegional },
          }),
        ...(equipe &&
          equipe.length > 0 && {
            equipe: { in: equipe },
          }),
      },
      select: {
        id: true,
        ano: true,
        regionais: { select: { regional: true } },
        turmas: { select: { turma: true } },
        should_cost: true,
        qtd_equipes_rfp: true,
        jan: true,
        fev: true,
        mar: true,
        abr: true,
        mai: true,
        jun: true,
        jul: true,
        ago: true,
        set: true,
        out: true,
        nov: true,
        dez: true,
      },
    });
  }

  async update(data: UpdateExecutionCapacityInput[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((item: UpdateExecutionCapacityInput) => {
        const { id, ...rest } = item;
        return this.prisma.capacidade_execucao.updateMany({
          where: {
            id,
          },
          data: rest,
        });
      }),
    );
  }
}
