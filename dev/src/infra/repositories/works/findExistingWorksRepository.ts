import { Injectable } from '@nestjs/common';
import {
  filtersOrders,
  IFindExistingWorksRepository,
} from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class FindExistingWorksRepository
  implements IFindExistingWorksRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findExistingWorks(works: string[]): Promise<string[]> {
    if (works.length === 0) return [];

    const existing = await this.prisma.obras.findMany({
      where: { ovnota: { in: works } },
      select: { ovnota: true },
    });

    return existing.map((work) => work.ovnota);
  }

  async findExistingOrders(orders: filtersOrders[]): Promise<string[]> {
    if (!orders.length) return [];

    const orderFields = [
      'ordem_dci',
      'ordem_dcd',
      'ordem_dca',
      'ordem_dcim',
    ] as const;

    const uniqueValues = orderFields.reduce(
      (acc, field) => {
        acc[field] = [...new Set(orders.map((o) => o[field]).filter(Boolean))];
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
  }
}
