import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  GetMonthlySummaryDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
} from 'src/interface/dtos/scheduleDTO';

describe('ScheduleDTO', () => {
  it('Should transform query params to correct type', () => {
    // const getValueWeeklyScheduleFilters = {
    //   idRegional: '1',
    //   idMunicipio: '1',
    //   idGrupo: '1',
    //   idTipo: '1',
    //   idParceira: '1',
    //   executado: 'false',
    // };

    const getScheduleValuesFilters = {
      data: '01/2025',
      tipoFiltro: 'month',
      idRegional: '1',
      idMunicipio: '1',
      idGrupo: '1',
      idTipo: '1',
      idParceira: '1',
      ovnota: '123543',
      executado: 'false',
      pendente: 'false',
      page: '0',
    };

    const getTotalValuesScheduleFilters = {
      idRegional: '1',
      idMunicipio: '1',
      idGrupo: '1',
      idTipo: '1',
      idParceira: '1',
      idCircuito: '1',
      ano: '2024',
    };

    const getMonthlySummaryFilters = {
      date: '11/2024',
      idRegional: '1',
      idGrupo: '1',
      idTipo: '1',
      idParceira: '1',
    };

    // const getValueWeeklyScheduleInstance = plainToInstance(
    //   GetValueWeeklyScheduleDTO,
    //   getValueWeeklyScheduleFilters,
    // );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      getScheduleValuesFilters,
    );

    const getTotalValuesScheduleInstance = plainToInstance(
      GetTotalValuesScheduleDTO,
      getTotalValuesScheduleFilters,
    );

    const getMonthlySummaryInstance = plainToInstance(
      GetMonthlySummaryDTO,
      getMonthlySummaryFilters,
    );

    // expect(getValueWeeklyScheduleInstance).toEqual({
    //   idRegional: [1],
    //   idMunicipio: [1],
    //   idGrupo: [1],
    //   idTipo: [1],
    //   idParceira: [1],
    //   executado: false,
    // });
    expect(getScheduleValuesInstance).toEqual({
      data: '01/2025',
      tipoFiltro: 'month',
      ovnota: '123543',
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      executado: false,
      pendente: false,
      page: 0,
    });
    expect(getTotalValuesScheduleInstance).toEqual({
      idRegional: [1],
      idMunicipio: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
      idCircuito: [1],
      ano: 2024,
    });
    expect(getMonthlySummaryInstance).toEqual({
      date: '11/2024',
      idRegional: [1],
      idGrupo: [1],
      idTipo: [1],
      idParceira: [1],
    });
  });

  it('Should transform query params to correct type', () => {
    // const filters = {
    //   executado: 'true',
    // };

    const getScheduleFilters = {
      executado: 'true',
      pendente: 'true',
    };

    // const getValueWeeklyScheduleInstance = plainToInstance(
    //   GetValueWeeklyScheduleDTO,
    //   filters,
    // );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      getScheduleFilters,
    );

    // expect(getValueWeeklyScheduleInstance).toEqual({
    //   executado: true,
    // });
    expect(getScheduleValuesInstance).toEqual({
      executado: true,
      pendente: true,
    });
  });

  it('Should transform query params to correct type', () => {
    // const filters = {
    //   executado: undefined,
    //   idRegional: undefined,
    // };

    const getScheduleFilters = {
      executado: undefined,
      pendente: undefined,
      idRegional: undefined,
    };

    // const getValueWeeklyScheduleInstance = plainToInstance(
    //   GetValueWeeklyScheduleDTO,
    //   filters,
    // );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      getScheduleFilters,
    );

    // expect(getValueWeeklyScheduleInstance).toEqual({
    //   executado: undefined,
    //   idRegional: [],
    // });
    expect(getScheduleValuesInstance).toEqual({
      executado: undefined,
      pendente: undefined,
      idRegional: [],
    });
  });
});
