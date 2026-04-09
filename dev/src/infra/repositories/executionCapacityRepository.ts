import { Injectable } from '@nestjs/common';
import { IExecutionCapacityRepository } from 'src/domain/repositories/IExecutionCapacityRepository';
import { PrismaService } from '../prisma/prisma.service';

import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from 'src/interface/dtos/executionCapacityDTO';

@Injectable()
export class ExecutionCapacityRepository implements IExecutionCapacityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(filters: ExecutionCapacityDTO): Promise<any> {
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

  async getFinancialValue(filters: ExecutionCapacityDTO): Promise<any[]> {
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

  async update(data: UpdateExecutionCapacityDTO[]): Promise<void> {
    await this.prisma.$transaction(
      data.map((item: UpdateExecutionCapacityDTO) => {
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
