import { Injectable } from '@nestjs/common';
import { IGetServicesByWorkIdRepository } from 'src/domain/repositories/services/IGetServicesByWorkIdRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

@Injectable()
export class GetServicesByWorkIdRepository
  implements IGetServicesByWorkIdRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async get(id: number) {
    return await this.prisma.servicos.findMany({
      where: { id_obra: id },
    });
  }
}
