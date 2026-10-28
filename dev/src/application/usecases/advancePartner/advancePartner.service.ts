import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
} from '@nestjs/common';
import moment from 'moment';
import {
  ADVANCE_PARTNER_REPOSITORY,
  IAdvancePartnerRepository,
  ProcessedEliminacaoFilters,
} from 'src/domain/repositories/IAdvancePartnerRepository';
import { Prisma } from 'src/infra/generated/prisma/client';
import { CreateAdvancePartnerMonitoringDTO } from 'src/interface/dtos/advancePartnerDTO';
import { GetRestrictionsAdvancePartnerDTO } from 'src/interface/dtos/restrictionsDTO';

const REFLECTION_FIELDS = [
  'procReflexao',
  'prazoReflexao',
  'retrReflexao',
  'wpaReflexao',
  'cliReflexao',
] as const;

@Injectable()
export class AdvancePartnerService {
  constructor(
    @Inject(ADVANCE_PARTNER_REPOSITORY)
    private readonly advancePartnerRepository: IAdvancePartnerRepository,
  ) {}

  private parseEliminationFilters(
    filters: GetRestrictionsAdvancePartnerDTO,
  ): ProcessedEliminacaoFilters {
    const { dataInicial, dataFinal, idRegional, idParceira, responsabilidade } =
      filters;

    return {
      dataInicial: dataInicial
        ? moment(dataInicial, 'DD/MM/YYYY').toDate()
        : undefined,
      dataFinal: dataFinal
        ? moment(dataFinal, 'DD/MM/YYYY').toDate()
        : undefined,
      idRegional,
      idParceira,
      responsabilidade,
    };
  }

  async getRestrictionsAdvancePartner(
    filters: GetRestrictionsAdvancePartnerDTO,
  ) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.advancePartnerRepository.getRestrictionsAdvancePartner(
        processedFilters,
      );

    return rows.map((r) => {
      const total = Number(r.total);
      const sem = Number(r.sem_restricao);
      return {
        month: r.mes,
        total,
        withoutRestriction: sem,
        withRestriction: total - sem,
        pct: total > 0 ? Math.round((sem / total) * 100) : 0,
      };
    });
  }

  async getGripPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.advancePartnerRepository.getGripPartner(processedFilters);

    return rows.map((r) => {
      const total = Number(r.total);
      const executed = Number(r.executada);
      const partialExecuted = Number(r.executada_parcial);
      const notExecuted = Number(r.nao_executada);
      const notInformed = Number(r.nao_informada);
      return {
        week: r.semana,
        total,
        executed,
        partialExecuted,
        notExecuted,
        notInformed,
        pct: total > 0 ? Math.round((executed / total) * 100) : 0,
      };
    });
  }

  async getReaschedulingReasons(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    return await this.advancePartnerRepository.getReaschedulingReasons(
      processedFilters,
    );
  }

  async getSparklinesByPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);

    const { aderencia, eliminacao } =
      await this.advancePartnerRepository.getSparklinesByPartner(
        processedFilters,
      );

    const map = new Map<
      string,
      {
        aderencia: { semana: string; pct: number }[];
        eliminacao: { semana: string; pct: number }[];
      }
    >();

    for (const r of aderencia) {
      const p: string = r.parceira;

      if (!map.has(p)) map.set(p, { aderencia: [], eliminacao: [] });

      const total = Number(r.total);
      const exec = Number(r.executada);

      map.get(p)!.aderencia.push({
        semana: r.semana,
        pct: total > 0 ? Math.round((exec / total) * 100) : 0,
      });
    }

    for (const r of eliminacao) {
      const p: string = r.parceira;

      if (!map.has(p)) map.set(p, { aderencia: [], eliminacao: [] });

      const total = Number(r.total);
      const sem = Number(r.sem_restricao);

      map.get(p)!.eliminacao.push({
        semana: r.semana,
        pct: total > 0 ? Math.round((sem / total) * 100) : 0,
      });
    }

    return Array.from(map.entries()).map(([parceira, data]) => ({
      parceira,
      ...data,
    }));
  }

  async getWeeksByPartner(filters: GetRestrictionsAdvancePartnerDTO) {
    const processedFilters = this.parseEliminationFilters(filters);
    const rows =
      await this.advancePartnerRepository.getWeeksByPartner(processedFilters);
    return rows.map((r) => ({
      parceira: r.parceira,
      semanas: Number(r.semanas),
    }));
  }

  async saveIndicators(data: CreateAdvancePartnerMonitoringDTO): Promise<void> {
    this.assertPeriodNotInFuture(data.mesReferencia, data.anoReferencia);

    const payload: CreateAdvancePartnerMonitoringDTO = { ...data };
    for (const field of REFLECTION_FIELDS) {
      payload[field] = (data[field] ?? '').trim();
    }

    try {
      await this.advancePartnerRepository.upsertIndicators(payload);
    } catch (err) {
      throw this.mapPersistenceError(err);
    }
  }

  private assertPeriodNotInFuture(mes: number, ano: number): void {
    const now = new Date();
    const requested = ano * 12 + (mes - 1);
    const current = now.getFullYear() * 12 + now.getMonth();

    if (requested > current) {
      throw new BadRequestException(
        'Não é possível lançar indicadores para um mês futuro.',
      );
    }
  }

  private mapPersistenceError(err: unknown): unknown {
    if (!(err instanceof Prisma.PrismaClientKnownRequestError)) return err;

    switch (err.code) {
      case 'P2002': // dois pedidos para o mesmo período ao mesmo tempo
        return new ConflictException(
          'Os indicadores deste período estão a ser gravados por outro pedido. Tente novamente.',
        );
      case 'P2003': // fk_parceira
        return new BadRequestException('A parceira informada não existe.');
      case 'P2020': // valor fora do Decimal(5,2) / Decimal(15,2)
        return new BadRequestException(
          'Um dos valores informados está fora do intervalo permitido.',
        );
      default:
        return err; // erro inesperado: 500 e mensagem padrão no frontend
    }
  }
}
