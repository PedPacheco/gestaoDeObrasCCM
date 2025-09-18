import { IFiltersRepository } from 'src/domain/repositories/IFiltersRepository';
import { PrismaService } from '../prisma/prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class FiltersRepository implements IFiltersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getData(
    table: string,
    selectFields: string[],
    conditions?: Record<string, any>,
  ): Promise<any[]> {
    console.log(conditions);
    return await this.prisma[table].findMany({
      where: conditions,
      select: selectFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {},
      ),
    });
  }
}
