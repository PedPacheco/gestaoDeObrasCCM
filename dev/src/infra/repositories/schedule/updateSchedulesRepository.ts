import { Injectable } from '@nestjs/common';
import { IUpdateSchedulesRepository } from 'src/domain/repositories/schedule/IUpdateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class UpdateSchedulesRepository implements IUpdateSchedulesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: any): Promise<void> {
    await this.prisma.programacoes.update({
      where: { id: data.id },
      data,
    });
  }
}
