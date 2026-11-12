import moment from 'moment';

import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import {
  CONTINGENCY_REPOSITORY,
  IContingencyRepository,
} from 'src/domain/contracts/IContingencyRepository';
import {
  CapacityByYearMonthResponse,
  EmergencyTeamResponse,
} from 'src/domain/types';
import {
  AggregatedEmergencyTeam,
  ContingencyDashboardOutput,
  ContingencyInput,
  CreateContingencyInput,
  GroupByFieldRow,
} from '../types';

const AVAILABILITY_DATE_FORMAT = 'YYYY-MM-DD';

@Injectable()
export class ContingencyService {
  constructor(
    @Inject(CONTINGENCY_REPOSITORY)
    private readonly contingencyRepository: IContingencyRepository,
  ) {}

  async create(data: CreateContingencyInput): Promise<void> {
    await this.contingencyRepository.create({
      dia_disponibilidade: this.parseAvailabilityDate(data.availabilityDate),
      id_parceira: data.partnerId,
      tipo_recurso_mao_obra: data.laborType,
      quantidade_mao_obra: data.laborQuantity,
      tipo_recurso_equipe: data.teamType,
      quantidade_equipe: data.teamQuantity,
      disponibilizado_csd: data.allocatedCsd,
      id_usuario: data.userId,
    });
  }

  async getDashboard(
    query: ContingencyInput = {},
  ): Promise<ContingencyDashboardOutput> {
    const filterMonth = this.resolveFilterMonth(query);

    const [
      recent,
      partner,
      laborRows,
      teamRows,
      csds,
      emergencyTeams,
      executionCapacity,
    ] = await Promise.all([
      this.contingencyRepository.findRecent(query),
      this.contingencyRepository.groupByPartner(query),
      this.contingencyRepository.groupByField('tipo_recurso_mao_obra', query),
      this.contingencyRepository.groupByField('tipo_recurso_equipe', query),
      this.contingencyRepository.groupByCsd(query),
      this.contingencyRepository.getEmergencyTeamsWithValue(query, filterMonth),
      this.contingencyRepository.getCapacityByYearMonth(query, filterMonth),
    ]);

    const aggregatedEmergencyTeams =
      this.aggregateEmergencyTeams(emergencyTeams);

    const yieldedPercentage = this.calculateYieldedPercentage(
      aggregatedEmergencyTeams,
      executionCapacity,
      filterMonth,
    );

    return {
      allocatedPercentage: yieldedPercentage,
      monthlyCapacity: executionCapacity.map((capacity) => ({
        capacity: capacity.capacidade,
        month: capacity.mes,
        value: capacity.valor,
        year: Number(capacity.ano),
      })),
      emergencyTeams: aggregatedEmergencyTeams,
      recentAnswers: recent.map((r) => ({
        date: r.dia_disponibilidade.toISOString().slice(0, 10),
        name: r.novo_tabela_usuarios?.nome ?? null,
      })),
      partners: partner,
      laborTypes: this.sumByName(laborRows, 'laborQuantity'),
      teamTypes: this.sumByName(teamRows, 'teamsQuantity'),
      csds,
    };
  }

  private resolveFilterMonth(filter?: ContingencyInput): number {
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
    rows: EmergencyTeamResponse[],
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
    monthlyCapacity: CapacityByYearMonthResponse[],
    filterMonth: number,
  ): number | null {
    const capacity = monthlyCapacity.find((item) => item.mes === filterMonth);

    const emergency = emergencyTeams.find((item) => item.mes === filterMonth);

    if (!capacity || !emergency) return null;

    if (capacity.capacidade === 0) return null;

    return Math.round((emergency.quantidade / capacity.capacidade) * 100);
  }

  private sumByName(
    rows: GroupByFieldRow[],
    sumField: keyof Omit<GroupByFieldRow, 'name'>,
  ): { name: string; value: number }[] {
    const map = new Map<string, number>();

    for (const row of rows) {
      map.set(row.name, (map.get(row.name) ?? 0) + (row[sumField] ?? 0));
    }

    return Array.from(map, ([name, value]) => ({ name, value }));
  }

  private parseAvailabilityDate(value: string): Date {
    const date = moment.utc(value, AVAILABILITY_DATE_FORMAT, true);

    if (!date.isValid()) {
      throw new BadRequestException(
        `Data de disponibilidade inválida: "${value}". Formato esperado: ${AVAILABILITY_DATE_FORMAT}`,
      );
    }

    return date.toDate();
  }
}
