import { SuspensionWorkRequestInterface } from 'src/interface/types/works/suspensionInterface';
import { ISuspensionWorkRepository } from '../../../domain/contracts/works/ISuspensionWorkRepository';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class SuspensionWorkRepository implements ISuspensionWorkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: SuspensionWorkRequestInterface): Promise<void> {
    await this.prisma.suspensoes.create({
      data,
    });
  }

  async createMultiple(data: SuspensionWorkRequestInterface[]): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.suspensoes.createMany({
        data,
      });

      await tx.obras.updateMany({
        data: { id_status: 4 },
        where: { id: { in: data.map((work) => work.id_obra) } },
      });
    });
  }
}
