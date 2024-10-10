import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import {
  GetPendingScheduleValuesDTO,
  GetScheduleValuesDTO,
  GetTotalValuesScheduleDTO,
  GetValueWeeklyScheduleDTO,
} from 'src/config/dto/scheduleDTO';

describe('ScheduleDTO', () => {
  it('Should transform query params to correct type', () => {
    const getValueWeeklyScheduleFilters = {
      idRegional: '1',
      idMunicipio: '1',
      idGrupo: '1',
      idTipo: '1',
      idParceira: '1',
      executado: 'false',
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

    const getPendingScheduleValuesFilters = {
      idParceira: 1,
      idRegional: 1,
    };

    const getValueWeeklyScheduleInstance = plainToInstance(
      GetValueWeeklyScheduleDTO,
      getValueWeeklyScheduleFilters,
    );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      getValueWeeklyScheduleFilters,
    );

    const getTotalValuesScheduleInstance = plainToInstance(
      GetTotalValuesScheduleDTO,
      getTotalValuesScheduleFilters,
    );

    const getPendingScheduleValuesInstance = plainToInstance(
      GetPendingScheduleValuesDTO,
      getPendingScheduleValuesFilters,
    );

    expect(getValueWeeklyScheduleInstance).toEqual({
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    });
    expect(getScheduleValuesInstance).toEqual({
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      executado: false,
    });
    expect(getTotalValuesScheduleInstance).toEqual({
      idRegional: 1,
      idMunicipio: 1,
      idGrupo: 1,
      idTipo: 1,
      idParceira: 1,
      idCircuito: 1,
      ano: 2024,
    });
    expect(getPendingScheduleValuesInstance).toEqual({
      idParceira: 1,
      idRegional: 1,
    });
  });

  it('Should transform query params to correct type', () => {
    const filters = {
      executado: 'true',
    };

    const getValueWeeklyScheduleInstance = plainToInstance(
      GetValueWeeklyScheduleDTO,
      filters,
    );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      filters,
    );

    expect(getValueWeeklyScheduleInstance).toEqual({
      executado: true,
    });
    expect(getScheduleValuesInstance).toEqual({
      executado: true,
    });
  });

  it('Should transform query params to correct type', () => {
    const filters = {
      executado: undefined,
    };

    const getValueWeeklyScheduleInstance = plainToInstance(
      GetValueWeeklyScheduleDTO,
      filters,
    );

    const getScheduleValuesInstance = plainToInstance(
      GetScheduleValuesDTO,
      filters,
    );

    expect(getValueWeeklyScheduleInstance).toEqual({
      executado: undefined,
    });
    expect(getScheduleValuesInstance).toEqual({
      executado: undefined,
    });
  });
});
