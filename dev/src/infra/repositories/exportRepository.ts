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

  async exportForecast(): Promise<any> {
    return await this.prisma.exportacao_forecast.findMany();
  }

  async exportRejections(): Promise<any> {
    return await this.prisma.programacoes_reprovacoes.findMany({
      select: {
        obras: { select: { ovnota: true } },
        data_prog: true,
        motivo: true,
        hora_ini: true,
        hora_ter: true,
        prog: true,
        descricao: true,
        equip_desligado: true,
        equipe_linha_morta: true,
        equipe_linha_viva: true,
        equipe_regularizacao: true,
        tipo_servico: true,
        observacao_programacao: true,
      },
    });
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

  async exportExecutionReport(): Promise<any> {
    return await this.prisma.relatorio_execucao.findMany({
      select: {
        id: true,
        criado_em: true,
        supervisor: true,
        liberado_ligacao_parcial: true,
        hora_inicio: true,
        hora_conclusao: true,
        contato_inicio: true,
        contato_termino: true,
        atraso: true,
        justificativa_atraso: true,
        possui_equipamentos_instalados: true,
        equipamentos_aplicados: true,
        potencia_equipamento_aplicado: true,
        patrimonio_equipamento_aplicado: true,
        instalacao_equipamento_aplicado: true,
        possui_equipamentos_retirados: true,
        equipamentos_retirados: true,
        potencia_equipamento_retirado: true,
        patrimonio_equipamento_retirado: true,
        instalacao_equipamento_retirado: true,
        alteracoes_execucao: true,
        observacoes_gerais: true,
        chave_provisoria_instalada: true,
        referencia_chave_provisoria: true,
        chave_provisoria_retirada: true,
        referencia_chave_provisoria_retirada: true,
        motivo: true,
        usuario: { select: { nome_usuario: true } },
        obras: {
          select: {
            ovnota: true,
            diagrama: true,
            ordem_dci: true,
            ordem_dca: true,
            ordem_dcd: true,
            ordem_dcim: true,
            executado: true,
            tipos: { select: { tipo_obra: true } },
            status: { select: { status: true } },
            turmas: { select: { turma: true } },
          },
        },
        programacoes: {
          select: {
            data_prog: true,
            prog: true,
            exec: true,
            num_dp: true,
            hora_ini: true,
            hora_ter: true,
            chave_provisoria: true,
          },
        },
      },
    });
  }
}
