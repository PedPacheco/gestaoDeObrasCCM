import { ExecutionCapacityService } from 'src/application/usecases/executionCapacity.service';
import { EXECUTION_CAPACITY_REPOSITORY } from 'src/domain/repositories/IExecutionCapacityRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockDataSumFinancialValues,
  mockFormattedDataExecutionCapacity,
  mockResponseDataExecutionCapacityRepository,
  mockResponseDataFinancialValuesExecutionCapacityRepository,
} from '../../mocks/mockExecutionCapacityService';

describe('ExecutionCapacityService', () => {
  let service: ExecutionCapacityService;

  const mockRepository = {
    get: jest.fn(),
    getFinancialValue: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionCapacityService,
        { provide: EXECUTION_CAPACITY_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExecutionCapacityService>(ExecutionCapacityService);
  });

  afterEach(jest.clearAllMocks);

  describe('get', () => {
    it('should call method get with all filters and return formatted data', async () => {
      mockRepository.get.mockResolvedValue(
        mockResponseDataExecutionCapacityRepository,
      );

      const filters = {
        year: '2025',
        partnerId: 1,
        regionalId: 1,
        teams: 'LM',
      };

      const response = await service.get(filters);

      expect(response).toEqual(mockFormattedDataExecutionCapacity);
      expect(mockRepository.get).toHaveBeenCalledWith({
        ano: '2025',
        id_turma: 1,
        id_regional: 1,
        equipe: 'LM',
      });
    });

    it('should call method get without filters and return formatted data', async () => {
      mockRepository.get.mockResolvedValue(
        mockResponseDataExecutionCapacityRepository,
      );

      const filters = {
        year: '2025',
      };

      const response = await service.get(filters);

      expect(response).toEqual(mockFormattedDataExecutionCapacity);
      expect(mockRepository.get).toHaveBeenCalledWith({
        ano: '2025',
      });
    });
  });

  describe('getFinancialValues', () => {
    it('should call getFinancialValues and calculate the sum of values of execution capacity', async () => {
      mockRepository.getFinancialValue.mockResolvedValue(
        mockResponseDataFinancialValuesExecutionCapacityRepository,
      );

      const response = await service.getFinancialValue('2026');

      expect(mockRepository.getFinancialValue).toHaveBeenCalled();
      expect(response).toEqual(mockDataSumFinancialValues);
    });
  });

  describe('update', () => {
    it('Should call update method and this method call repository', async () => {
      mockRepository.update.mockResolvedValue(undefined);

      await service.update([{ id: 1, jan: 3 }]);

      expect(mockRepository.update).toHaveBeenCalledWith([{ id: 1, jan: 3 }]);
    });
  });
});
