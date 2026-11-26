import { Inject, Injectable } from '@nestjs/common';
import moment from 'moment';
import {
  CONTINGENCY_REPOSITORY,
  IContingencyRepository,
} from 'src/domain/contracts/IContingencyRepository';
import { ValidationError } from 'src/domain/errors/domain.error';
import {
  CapacityByYearMonth,
  ContingencyGroupItem,
  ContingencyResourceDispatches,
  CountItem,
  EmergencyTeam,
  RecentContingency,
} from 'src/domain/types';
import {
  ContingencyDashboardOutput,
  ContingencyInput,
  CreateContingencyInput,
  EmergencyTeamOutput,
  MonthlyCapacityOutput,
  QuantityField,
  RecentAnswerOutput,
} from '../types';

const AVAILABILITY_DATE_FORMAT = 'YYYY-MM-DD';

/** Dias úteis considerados por mês no cálculo da capacidade das equipas */
const WORKING_DAYS_PER_MONTH = 22;

/** Capacidade Mês = quantidade de equipas/dia × dias úteis do mês */
const toMonthlyCapacity = (teamsPerDay: number): number =>
  teamsPerDay * WORKING_DAYS_PER_MONTH;

@Injectable()
export class ContingencyService {
  constructor(
    @Inject(CONTINGENCY_REPOSITORY)
    private readonly contingencyRepository: IContingencyRepository,
  ) {}

  async create(data: CreateContingencyInput): Promise<void> {
    await this.contingencyRepository.create({
      ...data,
      availabilityDate: this.parseAvailabilityDate(data.availabilityDate),
    });
  }

  async getDashboard(
    query: ContingencyInput = {},
  ): Promise<ContingencyDashboardOutput> {
    const filter = this.withDefaultPeriod(query);

    const [
      recent,
      partnersRows,
      laborGroups,
      teamGroups,
      csdsRows,
      emergencyTeams,
      capacity,
    ] = await Promise.all([
      this.contingencyRepository.findRecent(filter),
      this.contingencyRepository.groupByPartner(filter),
      this.contingencyRepository.groupByField('laborType', filter),
      this.contingencyRepository.groupByField('teamType', filter),
      this.contingencyRepository.groupByCsd(filter),
      this.contingencyRepository.getEmergencyTeamsWithValue(filter),
      this.contingencyRepository.getCapacityByYearMonth(filter),
    ]);

    const ALL_QUANTITIES: readonly QuantityField[] = [
      'laborQuantity',
      'teamsQuantity',
    ];

    const aggregatedTeams = this.aggregateEmergencyTeams(emergencyTeams);
    const partners = this.sumByName(partnersRows, ALL_QUANTITIES);
    const csds = this.sumByName(csdsRows, ALL_QUANTITIES);

    return {
      allocatedPercentage: this.calculateYieldedPercentage(
        aggregatedTeams,
        capacity,
      ),
      monthlyCapacity: capacity.map(this.toMonthlyCapacityOutput),
      emergencyTeams: aggregatedTeams,
      recentAnswers: recent.map(this.toRecentAnswerOutput),
      partners,
      laborTypes: this.sumByName(laborGroups, 'laborQuantity'),
      teamTypes: this.sumByName(teamGroups, 'teamsQuantity'),
      csds,
    };
  }

  async findContingencyResourceDispatches(
    query: ContingencyInput = {},
  ): Promise<ContingencyResourceDispatches[]> {
    const filter = this.withDefaultPeriod(query);

    return await this.contingencyRepository.findContingencyResourceDispatches(
      filter,
    );
  }

  // ─── Output (formato da resposta: fica na application) ─────────────

  private toMonthlyCapacityOutput = (
    c: CapacityByYearMonth,
  ): MonthlyCapacityOutput => ({
    year: String(c.year),
    month: c.month,
    capacity: toMonthlyCapacity(c.capacity),
    value: c.value,
  });

  private toRecentAnswerOutput = (
    r: RecentContingency,
  ): RecentAnswerOutput => ({
    id: r.id,
    date: r.availabilityDate.toISOString().slice(0, 10),
    name: r.userName,
    partner: r.partner,
  });

  // ─── Regras: vão para domain/rules no PR 6 (6c/6e) ────────────────

  private aggregateEmergencyTeams(
    rows: EmergencyTeam[],
  ): EmergencyTeamOutput[] {
    const map = new Map<string, EmergencyTeamOutput>();

    for (const row of rows) {
      const key = `${row.year}-${row.month}`;
      const existing = map.get(key);

      if (existing) {
        existing.quantity += row.quantity;
        existing.value += row.value;
      } else {
        map.set(key, { ...row });
      }
    }

    return Array.from(map.values());
  }

  /**
   * Percentagem cedida no período: Impacto Mês / Capacidade Mês.
   * Capacidade Mês = equipas/dia × 22 dias úteis.
   */
  private calculateYieldedPercentage(
    emergencyTeams: EmergencyTeam[],
    capacity: CapacityByYearMonth[],
  ): number | null {
    const totalCapacity = capacity.reduce(
      (total, c) => total + toMonthlyCapacity(c.capacity),
      0,
    );
    const totalImpact = emergencyTeams.reduce(
      (total, t) => total + t.quantity,
      0,
    );

    if (!totalCapacity) return null;

    return Math.round((totalImpact / totalCapacity) * 100);
  }

  private sumByName(
    rows: ContingencyGroupItem[],
    fields: QuantityField | readonly QuantityField[],
  ): CountItem[] {
    const keys = Array.isArray(fields) ? fields : [fields];

    const map = new Map<string, number>();

    for (const row of rows) {
      const rowTotal = keys.reduce((acc, key) => acc + (row[key] ?? 0), 0);
      map.set(row.name, (map.get(row.name) ?? 0) + rowTotal);
    }

    return Array.from(map, ([name, value]) => ({ name, value }));
  }

  // ─── Input ─────────────────────────────────────────────────────────

  private withDefaultPeriod(query: ContingencyInput): ContingencyInput {
    if (query.mesInicial || query.mesFinal) return query;

    const currentMonth = moment.utc().format('YYYY-MM');
    return { ...query, mesInicial: currentMonth, mesFinal: currentMonth };
  }

  private parseAvailabilityDate(value: string): Date {
    const date = moment.utc(value, AVAILABILITY_DATE_FORMAT, true);

    if (!date.isValid()) {
      throw new ValidationError(
        `Data de disponibilidade inválida: "${value}". Formato esperado: ${AVAILABILITY_DATE_FORMAT}`,
      );
    }

    return date.toDate();
  }
}
