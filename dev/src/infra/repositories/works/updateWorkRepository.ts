import { IUpdateWorkRepository } from 'src/domain/repositories/works/IUpdateWorkRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { Injectable } from '@nestjs/common';

@Injectable()
export class UpdateWorkRepository implements IUpdateWorkRepository {
  constructor(private readonly prisma: PrismaService) {}

  async update(data: UpdateWorkDTO, id: number): Promise<void> {
    await this.prisma.obras.update({
      where: { id },
      data,
    });
  }
}
