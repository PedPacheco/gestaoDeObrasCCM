import { IFiltersRepository } from 'src/domain/contracts/IFiltersRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FiltersRepository implements IFiltersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getData<T>(
    table: string,
    selectFields: string[],
    conditions?: Record<string, unknown>,
  ): Promise<T[]> {
    const orderField = selectFields[1];

    return await this.prisma[table].findMany({
      where: conditions,
      select: selectFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {},
      ),
      orderBy: { [orderField]: 'asc' },
    });
  }
}
