import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionCapacityService } from 'src/application/executionCapacity.service';
import { ExecutionCapacityController } from 'src/interface/controllers/executionCapacity.controller';

describe('ExecutionReportController', () => {
  let controller: ExecutionCapacityController;
  let service: ExecutionCapacityService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionCapacityController],
      providers: [
        {
          provide: ExecutionCapacityService,
          useValue: {
            get: jest.fn(),
            getFinancialValue: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ExecutionCapacityController>(
      ExecutionCapacityController,
    );
    service = module.get<ExecutionCapacityService>(ExecutionCapacityService);
  });

  describe('getExecutionCapacity', () => {
    it('Should call getExecutionCapacity service method and return a successful response with the expected structure', async () => {
      const mockFinancialValues = [
        {
          ano: '2025',
          regional: 'Sjc',
          parceira: 'Engelmig',
          jan: 0,
          fev: 0,
          mar: 0,
          abr: 0,
          mai: 0,
          jun: 0,
          jul: 0,
          ago: 0,
          set: 0,
          out: 0,
          nov: 0,
          dez: 0,
        },
      ];

      jest.spyOn(service, 'get').mockResolvedValue([]);
      jest
        .spyOn(service, 'getFinancialValue')
        .mockResolvedValue(mockFinancialValues);

      const result = await controller.getExecutionCapacity({ year: '2025' });

      expect(service.get).toHaveBeenCalledWith({ year: '2025' });
      expect(result).toEqual({
        data: {
          financialValues: mockFinancialValues,
          executionCapacityValues: [],
        },
        message: 'Capacidade de execução retornada',
        statusCode: 200,
      });
    });
  });

  describe('updateExecutionCapacity', () => {
    it('Should call updateExecutionCapacity service method and return a successful response with the expected structure', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(undefined);

      const result = await controller.updateExecutionCapacity([
        { id: 1, jan: 3 },
      ]);

      expect(service.update).toHaveBeenCalledWith([{ id: 1, jan: 3 }]);
      expect(result).toEqual({
        message: 'Atualizado valores da capacidade de execução',
        statusCode: 200,
      });
    });
  });
});
