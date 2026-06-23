import {
  ContingencyDashboard,
  DashboardFilter,
  IContingencyRepository,
} from 'src/domain/repositories/IContingencyRepository';

import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PARCEIRAS } from '../../interface/dtos/contingencyDTO';
import { PrismaService } from '../prisma/prisma.service';

// Converte o nome da parceira (contingência) para o nome da turma (capacidade).
// Ex.: "START - VALE" -> "START VALE"; "EDP - Time próprio (técnicos)" -> "EDP".
function parceiraToTurma(parceira: string): string {
  if (parceira.toUpperCase().startsWith('EDP')) return 'EDP';
  return parceira.replace(' - ', ' ');
}

@Injectable()
export class ContingencyRepository implements IContingencyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    data: Prisma.recursos_contingenciaUncheckedCreateInput,
  ): Promise<void> {
    await this.prisma.recursos_contingencia.create({ data });
  }

  private buildWhere(
    filter?: DashboardFilter,
  ): Prisma.recursos_contingenciaWhereInput {
    const where: Prisma.recursos_contingenciaWhereInput = {};

    if (filter?.dataInicial || filter?.dataFinal) {
      where.dia_disponibilidade = {};
      if (filter.dataInicial) {
        where.dia_disponibilidade.gte = new Date(filter.dataInicial);
      }
      if (filter.dataFinal) {
        where.dia_disponibilidade.lte = new Date(filter.dataFinal);
      }
    }

    if (filter?.parceira?.length) where.parceira = { in: filter.parceira };
    if (filter?.maoObra?.length) {
      where.tipo_recurso_mao_obra = { in: filter.maoObra };
    }
    if (filter?.equipe?.length) {
      where.tipo_recurso_equipe = { in: filter.equipe };
    }
    if (filter?.csd?.length) where.disponibilizado_csd = { in: filter.csd };

    return where;
  }

  async getDashboard(filter?: DashboardFilter): Promise<ContingencyDashboard> {
    const where = this.buildWhere(filter);

    const groupByField = async (
      field:
        | 'parceira'
        | 'tipo_recurso_mao_obra'
        | 'tipo_recurso_equipe'
        | 'disponibilizado_csd',
    ) => {
      const result = await this.prisma.recursos_contingencia.groupBy({
        by: [field],
        where,
        _count: { _all: true },
      });

      return result.map((row) => ({
        name: row[field] as string,
        value: row._count._all,
      }));
    };

    const [total, sums, recent, parceira, maoObra, equipe, csd] =
      await Promise.all([
        this.prisma.recursos_contingencia.count({ where }),
        this.prisma.recursos_contingencia.aggregate({
          where,
          _sum: { quantidade_mao_obra: true, quantidade_equipe: true },
          _min: { dia_disponibilidade: true },
          _max: { dia_disponibilidade: true },
        }),
        this.prisma.recursos_contingencia.findMany({
          where,
          orderBy: { criado_em: 'desc' },
          take: 3,
          select: {
            dia_disponibilidade: true,
            usuario: { select: { nome: true } },
          },
        }),
        groupByField('parceira'),
        groupByField('tipo_recurso_mao_obra'),
        groupByField('tipo_recurso_equipe'),
        groupByField('disponibilizado_csd'),
      ]);

    const totalEquipe = sums._sum.quantidade_equipe ?? 0;

    // Período efetivo: filtro de data se houver; senão, o intervalo real das respostas
    const start = filter?.dataInicial
      ? new Date(filter.dataInicial)
      : sums._min.dia_disponibilidade;
    const end = filter?.dataFinal
      ? new Date(filter.dataFinal)
      : sums._max.dia_disponibilidade;

    let porcentagemCedida: number | null = null;
    let capacidadeMes: number | null = null;
    if (start && end) {
      capacidadeMes = await this.capacidadeEquipeDias(
        start,
        end,
        filter?.parceira,
      );
      porcentagemCedida =
        capacidadeMes > 0
          ? Math.round((totalEquipe / capacidadeMes) * 100)
          : null;
    }

    return {
      total,
      totalMaoObra: sums._sum.quantidade_mao_obra ?? 0,
      totalEquipe,
      porcentagemCedida,
      capacidadeMes,
      recentDates: recent.map((r) => ({
        date: r.dia_disponibilidade.toISOString().slice(0, 10),
        nome: r.usuario?.nome ?? null,
      })),
      parceira,
      maoObra,
      equipe,
      csd,
    };
  }

  // Capacidade total de equipes (equipe-dias) no período: para cada dia útil
  // (seg–sex), soma a capacidade diária do mês correspondente das parceiras
  // selecionadas (ou todas, se nenhuma).
  private async capacidadeEquipeDias(
    start: Date,
    end: Date,
    parceiras?: string[],
  ): Promise<number> {
    const turmas = [
      ...new Set((parceiras?.length ? parceiras : PARCEIRAS).map(parceiraToTurma)),
    ];
    if (!turmas.length) return 0;

    const startTs = Date.UTC(
      start.getUTCFullYear(),
      start.getUTCMonth(),
      start.getUTCDate(),
    );
    const endTs = Date.UTC(
      end.getUTCFullYear(),
      end.getUTCMonth(),
      end.getUTCDate(),
    );
    if (endTs < startTs) return 0;

    // Anos cobertos pelo período (capacidade_execucao.ano é varchar 'YYYY')
    const anos = new Set<string>();
    for (
      let y = start.getUTCFullYear();
      y <= end.getUTCFullYear();
      y++
    ) {
      anos.add(String(y));
    }

    const rows = await this.prisma.$queryRaw<
      Array<{ ano: string; mes: number; capacidade: number }>
    >(Prisma.sql`
      SELECT ce.ano AS ano, m.mes AS mes, SUM(COALESCE(m.valor, 0))::int AS capacidade
      FROM construcao_sp.capacidade_execucao ce
      JOIN construcao_sp.turmas t ON t.id = ce.id_turma
      CROSS JOIN LATERAL (VALUES
        (1, ce.jan), (2, ce.fev), (3, ce.mar), (4, ce.abr),
        (5, ce.mai), (6, ce.jun), (7, ce.jul), (8, ce.ago),
        (9, ce.set), (10, ce."out"), (11, ce.nov), (12, ce.dez)
      ) AS m(mes, valor)
      WHERE ce.ano IN (${Prisma.join([...anos])})
        AND t.turma IN (${Prisma.join(turmas)})
      GROUP BY ce.ano, m.mes
    `);

    // mapa: capacidade diária somada por ano+mês
    const capByAnoMes = new Map<string, number>();
    for (const r of rows) {
      capByAnoMes.set(`${r.ano}-${r.mes}`, Number(r.capacidade));
    }

    let total = 0;
    for (let ts = startTs; ts <= endTs; ts += 86400000) {
      const d = new Date(ts);
      const dow = d.getUTCDay(); // 0 dom .. 6 sáb
      if (dow >= 1 && dow <= 5) {
        const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
        total += capByAnoMes.get(key) ?? 0;
      }
    }

    return total;
  }
}
