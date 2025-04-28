import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { FiltersDto } from 'src/interface/dtos/filtersDto';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  FILTERS_REPOSITORY,
  IFiltersRepository,
} from '../repositories/IFiltersRepository';

@Injectable()
export class FiltersService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    @Inject(FILTERS_REPOSITORY) private filtersRepository: IFiltersRepository,
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
        this.filtersRepository.getData('regionais', ['id', 'regional'], {
          id: condition,
        }),
      );
    }

    if (parceira) {
      result['parceira'] = await this.getCachedData('parceiras', () =>
        this.filtersRepository.getData('turmas', ['id', 'turma'], {
          id_regional: condition,
        }),
      );
    }

    if (tipo) {
      result['tipo'] = await this.getCachedData('tiposObra', () =>
        this.filtersRepository.getData('tipos', [
          'id',
          'tipo_obra',
          'id_grupo',
        ]),
      );
    }

    if (municipio) {
      result['municipio'] = await this.getCachedData('municipios', () =>
        this.filtersRepository.getData('municipios', ['id', 'municipio'], {
          id_regional: condition,
        }),
      );
    }

    if (grupo) {
      result['grupo'] = await this.getCachedData('grupos', () =>
        this.filtersRepository.getData('grupos', ['id', 'grupo']),
      );
    }

    if (circuito) {
      result['circuito'] = await this.getCachedData('circuitos', () =>
        this.filtersRepository.getData('circuitos', ['id', 'circuito']),
      );
    }

    if (status) {
      result['status'] = await this.getCachedData('status', () =>
        this.filtersRepository.getData('status', ['id', 'status']),
      );
    }

    if (conjunto) {
      result['conjunto'] = await this.getCachedData('conjunto', () =>
        this.filtersRepository.getData('conjuntos', ['id', 'conjunto']),
      );
    }

    if (ovnota) {
      result['ovnota'] = await this.getCachedData('ovnota', () =>
        this.filtersRepository.getData('obras', ['id', 'ovnota'], {
          data_conclusao: null,
          municipios: { id_regional: condition },
        }),
      );
    }

    if (ovnotaExec) {
      result['ovnotaExec'] = await this.getCachedData('ovnotaExec', () =>
        this.filtersRepository.getData('obras', ['id', 'ovnota'], {
          data_conclusao: { not: null },
          municipios: { id_regional: condition },
        }),
      );
    }

    if (empreendimento) {
      result['empreendimento'] = await this.getCachedData(
        'empreendimento',
        () =>
          this.filtersRepository.getData(
            'empreendimento',
            ['id', 'empreendimento'],
            {
              id_regional: condition,
            },
          ),
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

    await this.cacheManager.set(key, data, 60 * 2);

    return data;
  }
}
