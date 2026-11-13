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
  ContingencyDashboardOutput,
  ContingencyInput,
  CreateContingencyInput,
  EmergencyTeamRow,
  GroupByFieldRow,
  MonthlyCapacityRow,
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
    const filter = this.withDefaultPeriod(query);

    const [
      recent,
      partners,
      laborRows,
      teamRows,
      csds,
      emergencyTeams,
      executionCapacity,
    ] = await Promise.all([
      this.contingencyRepository.findRecent(filter),
      this.contingencyRepository.groupByPartner(filter),
      this.contingencyRepository.groupByField('tipo_recurso_mao_obra', filter),
      this.contingencyRepository.groupByField('tipo_recurso_equipe', filter),
      this.contingencyRepository.groupByCsd(filter),
      this.contingencyRepository.getEmergencyTeamsWithValue(filter),
      this.contingencyRepository.getCapacityByYearMonth(filter),
    ]);

    const emergencyTeamRows = this.aggregateEmergencyTeams(emergencyTeams);

    const monthlyCapacityRows = this.toMonthlyCapacityOutput(executionCapacity);

    return {
      allocatedPercentage: this.calculateYieldedPercentage(
        emergencyTeamRows,
        monthlyCapacityRows,
      ),
      monthlyCapacity: executionCapacity.map((capacity) => ({
        capacity: capacity.capacidade,
        month: capacity.mes,
        value: capacity.valor,
        year: capacity.ano,
      })),
      emergencyTeams: emergencyTeamRows,
      recentAnswers: recent.map((r) => ({
        id: r.id,
        date: r.dia_disponibilidade.toISOString().slice(0, 10),
        name: r.novo_tabela_usuarios?.nome ?? null,
        partner: r.turmas.turma ?? null,
      })),
      partners,
      laborTypes: this.sumByName(laborRows, 'laborQuantity'),
      teamTypes: this.sumByName(teamRows, 'teamsQuantity'),
      csds,
    };
  }

  private withDefaultPeriod(query: ContingencyInput): ContingencyInput {
    if (query.mesInicial || query.mesFinal) return query;

    const currentMonth = moment.utc().format('YYYY-MM');
    return { ...query, mesInicial: currentMonth, mesFinal: currentMonth };
  }

  private aggregateEmergencyTeams(
    rows: EmergencyTeamResponse[],
  ): EmergencyTeamRow[] {
    const map = new Map<string, EmergencyTeamRow>();

    for (const { ano, mes, quantidade, tipo, valor } of rows) {
      const key = `${ano}-${mes}`;
      const existing = map.get(key);

      if (existing) {
        existing.quantity += Number(quantidade);
        existing.value += Number(valor);
      } else {
        map.set(key, {
          year: ano,
          month: Number(mes),
          type: tipo,
          quantity: Number(quantidade),
          value: Number(valor),
        });
      }
    }

    return Array.from(map.values());
  }

  private toMonthlyCapacityOutput(
    rows: CapacityByYearMonthResponse[],
  ): MonthlyCapacityRow[] {
    return rows.map((item) => ({
      year: item.ano,
      month: Number(item.mes),
      capacity: Number(item.capacidade),
      value: Number(item.valor),
    }));
  }

  /** Percentagem cedida no período: total de equipas / capacidade total. */
  private calculateYieldedPercentage(
    emergencyTeams: EmergencyTeamRow[],
    monthlyCapacity: MonthlyCapacityRow[],
  ): number | null {
    const totalCapacity = monthlyCapacity.reduce(
      (total, item) => total + item.capacity,
      0,
    );
    const totalEmergency = emergencyTeams.reduce(
      (total, item) => total + item.quantity,
      0,
    );

    if (!totalCapacity) return null;

    return Math.round((totalEmergency / totalCapacity) * 100);
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
