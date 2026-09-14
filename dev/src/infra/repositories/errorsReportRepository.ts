import { Injectable } from '@nestjs/common';
import { IErrorsReportRepository } from 'src/domain/contracts/IErrorsReportRepository';
import { PrismaService } from '../prisma/prisma.service';
import {
  DivergentConclusionResponse,
  ExecutionDifferentialResponse,
  RepeatedWorksResponse,
  ScheduleErrorResponse,
  UndefinedItemsResponse,
  WorksWithoutYearPlanResponse,
  ZeroCapexResponse,
} from 'src/domain/types';

@Injectable()
export class ErrorsReportRepository implements IErrorsReportRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findUndefinedItems(
    idRegional: number,
  ): Promise<UndefinedItemsResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        data_conclusao: true,
        municipios: { select: { municipio: true, id_regional: true } },
        tipos: { select: { tipo_obra: true } },
        turmas: { select: { turma: true } },
        circuitos: { select: { circuito: true } },
      },
      where: {
        data_conclusao: null,
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
        OR: [
          { id_gpm: 1 },
          { prazo: 0 },
          { id_tipo: 1 },
          { id_turma: 1 },
          { id_circuito: 1 },
        ],
      },
    });
  }

  async findScheduleError(
    idRegional: number,
  ): Promise<ScheduleErrorResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        turmas: { select: { turma: true } },
        executado: true,
        programacoes: { select: { prog: true }, where: { exec: null } },
      },
      where: {
        data_conclusao: null,
        programacoes: {
          some: { exec: null },
        },
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
      },
      orderBy: { id: 'asc' },
    });
  }

  async findZeroCapex(idRegional?: number): Promise<ZeroCapexResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dcim: true,
        entrada: true,
        municipios: { select: { mun: true } },
        tipos: { select: { tipo_obra: true } },
        mo_planejada: true,
        qtde_planejada: true,
      },
      where: {
        OR: [
          {
            AND: [
              { OR: [{ mo_planejada: 0 }, { mo_planejada: null }] },
              ...(idRegional
                ? [{ municipios: { id_regional: idRegional } }]
                : []),
            ],
          },
          {
            AND: [
              { qtde_planejada: null },
              { OR: [{ tipos: { id_grupo: 2 } }, { tipos: { id_grupo: 3 } }] },
              ...(idRegional
                ? [{ municipios: { id_regional: idRegional } }]
                : []),
            ],
          },
        ],
      },
      orderBy: { entrada: 'asc' },
    });
  }

  async findExecutionDifferential(
    idRegional?: number,
  ): Promise<ExecutionDifferentialResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        executado: true,
        programacoes: {
          select: { exec: true },
        },
      },
      where: {
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
      },
    });
  }

  async findDivergentConclusion(
    idRegional?: number,
  ): Promise<DivergentConclusionResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        data_conclusao: true,
        programacoes: {
          select: { data_prog: true },
          orderBy: { data_prog: 'desc' },
          take: 1,
        },
      },
      where: {
        NOT: { data_conclusao: null },
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
      },
    });
  }

  async findWorksWithoutYearPlan(
    idRegional?: number,
  ): Promise<WorksWithoutYearPlanResponse[]> {
    return await this.prisma.obras.findMany({
      select: { id: true, ovnota: true, ordem_dci: true, ano_plan: true },
      where: {
        data_conclusao: null,
        tipos: { id_grupo: 2 },
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
      },
    });
  }

  async findRepeatedWorks(
    idRegional?: number,
  ): Promise<RepeatedWorksResponse[]> {
    return await this.prisma.obras.findMany({
      select: {
        id: true,
        ovnota: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
        diagrama: true,
      },
      where: {
        OR: [
          { NOT: { diagrama: null } },
          { NOT: { ordem_dci: null } },
          { NOT: { ordem_dca: null } },
          { NOT: { ordem_dcd: null } },
          { NOT: { ordem_dcim: null } },
        ],
        ...(idRegional ? { municipios: { id_regional: idRegional } } : {}),
      },
    });
  }
}
