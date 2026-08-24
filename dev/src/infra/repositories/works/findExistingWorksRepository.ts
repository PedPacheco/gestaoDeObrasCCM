import { Injectable, Logger } from '@nestjs/common';
import {
  filtersOrders,
  IFindExistingWorksRepository,
} from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class FindExistingWorksRepository implements IFindExistingWorksRepository {
  private readonly logger = new Logger(FindExistingWorksRepository.name);
  constructor(private readonly prisma: PrismaService) {}

  async findExistingWorks(
    works: string[],
  ): Promise<{ id: number; ovnota: string }[]> {
    try {
      if (works.length === 0) return [];
      const existing = await this.prisma.obras.findMany({
        where: { ovnota: { in: works } },
        select: { id: true, ovnota: true },
      });

      return existing.map((work) => ({ id: work.id, ovnota: work.ovnota }));
    } catch (error) {
      this.logger.error(`Erro ao buscar obra de mercado:`, error.stack);
      throw error;
    }
  }

  async findExistingWorksOnSuspension(
    works: { ovnota: string; ordemDiagrama: string }[],
  ): Promise<{ id: number; ovnota: string }[]> {
    try {
      if (works.length === 0) return [];

      const existing = await this.prisma.obras.findMany({
        where: {
          OR: works.map((w) => ({
            AND: [
              { ovnota: w.ovnota },
              {
                OR: [
                  { ordem_dci: w.ordemDiagrama },
                  { ordem_dca: w.ordemDiagrama },
                  { ordem_dcd: w.ordemDiagrama },
                  { ordem_dcim: w.ordemDiagrama },
                  { diagrama: w.ordemDiagrama },
                ],
              },
            ],
          })),
        },
        select: { id: true, ovnota: true },
      });

      return existing.map((work) => ({ id: work.id, ovnota: work.ovnota }));
    } catch (error: any) {
      this.logger.error(`Erro ao buscar obra de mercado:`, error.stack);
      throw error;
    }
  }

  async findExistingNotes(filters: any[]): Promise<
    {
      id: number;
      ovnota: string;
      ordemDci: string;
      ordemDcd: string;
      ordemDca: string;
      ordemDcim: string;
    }[]
  > {
    try {
      if (filters.length === 0) return [];

      const existing = await this.prisma.obras.findMany({
        where: { OR: filters },
        select: {
          id: true,
          ovnota: true,
          ordem_dci: true,
          ordem_dca: true,
          ordem_dcd: true,
          ordem_dcim: true,
        },
      });

      return existing.map((work) => ({
        id: work.id,
        ovnota: work.ovnota,
        ordemDci: work.ordem_dci,
        ordemDcd: work.ordem_dcd,
        ordemDca: work.ordem_dca,
        ordemDcim: work.ordem_dcim,
      }));
    } catch (error) {
      this.logger.error(`Erro ao buscar obra de mercado:`, error.stack);
      throw error;
    }
  }

  async findExistingOrders(orders: filtersOrders[]): Promise<string[]> {
    try {
      if (!orders.length) return [];

      const orderFields = [
        'ordem_dci',
        'ordem_dcd',
        'ordem_dca',
        'ordem_dcim',
      ] as const;

      const uniqueValues = orderFields.reduce(
        (acc, field) => {
          acc[field] = [
            ...new Set(orders.map((o) => o[field]).filter(Boolean)),
          ];
          return acc;
        },
        {} as Record<string, string[]>,
      );

      const orFilters = Object.entries(uniqueValues)
        .filter(([, values]) => values.length > 0)
        .map(([field, values]) => ({ [field]: { in: values } }));

      if (!orFilters.length) return [];

      const existing = await this.prisma.obras.findMany({
        where: { OR: orFilters },
        select: {
          ordem_dci: true,
          ordem_dcd: true,
          ordem_dca: true,
          ordem_dcim: true,
        },
      });

      return existing
        .flatMap((ord) => [
          ord.ordem_dci,
          ord.ordem_dcd,
          ord.ordem_dca,
          ord.ordem_dcim,
        ])
        .filter(Boolean);
    } catch (error) {
      this.logger.error(`Erro ao buscar ordens`, error.stack);
      throw error;
    }
  }
}
