import moment from 'moment';
import {
  CapacidadePorAnoMesRow,
  CONTINGENCY_REPOSITORY,
  ContingencyDashboard,
  IContingencyRepository,
} from 'src/domain/repositories/IContingencyRepository';

import { Inject, Injectable } from '@nestjs/common';

import {
  CreateContingencyDTO,
  DashboardFilterDTO,
} from '../../interface/dtos/contingencyDTO';

interface AggregatedEmergencyTeam {
  ano: number;
  mes: number;
  quantidade: number;
  valor: number;
}

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
    const filterMonth = this.resolveFilterMonth(query);

    const [
      recent,
      partner,
      laborRows,
      teamRows,
      csd,
      emergencyTeams,
      executionCapacity,
    ] = await Promise.all([
      this.contingencyRepository.findRecent(query),
      this.contingencyRepository.groupByParceira(query),
      this.contingencyRepository.groupByField('tipo_recurso_mao_obra', query),
      this.contingencyRepository.groupByField('tipo_recurso_equipe', query),
      this.contingencyRepository.groupByCsd(query),
      this.contingencyRepository.getEquipesEmergenciaComValor(
        query,
        filterMonth,
      ),
      this.contingencyRepository.getCapacidadePorAnoMes(query, filterMonth),
    ]);

    const aggregatedEmergencyTeams =
      this.aggregateEmergencyTeams(emergencyTeams);

    const yieldedPercentage = this.calculateYieldedPercentage(
      aggregatedEmergencyTeams,
      executionCapacity,
      filterMonth,
    );

    console.log(aggregatedEmergencyTeams);

    return {
      porcentagemCedida: yieldedPercentage,
      capacidadeMes: executionCapacity,
      equipesEmergencia: aggregatedEmergencyTeams,
      recentDates: recent.map((r) => ({
        date: r.dia_disponibilidade.toISOString().slice(0, 10),
        nome: r.novo_tabela_usuarios?.nome ?? null,
      })),
      parceira: partner,
      maoObra: this.sumByName(laborRows, 'quantidade_mao_obra'),
      equipe: this.sumByName(teamRows, 'quantidade_equipe'),
      csd,
    };
  }

  private resolveFilterMonth(filter?: DashboardFilterDTO): number {
    if (!filter?.dataInicial || !filter?.dataFinal) {
      return moment().month() + 1;
    }

    const start = moment(filter.dataInicial, 'DD/MM/YYYY');
    const end = moment(filter.dataFinal, 'DD/MM/YYYY');

    if (
      start.isValid() &&
      end.isValid() &&
      start.month() === end.month() &&
      start.year() === end.year()
    ) {
      return start.month() + 1;
    }

    return moment().month() + 1;
  }

  private aggregateEmergencyTeams(
    rows: {
      ano: number;
      mes: number;
      quantidade: number;
      valor: number;
    }[],
  ): AggregatedEmergencyTeam[] {
    const map = new Map<string, AggregatedEmergencyTeam>();

    for (const { ano, mes, quantidade, valor } of rows) {
      const key = `${ano}-${mes}`;
      const existing = map.get(key);

      if (existing) {
        existing.quantidade += quantidade;
        existing.valor += valor;
      } else {
        map.set(key, {
          ano,
          mes,
          quantidade,
          valor,
        });
      }
    }

    return Array.from(map.values());
  }

  private calculateYieldedPercentage(
    emergencyTeams: AggregatedEmergencyTeam[],
    monthlyCapacity: CapacidadePorAnoMesRow[],
    filterMonth: number,
  ): number | null {
    const capacity = monthlyCapacity.find((item) => item.mes === filterMonth);

    const emergency = emergencyTeams.find((item) => item.mes === filterMonth);

    if (!capacity || !emergency) return null;

    if (capacity.capacidade === 0) return null;

    return Math.round((emergency.quantidade / capacity.capacidade) * 100);
  }

  private sumByName(
    rows: {
      name: string;
      quantidade_mao_obra: number;
      quantidade_equipe: number;
      disponibilizado_csd: number;
    }[],
    sumField:
      'quantidade_mao_obra' | 'quantidade_equipe' | 'disponibilizado_csd',
  ): { name: string; value: number }[] {
    const map = new Map<string, number>();

    for (const row of rows) {
      map.set(row.name, (map.get(row.name) ?? 0) + (row[sumField] ?? 0));
    }

    return Array.from(map, ([name, value]) => ({ name, value }));
  }
}
