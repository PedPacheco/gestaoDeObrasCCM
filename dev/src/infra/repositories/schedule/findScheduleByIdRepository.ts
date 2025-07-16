import { Injectable } from '@nestjs/common';
import { IFindScheduleByIdRepository } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class FindScheduleByIdRepository implements IFindScheduleByIdRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: number): Promise<any> {
    return await this.prisma.programacoes.findFirst({
      where: { id },
    });
  }
}
