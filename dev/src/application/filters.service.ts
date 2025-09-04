import { Cache } from 'cache-manager';
import {
  FILTERS_REPOSITORY,
  IFiltersRepository,
} from 'src/domain/repositories/IFiltersRepository';
import { FiltersDto } from 'src/interface/dtos/filtersDto';

import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable } from '@nestjs/common';

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
      restricao,
      tecnico,
      statusProgramacao,
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
        this.filtersRepository.getData('status', ['id', 'status'], {
          onde: 'EXECUCAO',
        }),
      );
    }

    if (statusProgramacao) {
      result['statusProgramacao'] = await this.getCachedData(
        'status_programacao',
        () =>
          this.filtersRepository.getData('status_programacao', [
            'id',
            'status_programacao',
          ]),
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

    if (restricao) {
      result['restricao'] = await this.getCachedData('restricao', () =>
        this.filtersRepository.getData('restricoes', ['id', 'restricao']),
      );
    }

    if (tecnico) {
      result['tecnico'] = await this.getCachedData('tecnicos', () =>
        this.filtersRepository.getData('tecnicos', ['id', 'tecnico'], {
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

    await this.cacheManager.set(key, data, 60 * 2);

    return data;
  }
}
