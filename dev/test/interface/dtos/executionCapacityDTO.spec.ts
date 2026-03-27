import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { ExecutionCapacityDTO } from 'src/interface/dtos/executionCapacityDTO';

describe('ExecutionCapacityDTO', () => {
  it('Should transform query params to correct type', () => {
    const executionCapacityFilters = {
      ano: '2025',
      idRegional: '1',
      idParceira: '1',
      equipe: 'LM',
    };

    const executionCapacityInstance = plainToInstance(
      ExecutionCapacityDTO,
      executionCapacityFilters,
    );

    expect(executionCapacityInstance).toEqual({
      ano: '2025',
      idRegional: [1],
      idParceira: [1],
      equipe: ['LM'],
    });
  });

  it('Should transform query params to correct type when not value sent', () => {
    const executionCapacityFilters = {
      ano: '2025',
      idRegional: '1',
      idParceira: '1',
      equipe: '',
    };

    const executionCapacityInstance = plainToInstance(
      ExecutionCapacityDTO,
      executionCapacityFilters,
    );

    expect(executionCapacityInstance).toEqual({
      ano: '2025',
      idRegional: [1],
      idParceira: [1],
      equipe: [],
    });
  });
});
