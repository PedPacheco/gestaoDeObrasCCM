import moment from 'moment';
import {
  ENTRY_REPOSITORY,
  IEntryRepository,
} from 'src/domain/contracts/IEntryRepository';
import { EntryDayResponse } from 'src/domain/types';

import { Inject, Injectable } from '@nestjs/common';

import {
  GetEntryOfWorksByDayInput,
  GetEntryOfWorksByDayOutput,
  GetEntryOfWorksInput,
  GetValuesFromEntryOutput,
} from '../types';

@Injectable()
export class EntryService {
  constructor(
    @Inject(ENTRY_REPOSITORY) private entryRepository: IEntryRepository,
  ) {}

  async getValuesFromEntry(
    filters: GetEntryOfWorksInput,
  ): Promise<GetValuesFromEntryOutput[]> {
    const obras = await this.entryRepository.getValuesFromEntry(filters);

    const monthAbbreviations: { [key: number]: string } = {
      0: 'jan',
      1: 'fev',
      2: 'mar',
      3: 'abr',
      4: 'mai',
      5: 'jun',
      6: 'jul',
      7: 'ago',
      8: 'set',
      9: 'out',
      10: 'nov',
      11: 'dez',
    };

    const result = obras.reduce((acc, obra) => {
      const tipo = obra.tipos.tipo_obra;
      const grupo = obra.tipos.grupos.grupo.substring(0, 3);

      if (!acc[tipo]) {
        acc[tipo] = {
          tipo,
          grupo,
          total_entrada: 0,
          total_entrada_qtde: 0,
          ...Object.keys(monthAbbreviations).reduce((obj, month) => {
            const key = monthAbbreviations[month];
            obj[`${key}_entrada`] = 0;
            obj[`${key}_entrada_qtde`] = 0;
            return obj;
          }, {}),
        };
      }

      const month = obra.entrada.getUTCMonth();
      const monthKey = monthAbbreviations[month];
      const value = obra.mo_pend !== null ? obra.mo_pend : obra.mo_planejada;

      const grupoData = acc[tipo];

      grupoData[`${monthKey}_entrada`] += value;
      grupoData[`${monthKey}_entrada_qtde`] += 1;
      grupoData.total_entrada += obra.mo_planejada;
      grupoData.total_entrada_qtde += 1;

      return acc;
    }, {});

    return Object.values(result);
  }

  async getEntryOfWorksByDay(
    filters: GetEntryOfWorksByDayInput,
  ): Promise<GetEntryOfWorksByDayOutput> {
    const { dataFinal, dataInicial } = filters;

    const dateRange = {
      gte: moment(dataInicial, 'DD/MM/YYYY').toDate(),
      lte: moment(dataFinal, 'DD/MM/YYYY').toDate(),
    };

    const result = await this.entryRepository.getEntryOfWorksByDay(
      filters,
      dateRange,
    );

    let total_obras = 0;
    let total_mo_planejada = 0;
    let total_qtde_planejada = 0;

    const updatedWorks = result.map((item: EntryDayResponse) => {
      total_obras++;
      total_mo_planejada += item.mo_planejada;
      total_qtde_planejada += item.qtde_planejada;

      const prazo_fim = new Date(item.entrada);
      prazo_fim.setDate(prazo_fim.getDate() + item.prazo);

      return {
        id: item.id,
        ovnota: item.ovnota,
        pep: item.pep,
        diagrama: item.diagrama,
        ordem_dci: item.ordem_dci,
        ordem_dcd: item.ordem_dcd,
        ordem_dca: item.ordem_dca,
        ordem_dcim: item.ordem_dcim,
        entrada: item.entrada,
        prazo: item.prazo,
        prazo_fim,
        qtde_planejada: item.qtde_planejada,
        mo_planejada: item.mo_planejada,
        observ_obra: item.observ_obra,
        tipos: item.tipos.tipo_obra,
        turmas: item.turmas.turma,
        municipios: item.municipios.mun,
      };
    });

    return {
      works: updatedWorks,
      totals: {
        total_obras,
        total_mo_planejada,
        total_qtde_planejada,
      },
    };
  }
}
