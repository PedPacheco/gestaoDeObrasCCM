import { Injectable } from '@nestjs/common';
import { IGetWorksDetailsRepository } from 'src/domain/contracts/works/management/IGetWorksDetailsRepository';
import { WorkDetailsRepositoryResponse } from 'src/domain/types';
import {
  toWorkDetails,
  workDetailsSelect,
} from 'src/infra/mappers/works/management/getDetail.mapper';

import { PrismaService } from 'src/infra/prisma/prisma.service';
import { workIdentifierWhere } from 'src/infra/shared/workIdentifierWhere';

@Injectable()
export class GetWorksDetailsRepository implements IGetWorksDetailsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: number): Promise<WorkDetailsRepositoryResponse> {
    const row = await this.prisma.obras.findFirst({
      where: workIdentifierWhere(id),
      select: workDetailsSelect,
    });

    return row ? toWorkDetails(row) : null;
  }
}
