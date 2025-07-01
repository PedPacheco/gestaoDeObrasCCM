import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { ExecutionReportController } from 'src/interface/controllers/executionReport.controller';

describe('ExecutionReportController', () => {
  let controller: ExecutionReportController;
  let service: ExecutionReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionReportController],
      providers: [
        {
          provide: ExecutionReportService,
          useValue: { findByWorkId: jest.fn() },
        },
      ],
    }).compile();

    controller = module.get<ExecutionReportController>(
      ExecutionReportController,
    );
    service = module.get<ExecutionReportService>(ExecutionReportService);
  });

  describe('findByWorkId', () => {
    it('Should call findByWorkId service method with the provided work ID and return a successful response with the expected structure', async () => {
      jest.spyOn(service, 'findByWorkId').mockResolvedValue([]);

      const result = await controller.findByWorkId(1);

      expect(service.findByWorkId).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        data: [],
        message: 'Relatórios de execução retornados com sucesso',
        statusCode: 200,
      });
    });
  });
});
