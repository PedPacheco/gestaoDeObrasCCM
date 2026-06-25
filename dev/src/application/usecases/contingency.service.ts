import {
  CONTINGENCY_REPOSITORY,
  ContingencyDashboard,
  DashboardFilter,
  IContingencyRepository,
} from 'src/domain/repositories/IContingencyRepository';

import { Inject, Injectable } from '@nestjs/common';

import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from '../../interface/dtos/contingencyDTO';

// Regras de negócio do dashboard de contingência
const RECENT_DATES_LIMIT = 3;
const MS_PER_DAY = 86400000;
const BUSINESS_DAY_START = 1; // segunda-feira
const BUSINESS_DAY_END = 5; // sexta-feira

@Injectable()
export class ContingencyService {
  constructor(
    @Inject(CONTINGENCY_REPOSITORY)
    private readonly contingencyRepository: IContingencyRepository,
  ) {}

  async create(data: CreateContingencyDTO): Promise<void> {
    await this.contingencyRepository.create({
      dia_disponibilidade: new Date(data.dia_disponibilidade),
      id_parceira: data.idParceira,
      tipo_recurso_mao_obra: data.tipo_recurso_mao_obra,
      quantidade_mao_obra: data.quantidade_mao_obra,
      tipo_recurso_equipe: data.tipo_recurso_equipe,
      quantidade_equipe: data.quantidade_equipe,
      disponibilizado_csd: data.disponibilizado_csd,
      id_usuario: data.idUser,
    });
  }

  async getDashboard(
    query: DashboardFilterDTO = {},
  ): Promise<ContingencyDashboard> {
    const filter: DashboardFilter = {
      dataInicial: query.dataInicial,
      dataFinal: query.dataFinal,
      idParceira: query.idParceira,
      maoObra: query.tipo_recurso_mao_obra,
      equipe: query.tipo_recurso_equipe,
      csd: query.disponibilizado_csd,
    };

    const [total, sums, recent, parceira, maoObra, equipe, csd] =
      await Promise.all([
        this.contingencyRepository.count(filter),
        this.contingencyRepository.aggregateSums(filter),
        this.contingencyRepository.findRecent(filter, RECENT_DATES_LIMIT),
        this.contingencyRepository.groupByParceira(filter),
        this.contingencyRepository.groupByField(
          'tipo_recurso_mao_obra',
          filter,
        ),
        this.contingencyRepository.groupByField('tipo_recurso_equipe', filter),
        this.contingencyRepository.groupByField('disponibilizado_csd', filter),
      ]);

    const totalEquipe = sums.totalEquipe;
    const periodo = this.resolveEffectivePeriod(
      filter,
      sums.minDate,
      sums.maxDate,
    );

    let porcentagemCedida: number | null = null;
    let capacidadeMes: number | null = null;

    if (periodo) {
      capacidadeMes = await this.calcularCapacidadeMes(
        periodo.start,
        periodo.end,
        filter.idParceira,
      );
      porcentagemCedida = this.calcularPorcentagemCedida(
        totalEquipe,
        capacidadeMes,
      );
    }

    return {
      total,
      totalMaoObra: sums.totalMaoObra,
      totalEquipe,
      porcentagemCedida,
      capacidadeMes,
      recentDates: recent.map((r) => ({
        date: this.formatDate(r.dia_disponibilidade),
        nome: r.usuario?.nome ?? null,
      })),
      parceira,
      maoObra,
      equipe,
      csd,
    };
  }

  /**
   * Regra de negócio: o período efetivo do dashboard é o intervalo
   * informado no filtro (dataInicial/dataFinal); na ausência de um dos
   * extremos, usa-se o intervalo real das respostas existentes na base.
   */
  private resolveEffectivePeriod(
    filter: DashboardFilter,
    minDate: Date | null,
    maxDate: Date | null,
  ): { start: Date; end: Date } | null {
    const start = filter.dataInicial ? new Date(filter.dataInicial) : minDate;
    const end = filter.dataFinal ? new Date(filter.dataFinal) : maxDate;

    if (!start || !end) return null;
    return { start, end };
  }

  /**
   * Regra de negócio: capacidade total de equipes (equipe-dias) no período,
   * somando a capacidade diária do mês correspondente das parceiras
   * selecionadas, contabilizada apenas em dias úteis (segunda a sexta).
   */
  private async calcularCapacidadeMes(
    start: Date,
    end: Date,
    idParceira?: number[],
  ): Promise<number> {
    const turmas = [...new Set(idParceira)];
    if (!turmas.length) return 0;

    const startTs = this.toUtcDayTimestamp(start);
    const endTs = this.toUtcDayTimestamp(end);
    if (endTs < startTs) return 0;

    const anos = this.anosNoIntervalo(start, end);
    const capacidadeRows =
      await this.contingencyRepository.getCapacidadePorAnoMes(anos, turmas);

    const capacidadePorAnoMes = new Map<string, number>();
    for (const row of capacidadeRows) {
      capacidadePorAnoMes.set(`${row.ano}-${row.mes}`, Number(row.capacidade));
    }

    let total = 0;
    for (let ts = startTs; ts <= endTs; ts += MS_PER_DAY) {
      const dia = new Date(ts);
      const diaDaSemana = dia.getUTCDay(); // 0 dom .. 6 sáb

      if (this.isDiaUtil(diaDaSemana)) {
        const chave = `${dia.getUTCFullYear()}-${dia.getUTCMonth() + 1}`;
        total += capacidadePorAnoMes.get(chave) ?? 0;
      }
    }

    return total;
  }

  private calcularPorcentagemCedida(
    totalEquipe: number,
    capacidadeMes: number,
  ): number | null {
    return capacidadeMes > 0
      ? Math.round((totalEquipe / capacidadeMes) * 100)
      : null;
  }

  private isDiaUtil(diaDaSemana: number): boolean {
    return diaDaSemana >= BUSINESS_DAY_START && diaDaSemana <= BUSINESS_DAY_END;
  }

  private toUtcDayTimestamp(date: Date): number {
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  }

  private anosNoIntervalo(start: Date, end: Date): string[] {
    const anos = new Set<string>();
    for (let ano = start.getUTCFullYear(); ano <= end.getUTCFullYear(); ano++) {
      anos.add(String(ano));
    }
    return [...anos];
  }

  private formatDate(date: Date): string {
    return date.toISOString().slice(0, 10);
  }
}
