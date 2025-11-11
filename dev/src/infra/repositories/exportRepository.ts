import { Injectable } from '@nestjs/common';
import { IExportRepository } from 'src/domain/repositories/IExportRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class ExportRepository implements IExportRepository {
  constructor(private prisma: PrismaService) {}

  async exportWorksInPortfolio(): Promise<any> {
    return await this.prisma.exportacao_obras_carteira.findMany();
  }

  async exportCompletedWorks(): Promise<any> {
    return await this.prisma.exportacao_obras_executadas.findMany();
  }

  async exportSchedules(): Promise<any> {
    return await this.prisma.exportacao_programacoes_obras.findMany();
  }

  async exportExecutionCapacity(): Promise<any> {
    return await this.prisma.exportacao_capacidade_execucao.findMany();
  }

  async exportSuspensions(): Promise<any> {
    return await this.prisma.suspensoes.findMany({
      select: {
        obras: {
          select: {
            ovnota: true,
            status: { select: { status: true } },
            tipos: { select: { tipo_obra: true } },
            turmas: { select: { turma: true } },
            municipios: {
              select: {
                municipio: true,
                regionais: { select: { regional: true } },
              },
            },
          },
        },
        data: true,
        motivo: true,
      },
    });
  }

  async exportSuspensionsRemoved(): Promise<any> {
    return await this.prisma.suspensoes_retiradas.findMany({
      select: {
        obras: {
          select: {
            ovnota: true,
            tipos: { select: { tipo_obra: true } },
            turmas: { select: { turma: true } },
            municipios: {
              select: {
                municipio: true,
                regionais: { select: { regional: true } },
              },
            },
          },
        },
        status: { select: { status: true } },
        data_retirada: true,
      },
    });
  }

  async exportFinedWorks(startDate: Date, endDate: Date): Promise<any> {
    return await this.prisma.programacoes.findMany({
      where: {
        nome_responsavel_execucao: 'PARCEIRA',
        prog: { not: 0 },
        exec: 0,
        ...(startDate && endDate
          ? { data_prog: { gte: startDate, lte: endDate } }
          : {}),
      },
      select: {
        obras: {
          select: {
            ovnota: true,
            ordem_dci: true,
            diagrama: true,
            municipios: {
              select: { regionais: { select: { regional: true } } },
            },
            tipos: { select: { tipo_obra: true } },
            turmas: { select: { turma: true } },
          },
        },
        data_prog: true,
        hora_ini: true,
        hora_ter: true,
        prog: true,
        exec: true,
        num_dp: true,
        programacoes_restricao_execucao: { select: { restricao: true } },
        nome_responsavel_execucao: true,
      },
    });
  }
}
