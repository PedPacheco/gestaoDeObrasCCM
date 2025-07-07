import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import { ExecutionReportController } from 'src/interface/controllers/executionReport.controller';
import { mockUpdateExecutionReportDTO } from '../../../test/mocks/mocksExecutionReport';

describe('ExecutionReportController', () => {
  let controller: ExecutionReportController;
  let service: ExecutionReportService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExecutionReportController],
      providers: [
        {
          provide: ExecutionReportService,
          useValue: {
            findByWorkId: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          },
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

  describe('update', () => {
    it('Should call update service method with id and data received and return a successful reponse with the expected structure', async () => {
      jest.spyOn(service, 'update').mockResolvedValue(null);

      const result = await controller.update(1, mockUpdateExecutionReportDTO);

      expect(service.update).toHaveBeenCalledWith(
        1,
        mockUpdateExecutionReportDTO,
      );
      expect(result).toEqual({
        message: 'Atualização do relatório feita com sucesso',
        statusCode: 204,
      });
    });
  });

  describe('delete', () => {
    it('Should call delete service method with id and return a successful reponse with the expected structure', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue(null);

      const result = await controller.delete(1);

      expect(service.delete).toHaveBeenCalledWith(1);
      expect(result).toEqual({
        message: 'Relatório excluído com sucesso',
        statusCode: 204,
      });
    });
  });
});
