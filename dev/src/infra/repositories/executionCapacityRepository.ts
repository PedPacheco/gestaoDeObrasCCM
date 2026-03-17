import { Injectable } from '@nestjs/common';
import { IExecutionCapacityRepository } from 'src/domain/repositories/IExecutionCapacityRepository';
import { PrismaService } from '../prisma/prisma.service';
import { ExecutionCapacityFilter } from 'src/interface/types/executionCapacityInterface';
import { UpdateExecutionCapacityDTO } from 'src/interface/dtos/executionCapacityDTO';

@Injectable()
export class ExecutionCapacityRepository implements IExecutionCapacityRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(filters: ExecutionCapacityFilter): Promise<any> {
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
      where: filters,
      orderBy: [{ regionais: { id: 'asc' } }, { equipe: { sort: 'asc' } }],
    });
  }

  async getFinancialValue(
    year: string,
    turma?: number[],
    regional?: number[],
  ): Promise<any[]> {
    return await this.prisma.capacidade_execucao.findMany({
      where: {
        ano: year,
        ...(turma &&
          turma.length > 0 && {
            id_turma: { in: turma },
          }),
        ...(regional &&
          regional.length > 0 && {
            id_regional: { in: regional },
          }),
      },
      select: {
        id: true,
        ano: true,
        regionais: { select: { regional: true } },
        turmas: { select: { turma: true } },
        should_cost: true,
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
