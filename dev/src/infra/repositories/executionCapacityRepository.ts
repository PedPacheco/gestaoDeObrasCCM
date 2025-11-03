import { Injectable } from '@nestjs/common';
import { IExecutionCapacityRepository } from 'src/domain/repositories/IExecutionCapacityRepository';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionCapacityFilter } from 'src/interface/types/executionCapacityInterface';

@Injectable()
export class ExecutionCapacityRepository
  implements IExecutionCapacityRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async get(filters: ExecutionCapacityFilter): Promise<any> {
    return await this.prisma.capacidade_execucao.findMany({
      select: {
        ano: true,
        regionais: { select: { regional: true } },
        turmas: { select: { turma: true } },
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
      where: filters,
    });
  }
}
