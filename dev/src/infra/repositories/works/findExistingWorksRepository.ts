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

  async findExistingMarketWorks(ovs: string[]): Promise<string[]> {
    if (ovs.length === 0) return [];

    const existing = await this.prisma.obras.findMany({
      where: { ovnota: { in: ovs } },
      select: { ovnota: true },
    });

    return existing.map((work) => work.ovnota);
  }

  async findExistingNotes(note: string): Promise<string[]> {
    const existing = await this.prisma.obras.findMany({
      where: { ovnota: note },
      select: { ovnota: true },
    });

    return existing.map((n) => n.ovnota);
  }

  async findExistingOrders(orders: filtersOrders): Promise<string[]> {
    const { ordem_dca, ordem_dcd, ordem_dcim, ordem_dci } = orders;

    const existing = await this.prisma.obras.findMany({
      where: {
        OR: [
          ordem_dci ? { ordem_dci } : undefined,
          ordem_dcd ? { ordem_dcd } : undefined,
          ordem_dca ? { ordem_dca } : undefined,
          ordem_dcim ? { ordem_dcim } : undefined,
        ].filter(Boolean),
      },
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
