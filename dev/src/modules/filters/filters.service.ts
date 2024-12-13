import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { FiltersDto } from 'src/config/dto/filtersDto';
import { PrismaService } from 'src/config/prisma/prisma.service';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private prisma: PrismaService,
  ) {}

  async getFilters(
    {
      parceira,
      regional,
      tipo,
      circuito,
      grupo,
      municipio,
      status,
      conjunto,
      ovnota,
      empreendimento,
      ovnotaExec,
    }: FiltersDto,
    condition?: any,
  ) {
    const result = {};

    if (regional) {
      result['regional'] = await this.getCachedData('regionais', () =>
        this.getData('regionais', ['id', 'regional'], { id: condition }),
      );
    }

    if (parceira) {
      result['parceira'] = await this.getCachedData('parceiras', () =>
        this.getData('turmas', ['id', 'turma']),
      );
    }

    if (tipo) {
      result['tipo'] = await this.getCachedData('tiposObra', () =>
        this.getData('tipos', ['id', 'tipo_obra', 'id_grupo']),
      );
    }

    if (municipio) {
      result['municipio'] = await this.getCachedData('municipios', () =>
        this.getData('municipios', ['id', 'municipio'], {
          id_regional: condition,
        }),
      );
    }

    if (grupo) {
      result['grupo'] = await this.getCachedData('grupos', () =>
        this.getData('grupos', ['id', 'grupo']),
      );
    }

    if (circuito) {
      result['circuito'] = await this.getCachedData('circuitos', () =>
        this.getData('circuitos', ['id', 'circuito']),
      );
    }

    if (status) {
      result['status'] = await this.getCachedData('status', () =>
        this.getData('status', ['id', 'status']),
      );
    }

    if (conjunto) {
      result['conjunto'] = await this.getCachedData('conjunto', () =>
        this.getData('conjuntos', ['id', 'conjunto']),
      );
    }

    if (ovnota) {
      result['ovnota'] = await this.getCachedData('ovnota', () =>
        this.getData('obras', ['id', 'ovnota'], {
          data_conclusao: null,
          municipios: { id_regional: condition },
        }),
      );
    }

    if (ovnotaExec) {
      result['ovnotaExec'] = await this.getCachedData('ovnotaExec', () =>
        this.getData('obras', ['id', 'ovnota'], {
          data_conclusao: { not: null },
          municipios: { id_regional: condition },
        }),
      );
    }

    if (empreendimento) {
      result['empreendimento'] = await this.getCachedData(
        'empreendimento',
        () =>
          this.getData('empreendimento', ['id', 'empreendimento'], {
            id_regional: condition,
          }),
      );
    }

    return result;
  }

  async getCachedData<T>(key: string, fetchData: () => Promise<T>): Promise<T> {
    const cachedData = await this.cacheManager.get<T>(key);

    if (cachedData) {
      return cachedData;
    }

    const data = await fetchData();

    await this.cacheManager.set(key, data, 3600000);

    return data;
  }

  async getData(
    table: string,
    selectFields: string[],
    conditions?: Record<string, any>,
  ): Promise<any[]> {
    return await this.prisma[table].findMany({
      where: conditions,
      select: selectFields.reduce(
        (acc, field) => ({ ...acc, [field]: true }),
        {},
      ),
    });
  }
}
