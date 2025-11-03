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
      jest.spyOn(service, 'get').mockResolvedValue([]);

      const result = await controller.getExecutionCapacity({ year: '2025' });

      expect(service.get).toHaveBeenCalledWith({ year: '2025' });
      expect(result).toEqual({
        data: [],
        message: 'Capacidade de execução retornada',
        statusCode: 200,
      });
    });
  });
});
